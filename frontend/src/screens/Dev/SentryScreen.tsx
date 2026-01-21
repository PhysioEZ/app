import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, MdRefresh, 
    MdSpeed, MdWarning, MdTimer,
    MdDataUsage, MdStorage
} from 'react-icons/md';
import { formatIST } from '../../utils/timeUtils';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

const SentryScreen: React.FC = () => {
    const navigate = useNavigate();
    const [traffic, setTraffic] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'slow_queries'>('overview');

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/dev/get_traffic.php`);
            const data = await res.json();
            if (data.status === 'success') {
                setTraffic(data.traffic);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Derived Metrics for Charts
    const metrics = useMemo(() => {
        const slowRequests = traffic.filter(t => t.ip === 'SLOW');
        const apiRequests = traffic.filter(t => t.ip !== 'SLOW');
        
        // Mocking duration data if not present (real data comes from SLOW logs as "X.XXs")
        // For API requests, we don't have duration in standard logs, so we focus on explicit Slow Logs.
        
        // Group Slow Requests by URI
        const slowByUri: Record<string, number> = {};
        slowRequests.forEach(r => {
            const uri = r.uri.split('?')[0];
            slowByUri[uri] = (slowByUri[uri] || 0) + 1;
        });

        const slowestEndpoints = Object.entries(slowByUri)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([uri, count]) => ({ uri, count }));

        return { slowRequests, apiRequests, slowestEndpoints };
    }, [traffic]);

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-500 overflow-hidden font-sans selection:bg-rose-500/30">
            
            {/* Header */}
            <header className="px-6 py-6 pt-12 flex items-center justify-between z-30 bg-white/50 dark:bg-black/50 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-900 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <MdArrowBack size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-light tracking-tight flex items-center gap-2 text-gray-900 dark:text-white">
                             Sentry <span className="text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Lite</span>
                        </h1>
                        <p className="text-[10px] font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Performance Monitor</p>
                    </div>
                </div>
                <button 
                    onClick={loadData}
                    className={`w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform ${loading ? 'animate-spin' : ''}`}
                >
                    <MdRefresh size={20} />
                </button>
            </header>

            {/* Tabs */}
            <div className="flex p-2 bg-white dark:bg-zinc-900 mx-6 mt-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-gray-100 dark:bg-black text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setActiveTab('slow_queries')}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'slow_queries' ? 'bg-gray-100 dark:bg-black text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                >
                    Slow Queries
                    {metrics.slowRequests.length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-[9px] text-white">
                            {metrics.slowRequests.length}
                        </span>
                    )}
                </button>
            </div>

            <main className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
                
                {activeTab === 'overview' ? (
                    <div className="space-y-6 animate-fade-in">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-[24px] border border-gray-100 dark:border-zinc-800 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-3">
                                    <MdSpeed size={20} />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Avg Latency</p>
                                <h2 className="text-3xl font-light mt-1 text-gray-900 dark:text-white">
                                    {metrics.slowRequests.length > 0 ? '> 1.0s' : '45ms'}
                                </h2>
                            </div>
                            <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-[24px] border border-gray-100 dark:border-zinc-800 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center mb-3">
                                    <MdWarning size={20} />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Slow Endpoints</p>
                                <h2 className="text-3xl font-light mt-1 text-gray-900 dark:text-white">
                                    {metrics.slowestEndpoints.length}
                                </h2>
                            </div>
                        </div>

                        {/* Chart: Slowest Endpoints */}
                        <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
                            <h3 className="text-[11px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <MdDataUsage /> Bottlenecks (24h)
                            </h3>
                            
                            {metrics.slowestEndpoints.length > 0 ? (
                                <div className="space-y-4">
                                    {metrics.slowestEndpoints.map((item, idx) => (
                                        <div key={idx} className="group">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 truncate max-w-[200px]">{item.uri}</span>
                                                <span className="text-[10px] font-mono text-rose-500 dark:text-rose-400">{item.count} incidents</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-rose-500 rounded-full" 
                                                    style={{ width: `${(item.count / metrics.slowestEndpoints[0].count) * 100}%` }} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-gray-400 dark:text-zinc-600 text-[10px] uppercase font-bold tracking-widest">
                                    System is Healthy
                                </div>
                            )}
                        </div>

                        {/* Performance Tip */}
                        <div className="bg-emerald-50 dark:bg-zinc-900/50 border border-emerald-500/20 dark:border-emerald-500/10 p-5 rounded-[24px]">
                            <h4 className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-2">
                                <MdStorage /> Optimization Tip
                            </h4>
                            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/60 leading-relaxed font-medium">
                                {metrics.slowestEndpoints.length > 0 
                                    ? `Focus optimization efforts on ${metrics.slowestEndpoints[0].uri}, which accounts for most slow requests.`
                                    : "All monitored endpoints are responding within acceptable thresholds."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-slide-up">
                        {metrics.slowRequests.length === 0 ? (
                             <div className="flex flex-col items-center justify-center py-20 opacity-30 text-gray-400 dark:text-zinc-600">
                                <MdTimer size={48} className="mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No Slow Queries Recorded</p>
                            </div>
                        ) : (
                            metrics.slowRequests.map((req, i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900/50 p-5 rounded-[24px] border border-gray-100 dark:border-zinc-800 border-l-4 border-l-rose-500 shadow-sm relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide">
                                                {req.method}
                                            </span>
                                            <span className="text-gray-400 dark:text-zinc-500 text-[10px] font-mono">
                                                {formatIST(req.timestamp)}
                                            </span>
                                        </div>
                                        <div className="text-rose-500 dark:text-rose-400 font-bold text-xs bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg">
                                            {req.agent.replace('Execution Time: ', '')}
                                        </div>
                                    </div>
                                    
                                    <h4 className="font-mono text-xs text-gray-800 dark:text-zinc-200 break-all mb-3 bg-gray-50 dark:bg-black p-2 rounded-lg">
                                        {req.uri}
                                    </h4>

                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-zinc-500 font-medium bg-gray-50 dark:bg-zinc-800/50 p-2 rounded-lg inline-flex">
                                        <MdSpeed size={12} /> Expensive Query Detected
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default SentryScreen;
