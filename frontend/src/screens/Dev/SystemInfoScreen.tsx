import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, MdMemory, MdDns, MdRefresh, 
    MdInfo, MdSettings, MdStorage
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

const SystemInfoScreen: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [phpConfig, setPhpConfig] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'php_config'>('overview');
    const [loading, setLoading] = useState(false);

    const loadStats = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/dev/info.php`);
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Stats Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadPhpConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/dev/info.php?action=php_config`);
            const data = await res.json();
            if (data.status === 'success') {
                setPhpConfig(data.data);
            }
        } catch (error) {
            console.error("PHP Config Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'overview') {
            loadStats();
        } else {
            loadPhpConfig();
        }
    }, [activeTab]);

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Background Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-blue-50 via-blue-50/50 to-transparent dark:from-blue-900/20 dark:to-transparent pointer-events-none z-0" />

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
                        <h1 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">System Info</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Server Diagnostics</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => activeTab === 'overview' ? loadStats() : loadPhpConfig()}
                    className={`w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 active:scale-90 transition-transform ${loading ? 'animate-spin' : ''}`}
                >
                    <MdRefresh size={18} />
                </button>
            </header>

            {/* Tabs */}
            <div className="px-6 mb-6 z-20 relative">
                <div className="bg-white dark:bg-zinc-900/80 p-1.5 rounded-[20px] border border-gray-100 dark:border-white/5 flex shadow-sm">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-3 rounded-[16px] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                            activeTab === 'overview' 
                            ? 'bg-blue-500 text-white shadow-md' 
                            : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                    >
                        <MdDns size={16} /> Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('php_config')}
                        className={`flex-1 py-3 rounded-[16px] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                            activeTab === 'php_config' 
                            ? 'bg-blue-500 text-white shadow-md' 
                            : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                    >
                        <MdInfo size={16} /> PHP Config
                    </button>
                </div>
            </div>

            {/* Content */}
            <main className="flex-1 px-6 overflow-y-auto z-10 no-scrollbar pb-32 relative">
                
                {activeTab === 'overview' && stats && (
                    <div className="space-y-4 animate-slide-up">
                        {/* Environment Card */}
                        <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                            
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <MdSettings className="text-blue-500" /> Environment
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-[20px] bg-gray-50 dark:bg-white/5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">PHP Version</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">{stats.environment?.php_version}</p>
                                </div>
                                <div className="p-4 rounded-[20px] bg-gray-50 dark:bg-white/5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">API Version</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                                        {stats.environment?.api_version}
                                    </p>
                                </div>
                                <div className="p-4 rounded-[20px] bg-gray-50 dark:bg-white/5 col-span-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">DB Connection</p>
                                            <p className="text-lg font-bold text-emerald-500 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                {stats.environment?.db_status}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Response Time</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">{stats.environment?.load_time}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resources Card */}
                        <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden">
                             <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <MdMemory className="text-indigo-500" /> Resources
                            </h3>
                            
                            <div className="space-y-6">
                                {/* Memory Usage */}
                                <div>
                                    <div className="flex justify-between mb-2 items-end">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <MdMemory className="text-gray-400" size={14} /> Memory Usage
                                        </div>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white font-mono">
                                            {stats.system?.memory_usage} <span className="text-gray-400 font-normal">/ {stats.system?.memory_limit}</span>
                                        </p>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                                            style={{ width: `${Math.min(stats.system?.memory_percent || 0, 100)}%` }}
                                        /> 
                                    </div>
                                    <p className="text-[10px] text-right text-gray-400 mt-1 font-mono">
                                        {stats.system?.memory_percent}% Used
                                    </p>
                                </div>

                                {/* Disk Usage */}
                                <div>
                                    <div className="flex justify-between mb-2 items-end">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <MdStorage className="text-gray-400" size={14} /> Disk Total
                                        </div>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white font-mono">
                                            {stats.system?.disk_total} 
                                        </p>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                                            style={{ width: `${Math.min(stats.system?.disk_used_percent || 0, 100)}%` }}
                                        /> 
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <p className="text-[10px] text-gray-400 font-mono">Used: {stats.system?.disk_used_percent}%</p>
                                        <p className="text-[10px] text-gray-400 font-mono">Free: {stats.system?.disk_free}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-8">
                             <p className="text-[10px] text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em] font-medium">Server Timestamp</p>
                             <p className="text-xs font-mono text-gray-400 mt-1">{stats.timestamp}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'php_config' && phpConfig && (
                    <div className="space-y-4 animate-slide-up">
                        {/* Core Settings */}
                        <div className="bg-white dark:bg-zinc-900/80 rounded-[28px] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Core Configuration</h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {Object.entries(phpConfig.Core || {}).map(([key, value]) => (
                                    <div key={key} className="flex justify-between p-4 px-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{key}</span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white font-mono text-right max-w-[200px] break-words">
                                            {String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Database Drivers */}
                        <div className="bg-white dark:bg-zinc-900/80 rounded-[28px] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                             <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Database Drivers</h3>
                            </div>
                             <div className="p-6">
                                <div className="flex flex-wrap gap-2">
                                    {String(phpConfig.Database['PDO Drivers']).split(', ').map(driver => (
                                        <span key={driver} className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
                                            {driver}
                                        </span>
                                    ))}
                                </div>
                             </div>
                        </div>

                        {/* OPcache */}
                        {phpConfig.OPcache && (
                            <div className="bg-white dark:bg-zinc-900/80 rounded-[28px] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                                <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">OPcache Status</h3>
                                </div>
                                <div className="flex p-4 gap-4">
                                    <div className="flex-1 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-center">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Status</p>
                                        <p className={`text-lg font-bold ${phpConfig.OPcache.Enabled === 'Yes' ? 'text-emerald-500' : 'text-gray-400'}`}>
                                            {phpConfig.OPcache.Enabled}
                                        </p>
                                    </div>
                                    <div className="flex-1 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-center">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Memory Used</p>
                                        <p className="text-lg font-bold text-indigo-500">
                                            {phpConfig.OPcache['Memory Used']}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Installed Extensions */}
                        <div className="bg-white dark:bg-zinc-900/80 rounded-[28px] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Loaded Extensions</h3>
                            </div>
                            <div className="p-6 flex flex-wrap gap-2">
                                {(phpConfig.Extensions || []).map((ext: string) => (
                                    <span key={ext} className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase tracking-wider border border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                        {ext}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>
                )}

            </main>

            <style>{`
                 .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                 .animate-fade-in { animation: fadeIn 0.3s ease forwards; }
                 @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                 @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default SystemInfoScreen;
