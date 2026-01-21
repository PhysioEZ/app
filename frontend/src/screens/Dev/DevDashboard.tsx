import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { 
    MdRefresh, MdSpeed, 
    MdCode,
    MdLightMode, MdDarkMode, MdTerminal, MdNetworkCheck,
    MdFlashOn, MdBugReport
} from 'react-icons/md';

// Mock hook since the original file didn't import it, but we need it for the header style
// If useTheme doesn't exist in hooks, we'll implement a local toggle or just omit it. 
// However, AdminDashboard uses it, so it should exist. 
// I will check imports in AdminDashboard again. It has `import { useTheme } from '../../../hooks';`
import { isRecent } from '../../utils/timeUtils';
import { useTheme } from '../../hooks'; 

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

const DevDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState<any>(null);

    const loadStats = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/dev/info.php`);
            const data = await res.json();
            setInfo(data);
        } catch (error) {
            console.error("Dev API Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 10000); // Relaxed refresh (10s) to save resources
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Direct Teal Gradient Background - Matching AdminDashboard */}
            <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/20 dark:to-transparent pointer-events-none z-0" />
            
            {/* Header */}
            <header className="px-6 py-6 pt-12 flex items-center justify-between z-30 relative">
                <div className="animate-fade-in">
                   <p className="text-[10px] font-medium text-gray-500/70 dark:text-gray-500 uppercase tracking-[0.2em] mb-0.5">
                     Dev Console
                   </p>
                   <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
                     {user?.name?.split(' ')[0] || 'Developer'}
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
                        onClick={loadStats}
                        className={`w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm ${loading ? 'animate-spin' : ''}`}
                    >
                        <MdRefresh size={18} />
                    </button>

                    <button 
                        onClick={() => navigate('/dev/profile')}
                        className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white text-xs font-medium border border-indigo-500/10 active:scale-90 transition-transform shadow-md"
                    >
                        {user?.name?.charAt(0) || 'D'}
                    </button>
                </div>
            </header>
            
            <main className="flex-1 px-6 overflow-y-auto z-10 no-scrollbar pb-32 relative">

                {/* System Status Hero */}
                <section className="mb-8 animate-scale-in">
                    <div className="bg-indigo-600 dark:bg-indigo-900 rounded-[36px] p-8 shadow-[0_12px_40px_rgba(79,70,229,0.3)] text-white relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[60px]" />
                        
                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="space-y-6">
                                 <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                        <MdSpeed size={18} className="text-white" />
                                    </div>
                                    <span className="text-[10px] font-medium text-white/70 uppercase tracking-[0.2em]">System Latency</span>
                                 </div>
                                 <div className="space-y-1">
                                     <h2 className="text-5xl font-light tracking-tighter">
                                        {info?.environment?.load_time || '--'}
                                     </h2>
                                     <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest pl-1">Response Time</p>
                                 </div>
                            </div>

                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-[20px] self-start border border-white/5">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                 <span className="text-[11px] font-medium">System Online • {info?.system?.memory_usage || '0MB'} RAM</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    <MetricCard 
                        label="Traffic"
                        value={info?.traffic?.length || 0}
                        subLabel="Hits / 10s"
                        icon={<MdNetworkCheck />}
                        colorClass="bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20"
                        delay="100ms"
                    />
                    <MetricCard 
                        label="Errors"
                        value={info?.logs?.length || 0}
                        subLabel="Events"
                        icon={<MdTerminal />}
                        colorClass="bg-rose-50 text-rose-500 dark:bg-rose-900/20"
                        delay="200ms"
                    />
                    <div onClick={() => navigate('/dev/issues')} className="cursor-pointer col-span-2 sm:col-span-1">
                        <MetricCard 
                            label="Pending Issues"
                            value={info?.issues_count || 0}
                            subLabel="Requires Action"
                            icon={<MdBugReport />}
                            colorClass="bg-amber-50 text-amber-500 dark:bg-amber-900/20"
                            delay="250ms"
                        />
                    </div>
                </div>

                {/* Traffic Stream */}
                <section className="mb-10 animate-slide-up" style={{ animationDelay: '300ms' }}>
                     <div className="flex items-center justify-between mb-4 px-1">
                         <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Traffic</h3>
                         <button onClick={() => navigate('/dev/traffic')} className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">View All</button>
                     </div>
                     <div className="flex flex-col gap-3">
                        {info?.traffic?.length > 0 ? (
                            info.traffic.slice(0, 5).map((req: any, i: number) => {
                                const active = isRecent(req.timestamp, 30);
                                return (
                                    <div 
                                        key={i} 
                                        className={`bg-white dark:bg-zinc-900/80 p-4 rounded-[24px] border shadow-sm flex items-center justify-between relative overflow-hidden transition-all ${
                                            active 
                                            ? 'border-indigo-500 ring-4 ring-indigo-500/10 dark:ring-indigo-500/20' 
                                            : 'border-gray-100 dark:border-white/5'
                                        }`}
                                    >
                                        {active && (
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-bl-[32px] pointer-events-none animate-pulse" />
                                        )}

                                        <div className="flex items-center gap-4 z-10 w-full overflow-hidden">
                                            <span className={`w-12 h-12 flex items-center justify-center rounded-2xl text-[9px] font-black text-white shadow-sm shrink-0 ${req.method === 'POST' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                                                {req.method}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={req.uri}>
                                                    {req.uri.split('?')[0].split('/').pop()}
                                                </p>
                                                {req.uri.includes('?') && (
                                                    <p className="text-[9px] font-medium text-gray-400 truncate font-mono">
                                                        ?{req.uri.split('?')[1]}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                     {active && (
                                                        <span className="flex items-center gap-1 text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wide animate-pulse">
                                                            <MdFlashOn size={10} /> Live
                                                        </span>
                                                     )}
                                                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{req.ip}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black shrink-0 ${req.status >= 400 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center opacity-40 text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-zinc-900/80 rounded-[32px] border border-gray-100 dark:border-white/5">No Traffic</div>
                        )}
                     </div>
                </section>

                {/* Termnal Logs */}
                <section className="mb-20 animate-slide-up" style={{ animationDelay: '400ms' }}>
                    <div className="flex items-center justify-between mb-4 px-1">
                         <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">System Output</h3>
                         <button onClick={() => navigate('/dev/logs')} className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Console</button>
                    </div>
                    <div className="bg-gray-900 rounded-[28px] p-6 shadow-2xl relative overflow-hidden group min-h-[300px]">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <MdCode size={24} className="text-white" />
                        </div>
                        <div className="space-y-3 font-mono text-[10px]">
                             {info?.logs?.slice(0, 8).map((log: string, i: number) => (
                                <div key={i} className="flex gap-2 text-gray-400 border-l-2 border-transparent hover:border-indigo-500 pl-2 transition-all">
                                    <span className="opacity-30">{`>`}</span>
                                    <span className="break-all line-clamp-2">{log}</span>
                                </div>
                             ))}
                             {(!info?.logs || info.logs.length === 0) && (
                                 <div className="text-center py-4 text-gray-600 italic">No output captured</div>
                             )}
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
};

const MetricCard = ({ label, value, subLabel, icon, colorClass, delay }: any) => (
    <div 
        className="bg-white dark:bg-zinc-900/80 rounded-[28px] p-5 flex flex-col gap-3 shadow-sm border border-gray-100 dark:border-white/5 animate-slide-up h-full" 
        style={{ animationDelay: delay }}
    >
        <div className="flex items-center justify-between">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
                {React.cloneElement(icon, { size: 22 })}
            </div>
        </div>
        <div>
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
            <h4 className="text-2xl font-light text-gray-900 dark:text-white">{value}</h4>
            <p className="text-[9px] font-bold text-indigo-500 mt-1">{subLabel}</p>
        </div>
    </div>
);

export default DevDashboard;
