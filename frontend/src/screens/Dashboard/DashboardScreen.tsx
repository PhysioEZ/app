import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import {
    MdLightMode, MdDarkMode, MdNotifications, MdClose, MdAccountBalanceWallet,
    MdPersonAdd, MdScience, MdFeedback, MdNotificationsOff, MdAccessTime
} from 'react-icons/md';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { useTheme } from '../../hooks/useTheme';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface DashboardStats {
  registration: {
    today: { registration: number; appointments: number };
    total: { registration: number; in_queue: number };
  };
  inquiry: {
    today: { general: number; test_inquiry: number };
    total: { general: number; test_inquiry: number };
  };
  patients: {
    today: { enrolled: number; ongoing: number };
    total: { enrolled: number; discharged: number };
  };
  tests: {
    today: { scheduled: number; conducted: number };
    total: { in_queue: number; conducted: number };
  };
  payments: {
    today: { 
      received: number; 
      dues: number;
      breakdown: { registrations: number; tests: number; treatments: number };
    };
    total: { received: number; dues: number };
  };
  schedule: Array<{
    patient_name: string;
    appointment_time: string;
    status: string;
    type?: string;
  }>;
}

interface Notification {
    notification_id: number;
    message: string;
    link_url: string;
    is_read: number;
    created_at: string;
    first_name: string;
    last_name: string;
}

const DashboardScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const lastToastedIdRef = React.useRef<number>(Number(localStorage.getItem('p_EZ_rec_last_notif_id')) || 0);

    // Audio Context Management
    const audioCtxRef = React.useRef<AudioContext | null>(null);
    const audioUnlockedRef = React.useRef<boolean>(false);

    useEffect(() => {
        const unlockAudio = () => {
            // Only create context on explicit user interaction
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            // Attempt to resume
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume().then(() => {
                    audioUnlockedRef.current = true;
                }).catch(e => console.error("Audio resume failed", e));
            } else {
                audioUnlockedRef.current = true;
            }
            
            // Remove listeners once unlocked
            if (audioCtxRef.current.state === 'running') {
                window.removeEventListener('click', unlockAudio);
                window.removeEventListener('touchstart', unlockAudio);
                window.removeEventListener('keydown', unlockAudio);
            }
        };

        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);
        window.addEventListener('keydown', unlockAudio);

        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    const playNotificationSound = () => {
        if (!audioCtxRef.current || !audioUnlockedRef.current) return;
        try {
            const ctx = audioCtxRef.current;
             // Double check state
             if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
                return;
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
            
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            // Squelch audio errors
        }
    };
  
  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          branch_id: user?.branch_id || 1,
          employee_id: (user as any)?.employee_id || user?.id 
        }),
      });
      const json = await response.json();
      if (json.status === 'success') {
        setStats(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
      if (!user) return;
      try {
          // Fallback to id if employee_id is missing (TS workaround/data fallback)
          const empId = (user as any).employee_id || user.id; 
          const res = await fetch(`${API_URL}/notifications.php?employee_id=${empId}`);
          const json = await res.json();
          if (json.status === 'success') {
              setNotifications(json.data);
              setUnreadCount(json.unread_count);

              // Check for new notifications to alert
              const unreadNotifications = json.data.filter((n: Notification) => n.is_read === 0);
              if (unreadNotifications.length > 0) {
                  const newest = unreadNotifications[0];
                  if (newest.notification_id > lastToastedIdRef.current) {
                      // Play Sound if unlocked
                      playNotificationSound();

                      // Haptic Feedback (Only if unlocked/interacted)
                      if (audioUnlockedRef.current) {
                           // Simple safe vibrate check
                           const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;
                           if (canVibrate) {
                               Haptics.notification({ type: NotificationType.Success }).catch(() => {});
                           }
                      }
                      
                      lastToastedIdRef.current = newest.notification_id;
                      localStorage.setItem('p_EZ_rec_last_notif_id', newest.notification_id.toString());
                  }
              }
          }
      } catch (e) {
          console.error("Failed to fetch notifications", e);
      }
  };

  const markAsRead = async (id: number) => {
      try {
          await fetch(`${API_URL}/notifications.php`, {
              method: 'POST',
              body: JSON.stringify({ action: 'mark_read', notification_id: id })
          });
          // Optimistic update
          setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) { console.error(e); }
  };

  const markAllAsRead = async () => {
      if (!user) return;
      try {
          const empId = (user as any).employee_id || user.id;
          await fetch(`${API_URL}/notifications.php`, {
              method: 'POST',
              body: JSON.stringify({ action: 'mark_all_read', employee_id: empId })
          });
          setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
          setUnreadCount(0);
      } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchDashboard();
    fetchNotifications();
    // Poll notifications every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val);
  };

  const timeAgo = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + "y ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + "mo ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + "d ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + "h ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + "m ago";
      return "Just now";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-surface dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-primary-container border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- Material 3 Components ---

  const HeroCard = () => (
    <div className="relative overflow-hidden bg-primary rounded-[28px] p-6 shadow-lg shadow-primary/20 text-on-primary mb-6 animate-scale-in">
        {/* Background Decorative Ripples */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-black/10 blur-2xl"></div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-2 opacity-90">
                <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <MdAccountBalanceWallet size={18} className="text-white" />
                </div>
                <span className="text-sm font-medium tracking-wide">Total Collections</span>
            </div>

            <div className="mb-6 pl-1">
                <h2 className="text-4xl font-normal tracking-tight mb-1 text-white">
                    {stats ? formatCurrency(stats.payments.today.received) : '₹0'}
                </h2>
                <p className="text-white/70 text-xs font-medium tracking-wide">Today's Revenue</p>
            </div>

            {/* Breakdown Pills */}
            {stats && (
                <div className="flex gap-2 flex-wrap">
                    {[
                        { label: 'Consultation', val: stats.payments.today.breakdown.registrations },
                        { label: 'Tests', val: stats.payments.today.breakdown.tests },
                        { label: 'Treatment', val: stats.payments.today.breakdown.treatments }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-black/20 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/10">
                            <span className="text-[10px] text-white/80 font-bold uppercase">{item.label}</span>
                            <span className="text-xs font-bold text-white">{formatCurrency(item.val).replace('₹', '')}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );

  const QuickAction = ({ label, icon: Icon, onClick, delay }: any) => (
      <button 
        onClick={onClick}
        className="flex flex-col items-center gap-2 animate-slide-up"
        style={{ animationDelay: delay }}
      >
          <div className="w-16 h-16 rounded-[20px] bg-gray-100 hover:bg-teal-50 dark:!bg-gray-800 dark:hover:!bg-gray-700 transition-colors duration-300 flex items-center justify-center text-gray-700 dark:!text-gray-200 shadow-sm active:scale-95 transform">
              <Icon size={26} />
          </div>
          <span className="text-xs font-medium text-gray-600 dark:!text-gray-300 text-center leading-tight max-w-[64px]">{label}</span>
      </button>
  );

  const QueueBar = ({ label, count, colorClass, total = 20 }: any) => (
    <div className="mb-5 last:mb-0">
        <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-900 dark:!text-gray-100">{label}</span>
            <span className="text-xs font-bold text-primary bg-primary-container px-2 py-0.5 rounded-md text-on-primary-container dark:!bg-teal-900 dark:!text-teal-200">
                {count} Waiting
            </span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:!bg-gray-700">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass} relative`}
                style={{ width: `${Math.min((count / total) * 100, 100)}%` }}
            >
            </div>
        </div>
    </div>
  );

  const MetricCard = ({ label, value, icon: Icon, colorClass, delay }: any) => (
      <div className="bg-surface dark:bg-gray-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm border border-surface-variant/50 dark:border-gray-700 animate-slide-up" style={{ animationDelay: delay }}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
              <Icon size={24} />
          </div>
          <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{label}</p>
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">{value}</h4>
          </div>
      </div>
  );

  // Time-based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // ... (keeping existing layout logic)

  // ... (keeping existing logic)

  return (
    <div className="flex flex-col h-full bg-surface dark:bg-gray-950 relative">
      
      {/* Primary Gradient Background Mesh - Stronger */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent pointer-events-none z-0 dark:from-primary/10" />

      {/* M3 Top Bar */}
      <header className="px-5 py-4 pt-10 flex items-center justify-between sticky top-0 z-20 bg-transparent backdrop-blur-none">
        <div className="relative z-10">
           <div className="flex items-center gap-2 mb-0.5">
             <p className="text-sm font-medium text-gray-600 dark:!text-gray-400">
               {getGreeting()},
             </p>
           </div>
           <h1 className="text-2xl font-normal text-primary dark:!text-primary-container tracking-tight">
             {user?.name?.split(' ')[0] || 'User'}
           </h1>
        </div>
        
        <div className="flex items-center gap-2 relative z-10">
          {/* Theme Toggle */}
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault(); 
              toggleTheme();
            }} 
            className="w-10 h-10 rounded-full bg-surface/40 hover:bg-surface/60 backdrop-blur-sm flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform border border-white/20 dark:border-white/10 shadow-sm"
          >
            {theme === 'dark' ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
          </button>

          {/* Notifications */}
          <button 
            type="button"
            onClick={() => setShowNotifications(true)} 
            className="w-10 h-10 rounded-full bg-surface/40 hover:bg-surface/60 backdrop-blur-sm flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform relative border border-white/20 dark:border-white/10 shadow-sm"
          >
            <MdNotifications size={20} />
            {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface dark:ring-gray-950"></span>
            )}
          </button>
          
          {/* Profile */}
          <button onClick={() => navigate('/profile')} className="ml-1 active:scale-95 transition-transform">
             <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary text-sm font-bold shadow-md shadow-primary/20 border border-white/20 dark:border-white/10">
                {user?.name?.charAt(0) || 'U'}
             </div>
          </button>
        </div>
      </header>

      {/* M3 Notification Modal - Centered Dialog */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             {/* Backdrop */}
             <div 
               className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
               onClick={() => setShowNotifications(false)}
             />
             
             {/* Modal Content */}
             <div className="relative w-full max-w-[340px] bg-surface dark:bg-gray-900 rounded-[28px] shadow-2xl flex flex-col max-h-[70vh] animate-scale-in overflow-hidden border border-outline-variant/20 dark:border-gray-800">
                <div className="p-5 pb-3 shrink-0 flex items-center justify-between border-b border-outline-variant/10 dark:border-gray-800">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h3>
                    <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1.5 -mr-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <MdClose size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-2 custom-scrollbar flex-1">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                            <MdNotificationsOff size={40} className="mb-3 opacity-50" />
                            <p className="text-sm font-medium">No new notifications</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {notifications.map((notif) => (
                                <div 
                                    key={notif.notification_id} 
                                    className={`p-3.5 rounded-xl transition-all relative group cursor-pointer ${notif.is_read ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'bg-primary-container/20 dark:bg-primary/20 hover:bg-primary-container/30 dark:hover:bg-primary/30'}`}
                                    onClick={() => {
                                        if (!notif.is_read) markAsRead(notif.notification_id);
                                        if (notif.link_url && notif.link_url.startsWith('chat_with_employee_id:')) {
                                            const targetId = notif.link_url.split(':')[1];
                                            navigate('/chat', { state: { targetUserId: parseInt(targetId) } });
                                            setShowNotifications(false);
                                        }
                                    }}
                                >
                                    <div className="flex gap-3 items-start">
                                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notif.is_read ? 'bg-transparent' : 'bg-primary dark:bg-primary'}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug mb-1 ${notif.is_read ? 'text-gray-600 dark:text-gray-400 font-normal' : 'text-gray-900 dark:text-white font-semibold'}`}>
                                                {notif.message}
                                            </p>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500">{timeAgo(notif.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {unreadCount > 0 && (
                    <div className="p-3 border-t border-outline-variant/10 dark:border-gray-800 shrink-0 bg-surface/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <button 
                            onClick={markAllAsRead} 
                            className="w-full py-2.5 rounded-full text-white font-medium text-sm bg-primary hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            Mark all as read
                        </button>
                    </div>
                )}
                
                {/* View All Link */}
                <div className="p-3 border-t border-outline-variant/10 dark:border-gray-800 shrink-0 text-center">
                    <button 
                        onClick={() => {
                            setShowNotifications(false);
                            navigate('/notifications');
                        }}
                        className="text-sm font-bold text-primary hover:underline"
                    >
                        View All Notifications
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-6 no-scrollbar relative z-10 text-on-surface dark:text-gray-200 pt-2">
         {stats && (
             <>
                 {/* 1. HERO REVENUE CARD */}
                 <HeroCard />

                 {/* 2. METRICS ROW */}
                 <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <MetricCard 
                        label="Registrations" 
                        value={stats.registration.today.registration} 
                        icon={MdPersonAdd} 
                        colorClass="bg-secondary-container text-on-secondary-container" 
                        delay="100ms"
                    />
                    <MetricCard 
                        label="Tests Done" 
                        value={stats.tests.today.conducted} 
                        icon={MdScience} 
                        colorClass="bg-tertiary-container text-on-tertiary-container" 
                        delay="200ms"
                    />
                 </div>

                 {/* 3. QUICK ACTIONS - Horizontal Scroll or Grid */}
                 <div>
                    <h3 className="text-base font-normal text-gray-900 dark:text-gray-200 mb-4 mt-2">Quick Actions</h3>
                    <div className="flex justify-between px-2">
                        <QuickAction label="Register" icon={MdPersonAdd} onClick={() => navigate('/registration')} delay="100ms" />
                        <QuickAction label="New Test" icon={MdScience} onClick={() => navigate('/tests')} delay="200ms" />
                        <QuickAction label="Expense" icon={MdAccountBalanceWallet} onClick={() => navigate('/expenses')} delay="300ms" />
                        <QuickAction label="Feedback" icon={MdFeedback} onClick={() => navigate('/feedback')} delay="400ms" />
                    </div>
                 </div>

                 {/* 4. LIVE QUEUE SECTION (Elevated Card) */}
                 <div className="bg-surface-variant/30 dark:bg-gray-800 rounded-[24px] p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide uppercase">Live Queue</h3>
                    </div>
                    
                    <QueueBar 
                        label="Consultation" 
                        count={stats.registration.total.in_queue} 
                        colorClass="bg-primary" 
                    />
                    <QueueBar 
                        label="Diagnostics" 
                        count={stats.tests.total.in_queue} 
                        colorClass="bg-tertiary" 
                    />
                 </div>

                 {/* 4. UPCOMING APPOINTMENTS (List) */}
                 <div className="animate-slide-up" style={{ animationDelay: '600ms' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-normal text-gray-900 dark:text-gray-200">Up Next</h3>
                        <button 
                          onClick={() => navigate('/appointments')}
                          className="text-primary dark:text-primary-container text-sm font-medium hover:bg-primary/10 px-3 py-1 rounded-full transition-colors"
                        >
                          View All
                        </button>
                    </div>

                    <div className="space-y-3">
                        {(!stats.schedule || stats.schedule.length === 0) ? (
                            <div className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-[24px]">
                                <MdAccessTime className="mx-auto text-gray-400 dark:text-gray-600 mb-2" size={24} />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No appointments pending</p>
                            </div>
                        ) : (
                            stats.schedule.map((appt, idx) => (
                                <div key={idx} className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-orange-100 dark:border-orange-500/20">
                                    <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-200 flex items-center justify-center font-bold text-xs shadow-sm">
                                        {appt.appointment_time.slice(0, 5)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate text-base">{appt.patient_name}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs font-medium text-orange-700 dark:text-orange-300 capitalize bg-orange-100/50 dark:bg-orange-900/30 px-2 py-0.5 rounded-md border border-orange-200/50 dark:border-orange-700/30">{appt.status}</span>
                                            {appt.type && (
                                                <>
                                                    <span className="text-gray-300 dark:text-gray-600 text-[10px]">•</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{appt.type}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                 </div>
             </>
         )}
      </div>
    </div>
  );
};
export default DashboardScreen;