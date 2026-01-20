import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdArrowBack, 
    MdNotifications, 
    MdCheckCircle, 
    MdDeleteSweep, 
    MdAccessTime, 
    MdOpenInNew,
    MdNotificationsOff,
    MdOutlineSwipe
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface Notification {
    notification_id: number;
    message: string;
    link_url: string;
    is_read: number;
    created_at: string;
    first_name: string;
    last_name: string;
}

const AdminNotificationsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [swipeStates, setSwipeStates] = useState<{[key: number]: number}>({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const empId = (user as any).employee_id || user.id;
            const res = await fetch(`${API_URL}/notifications.php?employee_id=${empId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setNotifications(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await fetch(`${API_URL}/notifications.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mark_read', notification_id: id })
            });
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
        } catch (e) { console.error(e); }
    };

    const deleteNotification = async (id: number) => {
        try {
            await fetch(`${API_URL}/notifications.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', notification_id: id })
            });
            setNotifications(prev => prev.filter(n => n.notification_id !== id));
            setSwipeStates(prev => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        } catch (e) { console.error(e); }
    };

    const markAllRead = async () => {
        if (!user) return;
        try {
            const empId = (user as any).employee_id || user.id;
            await fetch(`${API_URL}/notifications.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mark_all_read', employee_id: empId })
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        } catch (e) { console.error(e); }
    };

    const deleteAll = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const empId = (user as any).employee_id || user.id;
            await fetch(`${API_URL}/notifications.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_all', employee_id: empId })
            });
            setNotifications([]);
            setShowConfirmModal(false);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Custom Swipe Logic
    const touchStart = useRef<number | null>(null);
    const touchCurrent = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = e.touches[0].clientX;
        touchCurrent.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent, id: number) => {
        if (touchStart.current === null) return;
        touchCurrent.current = e.touches[0].clientX;
        const diff = touchStart.current - touchCurrent.current;
        if (diff > 0) { // Swipe Left
            setSwipeStates(prev => ({ ...prev, [id]: Math.min(diff, 100) }));
        } else {
            setSwipeStates(prev => ({ ...prev, [id]: 0 }));
        }
    };

    const handleTouchEnd = (id: number) => {
        if (touchStart.current !== null && touchCurrent.current !== null) {
            const diff = touchStart.current - touchCurrent.current;
            if (diff > 80) {
                setSwipeStates(prev => ({ ...prev, [id]: 100 }));
            } else {
                setSwipeStates(prev => ({ ...prev, [id]: 0 }));
            }
        }
        touchStart.current = null;
        touchCurrent.current = null;
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

    const handleLinkClick = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        const res = resolveAdminLink(url);
        if (res) {
            if (res.external) window.open(res.path, '_blank', 'noreferrer');
            else navigate(res.path, { state: res.state });
        }
    };

    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-500 font-sans relative overflow-hidden">
            
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/30 to-transparent dark:from-teal-900/10 dark:to-transparent pointer-events-none z-0" />

            {/* Premium Header */}
            <header className="px-6 py-6 pt-[max(env(safe-area-inset-top),32px)] flex flex-col gap-6 sticky top-0 bg-white/70 dark:bg-black/40 backdrop-blur-md z-30 border-b border-white dark:border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-500 active:scale-90 transition-transform"
                        >
                            <MdArrowBack size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">Intelligence</h1>
                            <p className="text-[10px] font-medium text-teal-600/70 uppercase tracking-[0.2em] mt-2">Notification Center</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowConfirmModal(true)}
                            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white via-rose-50/20 to-white dark:from-zinc-900 dark:via-rose-900/10 dark:to-zinc-900 border border-rose-100 dark:border-rose-900/30 text-rose-500 flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                            title="Clear All"
                        >
                            <MdDeleteSweep size={22} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {notifications.length} Records Found
                    </span>
                    {notifications.some(n => !n.is_read) && (
                        <button 
                            onClick={markAllRead}
                            className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                        >
                            <MdCheckCircle size={14} />
                            Mark all read
                        </button>
                    )}
                </div>
            </header>

            {/* Scrollable List */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6 pt-4 z-10 relative">
                
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                        <div className="w-8 h-8 border-2 border-transparent border-t-teal-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Scanning Tapes...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="space-y-4">
                        {notifications.map((notif, idx) => {
                            const isSwipeApplied = swipeStates[notif.notification_id] > 0;
                            const swipeVal = swipeStates[notif.notification_id] || 0;
                            
                            return (
                                <div 
                                    key={notif.notification_id}
                                    className="relative rounded-[24px] overflow-hidden animate-slide-up"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {/* Delete Action Background - Light Gradient & Red Border */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-white via-rose-50/50 to-rose-100 dark:from-zinc-900 dark:via-rose-950/10 dark:to-rose-900/20 flex items-center justify-end px-8 text-rose-500 z-0 border border-rose-200 dark:border-rose-900/30">
                                        <button 
                                            onClick={() => deleteNotification(notif.notification_id)}
                                            className="flex flex-col items-center gap-1 active:scale-90 transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center border border-rose-100 dark:border-rose-900/40">
                                                <MdDeleteSweep size={22} />
                                            </div>
                                            <span className="text-[8px] font-bold uppercase tracking-widest mt-1">Clear</span>
                                        </button>
                                    </div>

                                    {/* Main Content Card with Swipe Translation */}
                                    <div 
                                        onTouchStart={(e) => handleTouchStart(e)}
                                        onTouchMove={(e) => handleTouchMove(e, notif.notification_id)}
                                        onTouchEnd={() => handleTouchEnd(notif.notification_id)}
                                        onClick={() => !notif.is_read && markAsRead(notif.notification_id)}
                                        style={{ transform: `translateX(-${swipeVal}px)` }}
                                        className={`relative z-10 bg-white dark:bg-zinc-900 p-5 border shadow-sm transition-transform duration-200 cursor-pointer
                                            ${notif.is_read 
                                                ? 'border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-900/50' 
                                                : 'border-teal-50 dark:border-teal-900/30'
                                            }
                                        `}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                                                ${notif.is_read 
                                                    ? 'bg-gray-50 dark:bg-zinc-800 text-gray-400' 
                                                    : 'bg-teal-50 dark:bg-teal-900/20 text-teal-600'
                                                }`}
                                            >
                                                <MdNotifications size={24} />
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest
                                                        ${notif.is_read ? 'text-gray-500' : 'text-teal-600'}
                                                    `}>
                                                        {notif.is_read ? 'Archived' : 'New Update'}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                                        <MdAccessTime size={12} />
                                                        {timeAgo(notif.created_at)}
                                                    </div>
                                                </div>
                                                
                                                <p className={`text-sm leading-snug break-words pr-4
                                                    ${notif.is_read ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-900 dark:text-gray-100 font-bold'}
                                                `}>
                                                    {notif.message}
                                                </p>

                                                {notif.link_url && (
                                                    <button 
                                                        onClick={(e) => handleLinkClick(e, notif.link_url)}
                                                        className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 rounded-lg text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-tighter active:scale-95 transition-transform"
                                                    >
                                                        Details <MdOpenInNew size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {!notif.is_read && (
                                            <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                                        )}
                                        
                                        {/* Swipe Indicator for tutorials */}
                                        {!isSwipeApplied && idx === 0 && !notif.is_read && (
                                            <div className="absolute bottom-2 right-4 flex items-center gap-1 opacity-20 animate-pulse">
                                                <span className="text-[8px] font-bold uppercase tracking-widest">Swipe</span>
                                                <MdOutlineSwipe size={12} strokeWidth={1} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-center opacity-30">
                        <MdNotificationsOff size={64} className="text-gray-300 mb-6" />
                        <h3 className="text-lg font-light tracking-widest uppercase text-gray-400">Void Silence</h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Zero notifications recorded</p>
                    </div>
                )}
            </main>

            {/* Hint Overlay */}
            <div className="fixed bottom-28 left-0 right-0 px-6 pointer-events-none z-20">
                <div className="bg-gray-900/80 dark:bg-zinc-800/80 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center justify-between text-white/50 border border-white/5">
                    <span className="text-[9px] font-bold uppercase tracking-widest">Swipe left to clear individual alerts</span>
                    <MdOutlineSwipe size={14} />
                </div>
            </div>
            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
                    <div 
                        className="bg-white dark:bg-black w-full sm:max-w-xs rounded-[32px] shadow-2xl p-8 mb-20 sm:mb-0 border border-gray-100 dark:border-white/5 animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                            <MdDeleteSweep size={32} />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2 tracking-tight">Clear all?</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8">
                            This will permanently delete all your notifications. This action cannot be undone.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={deleteAll} 
                                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl text-sm transition-all active:scale-[0.98]"
                            >
                                Clear All
                            </button>
                            <button 
                                onClick={() => setShowConfirmModal(false)} 
                                className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold rounded-2xl text-sm transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotificationsScreen;
