import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTheme } from '../../../hooks';
import { 
    MdLightMode, MdDarkMode, MdNotifications, MdNotificationsOff, MdClose,
    MdAccountBalanceWallet, MdTrendingUp, MdReceipt, MdGroup, MdScience,
    MdAccessTime, MdCheckCircle, MdSchedule,
    MdArrowForward, MdShowChart, MdPieChart, MdBarChart,
    MdWarning, MdListAlt, MdStars, MdStar
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { Haptics, NotificationType } from '@capacitor/haptics';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

// --- Interfaces ---

interface DashboardData {
    status: string;
    kpi: {
        registrations: {
            total: number;
            today: number;
            revenue_today: number;
            revenue_total: number;
            breakdown: { wait: number; cncl: number; done: number };
        };
        patients: {
            total: number;
            today: number;
            revenue_today: number;
            revenue_total: number;
            breakdown: { active: number; inactive: number };
        };
        tests: {
            total: number;
            today: number;
            revenue_today: number;
            revenue_total: number;
            breakdown: { pending: number; done: number };
        };
        expenses: {
            total_count: number;
            total_spend: number;
            today_spend: number;
        };
        sessions: {
            total: number;
            today: number;
            month: number;
        };
        overall: {
            today_revenue: number;
            total_revenue: number;
        };
    };
    charts: {
        financial_growth: Array<{ date: string; income: number; expense: number }>;
        expense_analysis: Array<{ category: string; amount: number }>;
        treatment_plans?: Array<{ type: string; count: number }>;
        service_mix?: Array<{ type: string; count: number }>;
        test_types?: Array<{ type: string; count: number }>;
    };
    recent_activity?: Array<{
        user: string;
        action: string;
        details: string;
        time: string;
    }>;
    approvals?: Array<{
        type: 'expense' | 'attendance';
        id: number;
        title: string;
        details: string;
        date: string;
        amount?: number;
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

// --- Helper Components ---

const MetricCard = ({ label, value, icon: Icon, colorClass, delay, subValue }: any) => (
    <div 
        className="bg-white dark:bg-gray-900 rounded-[28px] p-5 flex flex-col gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.02)] border border-gray-100 dark:border-gray-800 animate-slide-up transition-all h-full" 
        style={{ animationDelay: delay }}
    >
        <div className="flex items-center justify-between uppercase tracking-[0.1em]">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon size={22} />
            </div>
            {subValue !== undefined && (
                <div className="text-[10px] font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                    +{subValue}
                </div>
            )}
        </div>
        <div>
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
            <h4 className="text-xl font-light text-gray-900 dark:text-white">{value}</h4>
        </div>
    </div>
);

// --- Chart Components ---

const SimpleBarChart = ({ data }: { data: Array<{ type: string; count: number }> }) => {
    if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-xs text-gray-400 font-light">No Data</div>;

    const maxVal = Math.max(...data.map(d => d.count)) || 1;
    const colors = ['#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

    return (
        <div className="flex items-end justify-around h-full pt-8 pb-4 px-2 gap-2">
            {data.slice(0, 5).map((item, index) => {
                const heightPct = (item.count / maxVal) * 80;
                return (
                    <div key={index} className="flex flex-col items-center justify-end h-full w-full max-w-[40px]">
                        <div className="relative w-full flex items-end justify-center h-full mb-2"> 
                            <div 
                                className="w-full rounded-xl"
                                style={{ 
                                    height: `${Math.max(heightPct, 8)}%`,
                                    backgroundColor: colors[index % colors.length],
                                    opacity: 0.7
                                }}
                            />
                        </div>
                        <span className="text-[8px] font-medium text-gray-400 uppercase text-center truncate w-full">
                            {item.type}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const SimpleLineChart = ({ data }: { data: Array<{ date: string; income: number; expense: number }> }) => {
    if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-xs text-gray-400 font-light">No Data</div>;
    
    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense))) || 1;
    const totalIncome = data.reduce((acc, curr) => acc + curr.income, 0);
    const totalExpense = data.reduce((acc, curr) => acc + curr.expense, 0);

    const PADDING_TOP = 10;
    const PADDING_BOTTOM = 10;
    const AVAILABLE_HEIGHT = 100 - PADDING_TOP - PADDING_BOTTOM;

    const getPath = (key: 'income' | 'expense', color: string) => {
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const normalizedVal = d[key] / maxVal;
            const y = PADDING_TOP + (1 - normalizedVal) * AVAILABLE_HEIGHT;
            return [x, y];
        });

        if (points.length < 2) return "";

        let d = `M ${points[0][0]},${points[0][1]}`;
        for (let i = 1; i < points.length; i++) {
            const [x0, y0] = points[i - 1];
            const [x1, y1] = points[i];
            const cp1x = x0 + (x1 - x0) / 2;
            const cp2x = x1 - (x1 - x0) / 2;
            d += ` C ${cp1x},${y0} ${cp2x},${y1} ${x1},${y1}`;
        }

        return (
            <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.8" />
        );
    };

    return (
        <div className="relative h-full w-full pt-4 pb-4 px-1">
            <div className="h-[60%] w-full relative">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeOpacity="0.03" vectorEffect="non-scaling-stroke" />
                    {getPath('expense', '#ef4444')}
                    {getPath('income', '#10b981')}
                </svg>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex flex-col">
                     <span className="text-[9px] uppercase text-gray-400 font-medium tracking-widest">Inflow</span>
                     <span className="text-base font-light text-emerald-600">₹{totalIncome.toLocaleString()}</span>
                </div>
                 <div className="flex flex-col text-right">
                     <span className="text-[9px] uppercase text-gray-400 font-medium tracking-widest">Outflow</span>
                     <span className="text-base font-light text-rose-500">₹{totalExpense.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

const SimplePieChart = ({ data }: { data: Array<{ category: string; amount: number }> }) => {
    if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-xs text-gray-400 font-light">No Data</div>;
    
    const total = data.reduce((acc, curr) => acc + curr.amount, 0) || 1;
    let cumulative = 0;
    const colors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#64748b'];

    return (
        <div className="flex flex-col items-center gap-6 h-full justify-center">
            <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
                     {data.map((item, index) => {
                        const startPct = cumulative / total;
                        cumulative += item.amount;
                        const endPct = cumulative / total;
                        
                        const startX = Math.cos(2 * Math.PI * startPct);
                        const startY = Math.sin(2 * Math.PI * startPct);
                        const endX = Math.cos(2 * Math.PI * endPct);
                        const endY = Math.sin(2 * Math.PI * endPct);
                        const largeArcFlag = endPct - startPct > 0.5 ? 1 : 0;
                        const pathData = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                        return <path key={index} d={pathData} fill={colors[index % colors.length]} opacity="0.8" stroke="white" strokeWidth="0.02" />;
                     })}
                </svg>
            </div>
            <div className="w-full grid grid-cols-1 gap-2 px-6">
                {data.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-[10px] py-1 border-b border-gray-50 dark:border-gray-800 last:border-0 uppercase tracking-tighter">
                         <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: colors[index % colors.length]}}></div>
                             <span className="text-gray-500 font-medium truncate w-24">{item.category}</span>
                         </div>
                         <span className="font-semibold text-gray-900 dark:text-white">{item.amount}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Component ---

export const AdminDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'finance' | 'plans' | 'services' | 'tests' | 'expenses'>('finance');
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [dismissedApprovals, setDismissedApprovals] = useState<string[]>([]);
    const [retentionLeads, setRetentionLeads] = useState<any[]>([]);
    const [referralDrift, setReferralDrift] = useState<any[]>([]);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [hasSeenSummary, setHasSeenSummary] = useState(() => {
        return localStorage.getItem('p_EZ_summary_seen') === new Date().toDateString();
    });
    const [toasts, setToasts] = useState<{id: number, text: string, type: 'warning' | 'info', link_url?: string}[]>([]);
    const lastToastedIdRef = useRef<number>(Number(localStorage.getItem('p_EZ_last_toast_id')) || 0);

    // Audio Context Management
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioUnlockedRef = useRef<boolean>(false);

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

    const resolveAdminLink = (url: string) => {
        if (!url) return null;
        // Prioritize Chat links to force Admin Chat
        if (url.toLowerCase().includes('chat')) {
             if (url.startsWith('chat_with_employee_id:')) {
                const targetId = url.split(':')[1];
                return { path: '/admin/chat', state: { targetUserId: parseInt(targetId) } };
             }
             return { path: '/admin/chat' };
        }

        if (url.startsWith('http')) return { path: url, external: true };

        const legacyMapping: { [key: string]: string } = {
            'manage_attendance.php': '/admin/attendance',
            'manage_expenses.php': '/admin/expenses',
            'operational_expenses.php': '/admin/expenses',
            'personal_expenses.php': '/admin/expenses',
            'financial_ledger.php': '/admin/ledger',
            'patients.php': '/admin/patients',
            'patient_details.php': '/admin/patients',
            'chat.php': '/admin/chat',
            'index.php': '/admin/dashboard',
            'dashboard.php': '/admin/dashboard'
        };

        const [cleanUrl, queryString] = url.split('?');
        const phpFile = cleanUrl.replace(/^\//, '');

        if (legacyMapping[phpFile]) {
            let target = legacyMapping[phpFile];
            if (phpFile === 'patient_details.php' || phpFile === 'patients.php') {
                const params = new URLSearchParams(queryString);
                const id = params.get('id') || params.get('patient_id');
                if (id) target = `/admin/patients/${id}`;
            }
            return { path: target };
        }

        if (url.startsWith('/')) {
            const normalized = url.replace(/\/$/, '');
            if (normalized === '' || normalized === '/dashboard') return { path: '/admin/dashboard' };
            if (normalized === '/chat') return { path: '/admin/chat' };
            if (!normalized.startsWith('/admin/')) return { path: `/admin${normalized}` };
            return { path: normalized };
        }

        if (url.toLowerCase().includes('chat')) return { path: '/admin/chat' };
        return { path: url };
    };

    const addToast = (text: string, type: 'warning' | 'info' = 'info', link_url?: string) => {
        const id = Date.now() + Math.random();
        setToasts(prev => {
            if (prev.some(t => t.text === text)) return prev;
            return [...prev, { id, text, type, link_url }];
        });
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    const fetchRetentionRadar = async () => {
        if (!user) return;
        try {
            const empId = (user as any).employee_id || user.id;
            const res = await fetch(`${API_URL}/admin/insights.php?action=retention_radar&user_id=${empId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setRetentionLeads(json.data);
            }
        } catch (e) {
            console.error("Failed to fetch retention radar", e);
        }
    };

    const fetchReferralDrift = async () => {
        if (!user) return;
        try {
            const empId = (user as any).employee_id || user.id;
            const res = await fetch(`${API_URL}/admin/insights.php?action=referral_drift&user_id=${empId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setReferralDrift(json.data);
            }
        } catch (e) {
            console.error("Failed to fetch referral drift", e);
        }
    };

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const empId = (user as any).employee_id || user.id;
            const res = await fetch(`${API_URL}/notifications.php?employee_id=${empId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setNotifications(json.data);
                setUnreadCount(json.unread_count);

                // Show toast for new unread notifications
                const unreadNotifications = json.data.filter((n: Notification) => n.is_read === 0);
                if (unreadNotifications.length > 0) {
                    const newest = unreadNotifications[0];
                        if (newest.notification_id > lastToastedIdRef.current) {
                            addToast(newest.message, 'info', newest.link_url);
                            
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
                            localStorage.setItem('p_EZ_last_toast_id', newest.notification_id.toString());
                        }
                }
            }
        } catch (e) { console.error(e); }
    };

    const markAsRead = async (id: number) => {
        try {
            await fetch(`${API_URL}/notifications.php`, {
                method: 'POST', body: JSON.stringify({ action: 'mark_read', notification_id: id })
            });
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) { console.error(e); }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            const empId = (user as any).employee_id || user.id;
            await fetch(`${API_URL}/notifications.php`, {
                method: 'POST', body: JSON.stringify({ action: 'mark_all_read', employee_id: empId })
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
        } catch (e) { console.error(e); }
    };

    const fetchDashboardData = async () => {
        try {
            const branchId = user?.branch_id || 0; 
            const response = await fetch(`${API_URL}/admin/dashboard.php?branch_id=${branchId}`);
            const result = await response.json();
            if (result.status === 'success') setData(result);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchNotifications();
        fetchRetentionRadar();
        fetchReferralDrift();
        
        // Show summary modal if player hasn't seen it today
        if (!hasSeenSummary) {
            const timer = setTimeout(() => setShowSummaryModal(true), 1500);
            return () => clearTimeout(timer);
        }

        const interval = setInterval(() => {
            fetchNotifications();
            fetchRetentionRadar();
            fetchReferralDrift();
        }, 30000);
        return () => clearInterval(interval);
    }, [user, hasSeenSummary]);

    const dismissSummary = () => {
        const todayStr = new Date().toDateString();
        localStorage.setItem('p_EZ_summary_seen', todayStr);
        setHasSeenSummary(true);
        setShowSummaryModal(false);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', maximumFractionDigits: 0
        }).format(val);
    };

    const formatK = (n: number) => {
        if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
        return n;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        let interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "Just now";
    };

    const kpi = data?.kpi;

    const summaryPoints = useMemo(() => {
        const pts = [];
        
        // 1. Approvals
        const pendingCount = data?.approvals?.filter(a => !dismissedApprovals.includes(`${a.type}-${a.id}`)).length || 0;
        if (pendingCount > 0) {
            pts.push({
                icon: MdListAlt,
                text: `${pendingCount} approvals are waiting for you.`,
                color: 'text-rose-500',
                action: () => navigate(data?.approvals?.[0].type === 'expense' ? '/admin/expenses' : '/admin/attendance')
            });
        }

        // 2. Retention Critical
        const criticalCount = retentionLeads.filter(l => l.risk_level === 'Critical').length;
        if (criticalCount > 0) {
            pts.push({
                icon: MdWarning,
                text: `${criticalCount} patients hit critical drop-out risk.`,
                color: 'text-amber-500',
                action: () => navigate('/admin/retention')
            });
        }

        // 3. Referral Drift
        const driftCount = referralDrift.filter(p => p.drift_level === 'Critical' || p.drift_level === 'High').length;
        if (driftCount > 0) {
            pts.push({
                icon: MdStar,
                text: `${driftCount} referral partners have gone silent.`,
                color: 'text-indigo-500',
                action: () => navigate('/admin/referrals/drift')
            });
        }

        // 4. Revenue
        const todayRev = kpi?.overall?.today_revenue || 0;
        if (todayRev > 0) {
            pts.push({
                icon: MdTrendingUp,
                text: `Revenue is up ${formatCurrency(todayRev)} today.`,
                color: 'text-emerald-500',
                action: () => setActiveTab('finance')
            });
        } else {
            pts.push({
                icon: MdSchedule,
                text: "Systems are active. No revenue logged yet.",
                color: 'text-gray-400'
            });
        }

        return pts.slice(0, 3);
    }, [data, retentionLeads, referralDrift, dismissedApprovals, kpi]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-gray-950">
                <div className="w-6 h-6 border-2 border-gray-100 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Direct Teal Gradient Background - Matching Reception Reference */}
            <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/20 dark:to-transparent pointer-events-none z-0" />
            
            {/* Mobile Header */}
            <header className="px-6 py-6 pt-12 flex items-center justify-between z-30 relative">
                <div className="animate-fade-in">
                   <p className="text-[10px] font-medium text-gray-500/70 dark:text-gray-500 uppercase tracking-[0.2em] mb-0.5">
                     {getGreeting()},
                   </p>
                   <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
                     {user?.name?.split(' ')[0] || 'Admin'}
                   </h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleTheme} 
                        className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                    >
                        {theme === 'dark' ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
                    </button>
                    
                    <button 
                        onClick={() => setShowNotifications(true)}
                        className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 relative border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                    >
                        <MdNotifications size={18} />
                        {unreadCount > 0 && <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-rose-400 rounded-full" />}
                    </button>

                    <button 
                        onClick={() => navigate('/admin/profile')}
                        className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white text-xs font-medium border border-primary/10 active:scale-90 transition-transform shadow-md"
                    >
                        {user?.name?.charAt(0) || 'A'}
                    </button>
                </div>
            </header>
            
            <main className="flex-1 px-6 overflow-y-auto z-10 no-scrollbar pb-32 relative">

                {/* Mobile Hero View - Redesigned to Match Reception */}
                <section className="mb-8 animate-scale-in">
                    <div className="bg-[#00796B] rounded-[36px] p-8 shadow-[0_12px_40px_rgba(0,121,107,0.2)] text-white relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[60px]" />
                        
                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="space-y-6">
                                 <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                        <MdAccountBalanceWallet size={18} className="text-white" />
                                    </div>
                                    <span className="text-[10px] font-medium text-white/70 uppercase tracking-[0.2em]">Total Collections</span>
                                 </div>
                                 <div className="space-y-1">
                                     <h2 className="text-5xl font-light tracking-tighter">
                                        {formatCurrency(kpi?.overall?.total_revenue || 0)}
                                     </h2>
                                     <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest pl-1">Overall Balance</p>
                                 </div>
                            </div>

                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-[20px] self-start border border-white/5">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                 <span className="text-[11px] font-medium">Today's Revenue: +{formatCurrency(kpi?.overall?.today_revenue || 0)}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* KPI Cards - Light Tinted Background */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    <MetricCard 
                        label="Registrations"
                        value={formatK(kpi?.registrations.total || 0)}
                        icon={MdSchedule}
                        colorClass="bg-indigo-50 text-indigo-400"
                        delay="100ms"
                        subValue={kpi?.registrations.today}
                    />
                    <MetricCard 
                        label="Patients"
                        value={formatK(kpi?.patients.total || 0)}
                        icon={MdGroup}
                        colorClass="bg-emerald-50 text-emerald-500"
                        delay="200ms"
                        subValue={kpi?.patients.today}
                    />
                    <MetricCard 
                        label="Diagnostics"
                        value={formatK(kpi?.tests.total || 0)}
                        icon={MdScience}
                        colorClass="bg-blue-50 text-blue-400"
                        delay="300ms"
                        subValue={kpi?.tests.today}
                    />
                    <MetricCard 
                        label="Spendings"
                        value={formatCurrency(kpi?.expenses.total_spend || 0)}
                        icon={MdReceipt}
                        colorClass="bg-rose-50 text-rose-400"
                        delay="400ms"
                        subLabel="Total"
                    />
                </div>
                
                {/* Persistent Intelligence Card (Shown if Modal is Dismissed) */}
                {hasSeenSummary && summaryPoints.length > 0 && (
                    <section className="mb-10 animate-scale-in">
                        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[32px] p-6 border border-white dark:border-white/5 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <MdStars size={18} />
                                </div>
                                <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Intelligence Briefing</h3>
                            </div>
                            <div className="space-y-4">
                                {summaryPoints.map((pt: any, i: number) => (
                                    <div 
                                        key={i} 
                                        onClick={pt.action}
                                        className="flex items-center gap-4 group cursor-pointer active:scale-95 transition-all"
                                    >
                                        <div className={`w-2 h-2 rounded-full ${pt.color.replace('text-', 'bg-')} shadow-sm group-hover:scale-125 transition-transform`} />
                                        <p className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors leading-relaxed">
                                            {pt.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
                
                {/* Priority Actions / Approvals */}
                {data?.approvals && data.approvals.length > 0 && data.approvals.filter(a => !dismissedApprovals.includes(`${a.type}-${a.id}`)).length > 0 && (
                    <section className="mb-10 animate-slide-up" style={{ animationDelay: '450ms' }}>
                        <div className="flex items-center justify-between mb-4 px-1">
                             <h3 className="text-[11px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-[0.3em]">Priority Actions</h3>
                             <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase">
                                 {data.approvals.filter(a => !dismissedApprovals.includes(`${a.type}-${a.id}`)).length} Pending
                             </span>
                        </div>
                        <div className="flex overflow-x-auto gap-4 no-scrollbar pb-4 pt-1">
                            {data.approvals.filter(a => !dismissedApprovals.includes(`${a.type}-${a.id}`)).map((item) => (
                                <div 
                                    key={`${item.type}-${item.id}`}
                                    className="min-w-[280px] bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-rose-100 dark:border-rose-900/30 shadow-sm relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                        <button 
                                            onClick={() => setDismissedApprovals(prev => [...prev, `${item.type}-${item.id}`])}
                                            className="w-8 h-8 rounded-full bg-gray-50 dark:bg-black/40 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all border border-gray-100 dark:border-white/10"
                                        >
                                            <MdClose size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${item.type === 'expense' ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20'}`}>
                                            {item.type === 'expense' ? <MdReceipt size={22} /> : <MdAccessTime size={22} />}
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.title}</h4>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                        </div>
                                    </div>
                                    <p className="text-[12px] font-bold text-gray-600 dark:text-zinc-400 mb-6 line-clamp-2 leading-relaxed h-9">
                                        {item.details}
                                    </p>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => navigate(item.type === 'expense' ? '/admin/expenses' : '/admin/attendance')}
                                            className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            View Details
                                            <MdArrowForward size={14} />
                                        </button>
                                    </div>
                                    {/* Decorative subtle pulse */}
                                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-rose-500/5 rounded-full blur-xl animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Intelligent Retention Radar Pulse */}
                {retentionLeads.length > 0 && (
                    <section className="mb-10 animate-slide-up" style={{ animationDelay: '480ms' }}>
                        <div className="flex items-center justify-between mb-4 px-1">
                             <h3 className="text-[11px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-[0.3em]">Retention Radar</h3>
                             <button 
                                onClick={() => navigate('/admin/retention')}
                                className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1"
                             >
                                Full Scan <MdArrowForward size={12} />
                             </button>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-amber-100 dark:border-amber-900/30 shadow-sm relative overflow-hidden flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 relative">
                                <MdWarning size={28} className="animate-pulse" />
                                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-lg shadow-rose-500/40">
                                    {retentionLeads.length}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[14px] font-black text-gray-900 dark:text-white uppercase tracking-tight">At-Risk Detection</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                    {retentionLeads.filter(l => l.risk_level === 'Critical').length} Critical Churn Risks
                                </p>
                            </div>
                            <button 
                                onClick={() => navigate('/admin/retention')}
                                className="w-12 h-12 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center active:scale-90 transition-transform shadow-lg"
                            >
                                <MdArrowForward size={24} />
                            </button>
                            
                            {/* Decorative background pulse */}
                            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-amber-100/30 dark:bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />
                        </div>
                    </section>
                )}

                {/* Mobile Analytics Container */}
                <section className="mb-10 animate-slide-up" style={{ animationDelay: '500ms' }}>
                    <div className="bg-white dark:bg-gray-900 rounded-[36px] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                        
                        <div className="flex flex-col gap-6 mb-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-light text-gray-900 dark:text-white tracking-tight">Growth Insight</h3>
                                <div className="p-1 px-3 bg-gray-50 dark:bg-gray-800 rounded-full text-[9px] font-medium text-gray-400 uppercase tracking-widest">30 Days</div>
                            </div>
                            
                            <div className="flex p-1 bg-gray-50/80 dark:bg-gray-800/80 rounded-2xl overflow-x-auto no-scrollbar gap-1 border border-gray-100/50">
                                {[
                                    { id: 'finance', label: 'Fin', icon: MdShowChart },
                                    { id: 'plans', label: 'Plan', icon: MdPieChart },
                                    { id: 'services', label: 'Mix', icon: MdPieChart },
                                    { id: 'tests', label: 'Lab', icon: MdBarChart },
                                    { id: 'expenses', label: 'Out', icon: MdPieChart }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-medium uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5
                                            ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}
                                        `}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[320px]" key={activeTab}>
                            {activeTab === 'finance' && <SimpleLineChart data={data?.charts.financial_growth || []} />}
                            {activeTab === 'plans' && <SimplePieChart data={((data?.charts?.treatment_plans || []) as any).map((d: any) => ({ category: d.type, amount: d.count }))} />}
                            {activeTab === 'services' && <SimplePieChart data={((data?.charts?.service_mix || []) as any).map((d: any) => ({ category: d.type, amount: d.count }))} />}
                            {activeTab === 'tests' && <SimpleBarChart data={data?.charts.test_types || []} />}
                            {activeTab === 'expenses' && <SimplePieChart data={data?.charts.expense_analysis || []} />}
                        </div>
                    </div>
                </section>

                {/* Mobile Logs */}
                {data?.recent_activity && data.recent_activity.length > 0 && (
                    <section className="animate-slide-up mb-6" style={{ animationDelay: '600ms' }}>
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h3 className="text-lg font-light text-gray-900 dark:text-white tracking-tight">System Records</h3>
                            <button onClick={() => navigate('/admin/records')} className="text-[10px] font-medium text-primary uppercase tracking-[0.2em] flex items-center gap-1">History <MdArrowForward size={14} /></button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {data.recent_activity.slice(0, 4).map((item, idx) => (
                                <div key={idx} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm px-5 py-4 rounded-[28px] border border-gray-100 dark:border-gray-800 flex items-center gap-4 transition-all hover:bg-white active:scale-[0.98]">
                                     <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                        <MdTrendingUp size={18} />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <div className="flex items-center justify-between gap-2 mb-0.5">
                                             <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">{item.user}</span>
                                             <span className="text-[8px] font-medium text-gray-400 uppercase tracking-tighter">{timeAgo(item.time)}</span>
                                         </div>
                                         <p className="text-[10px] text-gray-500 font-light truncate">
                                             <span className="text-primary font-medium mr-1 uppercase opacity-70">{item.action}:</span> {item.details}
                                         </p>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Bottom Modal Intelligence - Higher Positioning for Dock Visibility */}
            {showNotifications && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-32">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowNotifications(false)} />
                    
                    <div className="relative w-full max-w-lg bg-white dark:bg-gray-950 rounded-[40px] shadow-2xl flex flex-col max-h-[75vh] animate-scale-in border border-gray-100 dark:border-gray-900 overflow-hidden">
                        <div className="px-8 py-8 shrink-0 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
                            <div>
                                <h3 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">Intelligence Feed</h3>
                                <p className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.2em] mt-1">Real-time system updates</p>
                            </div>
                            <button onClick={() => setShowNotifications(false)} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-colors"><MdClose size={24} /></button>
                        </div>

                        <div className="overflow-y-auto px-8 py-6 flex-1 no-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="py-24 text-center">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 opacity-30">
                                        <MdNotificationsOff size={32} />
                                    </div>
                                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.3em]">All Caught Up</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {notifications.map((notif) => (
                                        <div 
                                            key={notif.notification_id} 
                                            className="relative group cursor-pointer" 
                                            onClick={() => {
                                                if (!notif.is_read) markAsRead(notif.notification_id);
                                                const res = resolveAdminLink(notif.link_url);
                                                if (res) {
                                                    if (res.external) window.open(res.path, '_blank', 'noreferrer');
                                                    else navigate(res.path, { state: res.state });
                                                    setShowNotifications(false);
                                                }
                                            }}
                                        >
                                            <div className="flex gap-5">
                                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 transition-all ${notif.is_read ? 'bg-transparent scale-0' : 'bg-teal-500 scale-100'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm leading-relaxed ${notif.is_read ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-900 dark:text-gray-100 font-bold'}`}>{notif.message}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <MdAccessTime size={12} className="text-gray-400" />
                                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{timeAgo(notif.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-8 pt-4 bg-gray-50/50 dark:bg-gray-950 border-t border-gray-50 dark:border-gray-800">
                            {unreadCount > 0 ? (
                                <button onClick={markAllAsRead} className="w-full py-5 rounded-[24px] text-white text-[11px] font-medium uppercase tracking-[0.2em] bg-gray-900 dark:bg-white dark:text-gray-900 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                                    <MdCheckCircle size={18} />
                                    Mark All Read
                                </button>
                            ) : (
                                <button onClick={() => { setShowNotifications(false); navigate('/admin/notifications'); }} className="w-full py-4 text-gray-400 font-medium text-[10px] uppercase tracking-[0.2em] hover:text-primary transition-colors">
                                    View Older Archives
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Toast System */}
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-xs pointer-events-none">
                {toasts.map(toast => (
                    <div 
                        key={toast.id}
                        onClick={() => {
                            const res = resolveAdminLink(toast.link_url || '');
                            if (res) {
                                if (res.external) window.open(res.path, '_blank', 'noopener,noreferrer');
                                else navigate(res.path, { state: res.state });
                            } else {
                                setShowNotifications(true);
                            }
                            setToasts(prev => prev.filter(t => t.id !== toast.id));
                        }}
                        className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-fade-in-up border transition-all active:scale-95 cursor-pointer ${
                            toast.type === 'warning' 
                            ? 'bg-rose-500/90 border-rose-400 text-white' 
                            : 'bg-gray-900/90 dark:bg-zinc-800/90 border-white/10 text-white'
                        }`}
                    >
                        <div className="shrink-0 w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                            {toast.type === 'warning' ? <MdNotifications size={18} /> : <MdNotifications size={18} />}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-tight flex-1 leading-tight">{toast.text}</p>
                        <MdClose size={14} className="opacity-40" />
                    </div>
                ))}
            </div>

            {/* Smart Intelligence Modal (Daily Briefing) */}
            {showSummaryModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" />
                    <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[40px] p-8 shadow-2xl animate-scale-in border border-white/20 overflow-hidden">
                        {/* Branded background accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                        
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white mb-6 shadow-xl shadow-primary/20">
                                <MdStars size={40} />
                            </div>
                            
                            <h2 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none mb-2">Morning Brief</h2>
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em] mb-8">System Intelligence</p>
                            
                            <div className="w-full space-y-5 mb-10 text-left">
                                {summaryPoints.map((pt, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className={`mt-1.5 w-2 h-2 rounded-full ${pt.color.replace('text-', 'bg-')} shrink-0`} />
                                        <p className="text-xs font-bold text-gray-600 dark:text-zinc-300 leading-tight">
                                            {pt.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                onClick={dismissSummary}
                                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                            >
                                Acknolwedged
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
