import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, MdRefresh, 
    MdCompareArrows,
    MdNetworkCheck, MdWarning,
    MdClose, MdTimeline, MdExpandMore,
    MdFlashOn
} from 'react-icons/md';
import { formatIST, isRecent } from '../../utils/timeUtils';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface TrafficEntry {
    timestamp: string;
    method: string;
    uri: string;
    ip: string;
    agent: string;
    status: number;
}

interface TrafficGroup {
    id: string;
    uri: string;
    method: string;
    count: number;
    errors: number;
    entries: TrafficEntry[];
    lastActive: string;
}

const TrafficTrackerScreen: React.FC = () => {
    const navigate = useNavigate();
    const [traffic, setTraffic] = useState<TrafficEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<TrafficGroup | null>(null);

    const loadTraffic = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/dev/get_traffic.php`);
            const data = await res.json();
            if (data.status === 'success') {
                setTraffic(data.traffic);
            }
        } catch (error) {
            console.error("Traffic API Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTraffic();
        let interval: any;
        if (autoRefresh) {
            interval = setInterval(loadTraffic, 5000); 
        }
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const groupedTraffic = useMemo(() => {
        const groups: Record<string, TrafficGroup> = {};
        
        traffic.forEach(entry => {
            // Normalize URI (remove query params for grouping)
            const cleanUri = entry.uri.split('?')[0];
            const key = `${entry.method}:${cleanUri}`;
            
            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    uri: cleanUri,
                    method: entry.method,
                    count: 0,
                    errors: 0,
                    entries: [],
                    lastActive: entry.timestamp
                };
            }
            
            // Update last active if this entry is newer
            if (entry.timestamp > groups[key].lastActive) {
                groups[key].lastActive = entry.timestamp;
            }

            groups[key].count++;
            if (entry.status >= 400) groups[key].errors++;
            groups[key].entries.push(entry);
        });

        // Sort by Last Active (Newest Top)
        return Object.values(groups).sort((a, b) => b.lastActive.localeCompare(a.lastActive));
    }, [traffic]);

    const stats = useMemo(() => {
        const total = traffic.length;
        const errors = traffic.filter(t => t.status >= 400).length;
        return { total, errors };
    }, [traffic]);

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Direct Teal Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/20 dark:to-transparent pointer-events-none z-0" />

            {/* Header */}
            <header className="px-6 py-6 pt-12 flex items-center justify-between z-30 relative">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                    >
                        <MdArrowBack size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">Traffic Monitor</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{autoRefresh ? 'Live Stream (2s)' : 'Paused'}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all ${autoRefresh ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-white text-gray-400 border-gray-100'}`}
                    >
                        {autoRefresh ? 'ON' : 'OFF'}
                    </button>
                    <button 
                        onClick={loadTraffic}
                        className={`w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 active:scale-90 transition-transform ${loading ? 'animate-spin' : ''}`}
                    >
                        <MdRefresh size={18} />
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 px-6 overflow-y-auto z-10 no-scrollbar pb-32 relative">
                
                {/* Hero Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white dark:bg-zinc-900/80 p-5 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20 flex items-center justify-center mb-3">
                            <MdNetworkCheck size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Requests</p>
                        <h2 className="text-3xl font-light text-gray-900 dark:text-white mt-1">{stats.total}</h2>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/80 p-5 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-900/20 flex items-center justify-center mb-3">
                            <MdWarning size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Error Rate</p>
                        <h2 className="text-3xl font-light text-gray-900 dark:text-white mt-1">
                            {stats.total > 0 ? ((stats.errors / stats.total) * 100).toFixed(1) : 0}%
                        </h2>
                    </div>
                </div>

                {/* Grouped API List */}
                <div className="space-y-3">
                    {groupedTraffic.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                            <MdCompareArrows size={48} className="text-gray-400 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Waiting for traffic...</p>
                        </div>
                    ) : (
                        groupedTraffic.map((group) => {
                            const active = isRecent(group.lastActive, 30);
                            return (
                                <button 
                                    key={group.id}
                                    onClick={() => setSelectedGroup(group)}
                                    className={`w-full bg-white dark:bg-zinc-900/80 p-4 rounded-[24px] border shadow-sm flex items-center justify-between group active:scale-[0.99] transition-all relative overflow-hidden ${
                                        active 
                                        ? 'border-indigo-500 ring-4 ring-indigo-500/10 dark:ring-indigo-500/20' 
                                        : 'border-gray-100 dark:border-white/5'
                                    }`}
                                >
                                    {/* Pulse Effect for Active Items */}
                                    {active && (
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-bl-[32px] pointer-events-none animate-pulse" />
                                    )}

                                    <div className="flex items-center gap-4 overflow-hidden z-10">
                                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[9px] font-black shrink-0 shadow-inner transition-colors ${
                                             group.method === 'POST' ? 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white' : 
                                             'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'
                                         }`}>
                                             {group.method}
                                         </div>
                                         <div className="text-left min-w-0 flex-1">
                                             <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate" title={group.uri}>
                                                {group.uri.split('?')[0].split('/').filter(Boolean).slice(-2).join('/')}
                                             </h4>
                                             {group.uri.includes('?') && (
                                                <p className="text-[9px] font-medium text-gray-400 truncate font-mono mt-0.5">
                                                    ?{group.uri.split('?')[1]}
                                                </p>
                                             )}
                                             <div className="flex items-center gap-2 mt-1">
                                                {active && (
                                                    <span className="flex items-center gap-1 text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wide animate-pulse">
                                                        <MdFlashOn size={10} /> Live
                                                    </span>
                                                )}
                                                 <span className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-500 px-1.5 py-0.5 rounded ml-0 font-bold uppercase tracking-wide">
                                                    {group.entries.length} Events
                                                 </span>
                                                 {group.errors > 0 && (
                                                    <span className="text-[10px] bg-rose-50 dark:bg-rose-900/20 text-rose-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                                        {group.errors} Errors
                                                    </span>
                                                 )}
                                             </div>
                                         </div>
                                    </div>
                                    <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-full group-hover:bg-gray-100 transition-colors z-10">
                                        <MdExpandMore size={20} className="text-gray-400 -rotate-90 group-hover:text-gray-900 dark:group-hover:text-white" />
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Modal Overlay */}
            {selectedGroup && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end animate-fade-in">
                    <div className="w-full bg-[#f8fafc] dark:bg-zinc-950 rounded-t-[42px] overflow-hidden animate-slide-up max-h-[85%] flex flex-col shadow-2xl border-t border-white/10">
                         {/* Modal Header */}
                         <div className="p-8 pb-4 flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/5">
                            <div>
                                <h3 className="text-xl font-light text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                    {selectedGroup.method} <span className="text-gray-400">/</span> API Details
                                </h3>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1 truncate max-w-[250px]">
                                    {selectedGroup.uri}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedGroup(null)} 
                                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <MdClose size={20} />
                            </button>
                        </div>
                        
                        {/* Modal List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar pb-12 bg-[#f8fafc] dark:bg-black/50">
                             {selectedGroup.entries.map((entry, idx) => (
                                 <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm flex items-center justify-between">
                                     <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                                            <MdTimeline size={20} />
                                         </div>
                                         <div>
                                             <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                    entry.status >= 400 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                    {entry.status}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter">
                                                    {entry.ip}
                                                </span>
                                             </div>
                                             <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                                 {formatIST(entry.timestamp)}
                                             </p>
                                             {entry.agent && (
                                                 <p className="text-[9px] font-medium text-gray-400 mt-1 truncate max-w-[200px]" title={entry.agent}>
                                                     {entry.agent}
                                                 </p>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                 .animate-fade-in { animation: fadeIn 0.3s ease forwards; }
                 .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                 @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                 @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default TrafficTrackerScreen;
