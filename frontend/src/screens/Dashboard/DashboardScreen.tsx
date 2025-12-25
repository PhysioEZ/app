import * as React from 'react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../hooks';
import { 
  UserPlus, FlaskConical, Wallet, 
  Sun, Moon, Clock, CheckCircle,
  Bell, X, MessageSquare, BellOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      <div className="flex items-center justify-center min-h-[50vh] bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- Modern UI Components ---

  const HeroCard = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 to-emerald-800 rounded-3xl p-6 shadow-xl shadow-teal-900/20 text-white mb-6">
        {/* Background Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-black/10 blur-xl"></div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 opacity-90">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Wallet size={20} className="text-white" />
                </div>
                <span className="text-sm font-semibold tracking-wide uppercase">Today's Revenue</span>
            </div>

            <div className="mb-6">
                <h2 className="text-4xl font-bold tracking-tight mb-1">
                    {stats ? formatCurrency(stats.payments.today.received) : '₹0'}
                </h2>
                <p className="text-teal-100 text-xs font-medium">Total Collection</p>
            </div>

            {/* Glassy Breakdown */}
            {stats && (
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: 'Cons.', val: stats.payments.today.breakdown.registrations, color: 'bg-blue-400' },
                        { label: 'Tests', val: stats.payments.today.breakdown.tests, color: 'bg-purple-400' },
                        { label: 'Treat', val: stats.payments.today.breakdown.treatments, color: 'bg-orange-400' }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-black/20 backdrop-blur-sm rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.color} mb-1.5 shadow-[0_0_8px_currentColor]`}></div>
                            <span className="text-[10px] text-teal-100 uppercase font-bold mb-0.5">{item.label}</span>
                            <span className="text-xs font-bold">{formatCurrency(item.val).replace('₹', '')}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );

  const MetricCard = ({ title, value, subValue, icon: Icon, color, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-full relative overflow-hidden group ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
    >
        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 ${color}`}>
            <Icon size={64} />
        </div>
        
        <div className="relative z-10">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${color} bg-opacity-10 dark:bg-opacity-20`}>
                <Icon size={20} className={color.replace('bg-', 'text-').replace('opacity-10', '')} />
            </div>
            
            <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</span>
                <span className="block text-2xl font-black text-gray-900 dark:text-white mb-1">{value}</span>
                {subValue && (
                    <span className="inline-block px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-700 text-[10px] font-bold text-gray-500">
                        {subValue}
                    </span>
                )}
            </div>
        </div>
    </div>
  );

  const QueueBar = ({ label, count, color, total = 20 }: any) => (
    <div className="mb-4 last:mb-0">
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                {count} Waiting
            </span>
        </div>
        <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden p-[2px]">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${color} shadow-sm relative overflow-hidden`}
                style={{ width: `${Math.min((count / total) * 100, 100)}%` }}
            >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900 transition-colors duration-200">
      {/* Modern Glassy Header */}
      <header className="px-6 py-4 pt-11 flex items-center justify-between sticky top-0 z-20 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
             {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
           </p>
           <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
            )}
          </button>
          
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-400 to-teal-600 p-[2px] shadow-lg shadow-teal-500/20 active:scale-95 transition-transform">
             <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                <span className="font-bold text-sm text-teal-600 dark:text-teal-400">{user?.name?.charAt(0) || 'U'}</span>
             </div>
          </button>
        </div>

        {/* Notification Popup Modal */}
        {showNotifications && (
            <>
                <div className="fixed inset-0 z-30 bg-black/5" onClick={() => setShowNotifications(false)}></div>
                <div className="absolute top-full right-4 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                        <div className="flex items-baseline gap-2">
                            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && <span className="text-xs font-bold text-teal-600">{unreadCount} new</span>}
                        </div>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-[10px] font-bold uppercase tracking-wider text-teal-600 hover:text-teal-700 dark:text-teal-400 px-2 py-1 bg-teal-50 dark:bg-teal-900/30 rounded-lg transition-colors">
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="text-center py-10 opacity-50 flex flex-col items-center">
                                <BellOff size={32} className="text-gray-300 mb-2" />
                                <p className="text-xs font-bold text-gray-400">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.notification_id} 
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group relative ${notif.is_read ? 'opacity-70' : 'bg-teal-50/30 dark:bg-teal-900/10'}`}
                                        onClick={() => {
                                            if (!notif.is_read) markAsRead(notif.notification_id);
                                            if (notif.link_url && notif.link_url.startsWith('chat_with_employee_id:')) {
                                                const targetId = notif.link_url.split(':')[1];
                                                navigate('/chat', { state: { targetUserId: parseInt(targetId) } });
                                                setShowNotifications(false);
                                            }
                                        }}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`p-2 rounded-full h-fit flex-shrink-0 ${notif.is_read ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600'}`}>
                                                <Bell size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className={`text-sm ${notif.is_read ? 'font-medium text-gray-600 dark:text-gray-400' : 'font-bold text-gray-900 dark:text-white'} leading-snug mb-0.5`}>
                                                        {notif.message}
                                                    </p>
                                                    {!notif.is_read && <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0"></div>}
                                                </div>
                                                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                                    <span className="font-semibold text-gray-500 dark:text-gray-500">{notif.first_name ? `${notif.first_name} ${notif.last_name}` : 'System'}</span>
                                                    <span>•</span>
                                                    <span>{timeAgo(notif.created_at)}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-8 no-scrollbar">
         {stats && (
             <>
                 {/* 1. HERO REVENUE CARD */}
                 <HeroCard />

                 {/* QUICK ACTIONS */}
                 <div className="grid grid-cols-2 gap-4">
                     <button onClick={() => navigate('/registration')} className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-3xl border border-teal-100 dark:border-teal-800 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-all group relative overflow-hidden shadow-sm h-32">
                         <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/30 shrink-0 group-hover:scale-110 transition-transform">
                              <UserPlus size={20} strokeWidth={2.5} />
                         </div>
                         <div className="text-center">
                             <span className="block text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-0.5">New</span>
                             <span className="block text-base font-black text-gray-900 dark:text-white leading-none">Registration</span>
                         </div>
                     </button>

                     <button onClick={() => navigate('/tests')} className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-3xl border border-violet-100 dark:border-violet-800 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-all group relative overflow-hidden shadow-sm h-32">
                         <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-600/30 shrink-0 group-hover:scale-110 transition-transform">
                              <FlaskConical size={20} strokeWidth={2.5} />
                         </div>
                         <div className="text-center">
                             <span className="block text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-0.5">Add</span>
                             <span className="block text-base font-black text-gray-900 dark:text-white leading-none">Test</span>
                         </div>
                     </button>

                     <button onClick={() => navigate('/expenses')} className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-3xl border border-indigo-100 dark:border-indigo-800 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-all group relative overflow-hidden shadow-sm h-32">
                         <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0 group-hover:scale-110 transition-transform">
                              <Wallet size={20} strokeWidth={2.5} />
                         </div>
                         <div className="text-center">
                             <span className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Manage</span>
                             <span className="block text-base font-black text-gray-900 dark:text-white leading-none">Expenses</span>
                         </div>
                     </button>

                     <button onClick={() => navigate('/feedback')} className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-all group relative overflow-hidden shadow-sm h-32">
                         <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 shrink-0 group-hover:scale-110 transition-transform">
                              <MessageSquare size={20} strokeWidth={2.5} />
                         </div>
                         <div className="text-center">
                             <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Collect</span>
                             <span className="block text-base font-black text-gray-900 dark:text-white leading-none">Feedback</span>
                         </div>
                     </button>
                 </div>

                 {/* 2. LIVE QUEUE SECTION */}
                 <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                             Live Activity
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">Live</span>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <QueueBar 
                            label="Consultation Queue" 
                            count={stats.registration.total.in_queue} 
                            color="bg-blue-500" 
                        />
                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-4"></div>
                        <QueueBar 
                            label="Diagnostic & Tests" 
                            count={stats.tests.total.in_queue} 
                            color="bg-purple-500" 
                        />
                    </div>
                 </div>

                 {/* 3. METRICS GRID (Compact) */}
                 <div className="grid grid-cols-2 gap-4">
                     <MetricCard 
                        title="Registrations"
                        value={stats.registration.today.registration}
                        subValue={`${stats.registration.today.appointments} Appts`}
                        icon={UserPlus}
                        color="text-blue-500"
                        onClick={() => navigate('/registration')}
                     />
                     <MetricCard 
                         title="Tests Today"
                         value={stats.tests.today.scheduled}
                         subValue={`${stats.tests.today.conducted} Done`}
                         icon={FlaskConical}
                         color="text-purple-500"
                         onClick={() => navigate('/tests')}
                      />
                 </div>

                 {/* 4. UPCOMING APPOINTMENTS */}
                 <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            Next Up
                        </h3>
                        <button 
                          onClick={() => navigate('/appointments')}
                          className="text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wide bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 rounded-full"
                        >
                          View All
                        </button>
                    </div>

                    <div className="space-y-3">
                        {(!stats.schedule || stats.schedule.length === 0) ? (
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center border border-dashed border-gray-200 dark:border-gray-700">
                                <Clock className="mx-auto text-gray-300 mb-2" size={24} />
                                <p className="text-sm text-gray-400 font-medium">No appointments pending</p>
                            </div>
                        ) : (
                            stats.schedule.map((appt, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 active:scale-[0.98] transition-transform">
                                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-inner">
                                        <span className="text-xs font-black text-gray-900 dark:text-white">
                                            {appt.appointment_time.slice(0, 5)}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 dark:text-white truncate">{appt.patient_name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`h-1.5 w-1.5 rounded-full ${appt.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                            <span className="text-xs text-gray-500 font-medium capitalize">{appt.status}</span>
                                            {appt.type && (
                                                <>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="text-xs text-xs text-gray-400 font-medium capitalize truncate">{appt.type}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-gray-400 hover:text-teal-500 transition-colors">
                                        <CheckCircle size={18} />
                                    </button>
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