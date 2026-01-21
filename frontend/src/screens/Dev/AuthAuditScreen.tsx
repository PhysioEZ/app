import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, MdRefresh, MdSecurity, MdPerson, MdLocationOn, MdWarning
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface LoginEntry {
    log_id: number;
    log_timestamp: string;
    username: string;
    employee_id: number;
    action_type: string;
    ip_address: string;
    device_info?: any;
    user_agent?: string;
}

interface LoginStats {
    today: number;
    failed_today: number;
    unique_users: number;
    top_ips: Array<{ ip_address: string; count: number }>;
}

const AuthAuditScreen: React.FC = () => {
    const navigate = useNavigate();
    const [logins, setLogins] = useState<LoginEntry[]>([]);
    const [stats, setStats] = useState<LoginStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load recent logins
            const loginsRes = await fetch(`${API_URL}/dev/auth_audit.php?action=recent_logins`);
            const loginsData = await loginsRes.json();
            if (loginsData.status === 'success') {
                setLogins(loginsData.logins);
            }

            // Load stats
            const statsRes = await fetch(`${API_URL}/dev/auth_audit.php?action=login_stats`);
            const statsData = await statsRes.json();
            if (statsData.status === 'success') {
                setStats(statsData.stats);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogins = logins.filter(login => {
        if (filter === 'all') return true;
        if (filter === 'success') return !login.action_type.toLowerCase().includes('failed');
        if (filter === 'failed') return login.action_type.toLowerCase().includes('failed');
        return true;
    });

    const getDeviceIcon = (userAgent?: string) => {
        if (!userAgent) return '📱';
        if (userAgent.includes('Mobile')) return '📱';
        if (userAgent.includes('Tablet')) return '📱';
        return '💻';
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-blue-50 via-blue-50/50 to-transparent dark:from-blue-900/20 dark:to-transparent pointer-events-none z-0" />
            
            {/* Header */}
            <header className="px-6 py-6 pt-12 flex items-center justify-between z-30 relative">
                <div className="animate-fade-in">
                   <p className="text-[10px] font-medium text-gray-500/70 dark:text-gray-500 uppercase tracking-[0.2em] mb-0.5">
                     Security
                   </p>
                   <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
                     Auth Audit
                   </h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={loadData}
                        className={`w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm ${loading ? 'animate-spin' : ''}`}
                    >
                        <MdRefresh size={18} />
                    </button>

                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                    >
                        <MdArrowBack size={18} />
                    </button>
                </div>
            </header>

            <main className="flex-1 px-6 overflow-y-auto z-10 no-scrollbar pb-32 relative">
                
                {/* Stats Cards */}
                {stats && (
                    <section className="mb-6 animate-scale-in">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-[20px] border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <MdSecurity size={16} className="text-blue-600 dark:text-blue-400" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today</p>
                                </div>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.today}</p>
                                <p className="text-[10px] text-gray-500">Total logins</p>
                            </div>

                            <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-[20px] border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <MdWarning size={16} className="text-rose-600 dark:text-rose-400" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Failed</p>
                                </div>
                                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.failed_today}</p>
                                <p className="text-[10px] text-gray-500">Failed attempts</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-[20px] border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <MdPerson size={16} className="text-emerald-600 dark:text-emerald-400" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Users</p>
                            </div>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.unique_users}</p>
                            <p className="text-[10px] text-gray-500">Unique users today</p>
                        </div>
                    </section>
                )}

                {/* Filter Tabs */}
                <section className="mb-4">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {(['all', 'success', 'failed'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                                    filter === f
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-800'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Login List */}
                <section className="space-y-3 animate-slide-up">
                    {filteredLogins.map((login, i) => {
                        const isFailed = login.action_type.toLowerCase().includes('failed');
                        return (
                            <div key={i} className={`bg-white dark:bg-zinc-900/80 p-4 rounded-[20px] border shadow-sm ${
                                isFailed 
                                ? 'border-rose-200 dark:border-rose-900/30' 
                                : 'border-gray-100 dark:border-white/5'
                            }`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{login.username}</h3>
                                            {isFailed && <MdWarning size={14} className="text-rose-500" />}
                                        </div>
                                        <p className="text-[10px] text-gray-500">{login.action_type}</p>
                                    </div>
                                    <span className="text-xl">{getDeviceIcon(login.user_agent)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <MdLocationOn size={12} />
                                        <span className="font-mono">{login.ip_address}</span>
                                    </div>
                                    <div className="text-right">
                                        {new Date(login.log_timestamp).toLocaleString()}
                                    </div>
                                </div>

                                {login.user_agent && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                        <p className="text-[9px] text-gray-400 truncate">{login.user_agent}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </section>
            </main>
        </div>
    );
};

export default AuthAuditScreen;
