import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, MdHistory, MdSearch, MdEdit, MdDelete, MdAdd, MdInfo,
    MdBarChart, MdTrendingUp, MdFilterList, MdPerson,
    MdSort, MdKeyboardArrowUp, MdClose
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

// --- Interfaces ---

interface AuditLog {
    id: string | number;
    user: string;
    action: string;
    target: string;
    timestamp: string;
    details: string;
    full_details?: {
        old: string | null;
        new: string | null;
    };
}

interface Stats {
    activity: Array<{ date: string; count: number }>;
    distribution: Array<{ action: string; count: number }>;
    top_users: Array<{ user: string; count: number }>;
    summary: {
        total_actions: number;
        unique_users: number;
    };
}

// --- Components ---

const MetricCard = ({ label, value, icon: Icon, colorClass, delay }: any) => (
    <div 
        className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-[20px] p-5 flex flex-col gap-2 shadow-sm border border-white/20 dark:border-gray-800 animate-slide-up" 
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="flex items-center justify-between">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass}`}>
                <Icon size={16} />
            </div>
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</p>
            <h4 className="text-xl font-black text-gray-900 dark:text-white mt-1">{value}</h4>
        </div>
    </div>
);

const ActivityChart = ({ data }: { data: Array<{ date: string; count: number }> }) => {
    if (!data || data.length === 0) return <div className="text-xs text-gray-400 text-center py-4">No activity data available</div>;
    
    // Calculate max value for scaling, ensure at least 1 to avoid divide by zero
    const maxVal = Math.max(...data.map(d => d.count)) || 1;
    
    return (
        <div className="flex items-end justify-between h-28 gap-1 pt-6 px-1">
            {data.map((item, idx) => {
                const heightPct = (item.count / maxVal) * 100;
                // Ensure a minimum visual height of 4px if count > 0, else 0
                const minHeight = item.count > 0 ? '4px' : '0px';
                
                return (
                    <div key={idx} className="flex flex-col items-center flex-1 gap-1 group relative h-full justify-end">
                        <div className="w-full bg-indigo-50 dark:bg-indigo-900/10 rounded-t-sm h-full flex items-end overflow-hidden relative">
                            {/* The Bar */}
                            <div 
                                className="w-full bg-indigo-500 dark:bg-indigo-400 rounded-t-sm transition-all duration-500 relative group-hover:bg-indigo-600 dark:group-hover:bg-indigo-300"
                                style={{ 
                                    height: `calc(${heightPct}% + ${minHeight})`,
                                    minHeight: minHeight
                                }}
                            ></div>
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg">
                            {item.count} Actions
                            <div className="text-[9px] font-normal opacity-80">{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                        
                        {(idx % 4 === 0 || idx === data.length - 1) && (
                            <span className="text-[9px] text-gray-400 absolute -bottom-5 w-max">
                                {new Date(item.date).getDate()}
                            </span>
                        )}
                    </div>
                )
            })}
        </div>
    );
};

const SystemRecordsScreen: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Filters & Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    // Advanced Filters
    const [actionFilter, setActionFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [sortBy, setSortBy] = useState('newest');

    const [showFilters, setShowFilters] = useState(false);
    const [expandedId, setExpandedId] = useState<string | number | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchLogs = useCallback(async (isRefresh = false) => {
        setLoading(true);
        try {
            const branchId = user?.branch_id || 0;
            const query = new URLSearchParams({
                branch_id: branchId.toString(),
                page: isRefresh ? '1' : page.toString(),
                limit: '20',
                search: debouncedSearch,
                action: actionFilter,
                user: userFilter,
                start_date: dateRange.start,
                end_date: dateRange.end,
                sort_by: sortBy
            });

            const res = await fetch(`${API_URL}/admin/records.php?${query.toString()}`);
            const json = await res.json();
            
            if (json.status === 'success') {
                setLogs(json.data);
                if (json.stats) setStats(json.stats);
                setTotalPages(json.pagination?.total_pages || 1);
                if (isRefresh) setPage(1);
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, actionFilter, userFilter, dateRange, sortBy, user]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getActionIcon = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('update') || a.includes('edit')) return <MdEdit size={16} />;
        if (a.includes('delete') || a.includes('remove')) return <MdDelete size={16} />;
        if (a.includes('create') || a.includes('add')) return <MdAdd size={16} />;
        if (a.includes('login')) return <MdPerson size={16} />;
        return <MdInfo size={16} />;
    };

    const getActionDetails = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('update') || a.includes('edit')) return { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' };
        if (a.includes('delete') || a.includes('remove')) return { color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' };
        if (a.includes('create') || a.includes('add')) return { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
        return { color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' };
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setActionFilter('all');
        setUserFilter('all');
        setDateRange({ start: '', end: '' });
        setSortBy('newest');
        setShowFilters(false);
    };

    const applyFilters = () => {
        fetchLogs(true);
        setShowFilters(false);
    }

    const activeFiltersCount = 
        (searchTerm ? 1 : 0) + 
        (actionFilter !== 'all' ? 1 : 0) + 
        (userFilter !== 'all' ? 1 : 0) +
        (dateRange.start ? 1 : 0) +
        (sortBy !== 'newest' ? 1 : 0);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-black font-sans transition-colors relative">
            
            {/* Direct Teal Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/20 dark:to-transparent pointer-events-none z-0" />

            {/* Header */}
            <div className="bg-transparent px-5 py-4 pt-12 sticky top-0 z-20">
                <div className="flex items-center gap-4 mb-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors active:scale-95"
                    >
                        <MdArrowBack size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">System Records</h1>
                        <p className="text-[10px] font-bold text-gray-500/80 dark:text-gray-400 uppercase tracking-widest mt-1">Audit Trail & Security</p>
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            showFilters || activeFiltersCount > 0
                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' 
                            : 'bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md text-gray-500 border border-white/50 dark:border-white/10'
                        }`}
                    >
                        {activeFiltersCount > 0 ? (
                            <div className="relative">
                                <MdFilterList size={20} />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
                            </div>
                        ) : (
                            <MdSearch size={20} />
                        )}
                    </button>
                </div>

                {/* Search & Filter Panel */}
                {showFilters && (
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 mb-2 animate-scale-in space-y-4 border border-white/20 dark:border-white/5 shadow-xl relative overflow-hidden">
                        
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filters</span>
                            <button onClick={() => setShowFilters(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                                <MdClose size={18} />
                            </button>
                        </div>
                        
                        <div className="relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search details..."
                                className="w-full bg-gray-50 dark:bg-black border-none rounded-xl pl-9 pr-4 py-3 text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <select 
                                value={actionFilter}
                                onChange={e => setActionFilter(e.target.value)}
                                className="bg-gray-50 dark:bg-black border-none rounded-xl px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-teal-500/20 appearance-none"
                            >
                                <option value="all">All Actions</option>
                                <option value="create">Create</option>
                                <option value="update">Update</option>
                                <option value="delete">Delete</option>
                                <option value="login">Login</option>
                            </select>

                            <select 
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="bg-gray-50 dark:bg-black border-none rounded-xl px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-teal-500/20 appearance-none"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="user_asc">User (A-Z)</option>
                                <option value="user_desc">User (Z-A)</option>
                            </select>
                        </div>

                         <div className="grid grid-cols-1 gap-3">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <MdPerson size={16} />
                                </span>
                                <select 
                                    value={userFilter}
                                    onChange={(e) => setUserFilter(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-black border-none rounded-xl pl-9 pr-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-teal-500/20 appearance-none transition-all"
                                >
                                    <option value="all">All Users</option>
                                    {stats?.top_users?.map((u, i) => (
                                        <option key={i} value={u.user}>{u.user} ({u.count})</option>
                                    ))}
                                </select>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <MdSort className="rotate-90" />
                                </span>
                            </div>
                         </div>
                            
                        <div className="flex gap-2">
                             <input 
                                type="date"
                                value={dateRange.start}
                                onChange={e => setDateRange({...dateRange, start: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-black border-none rounded-xl px-2 py-3 text-[10px] font-bold text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-teal-500/20"
                            />
                            <input 
                                type="date"
                                value={dateRange.end}
                                onChange={e => setDateRange({...dateRange, end: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-black border-none rounded-xl px-2 py-3 text-[10px] font-bold text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-teal-500/20"
                            />
                        </div>

                        <div className="flex justify-between gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                            <button 
                                onClick={clearFilters}
                                className="px-4 py-3 text-[10px] font-bold uppercase text-gray-400 hover:text-gray-600"
                            >
                                Reset
                            </button>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowFilters(false)}
                                    className="px-5 py-3 text-[10px] font-bold uppercase text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-xl"
                                >
                                    Hide
                                </button>
                                <button 
                                    onClick={applyFilters}
                                    className="px-6 py-3 text-[10px] font-bold uppercase text-white bg-teal-600 rounded-xl shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    Apply <MdKeyboardArrowUp />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 no-scrollbar relative z-10 space-y-6">
                
                {/* Insights Section */}
                {stats && !loading && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                            <MetricCard 
                                label="Total Events"
                                value={stats.summary.total_actions}
                                icon={MdHistory}
                                colorClass="bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20"
                                delay={0}
                            />
                             <MetricCard 
                                label="Top Action"
                                value={stats.distribution[0]?.action || 'N/A'}
                                icon={MdTrendingUp}
                                colorClass="bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20"
                                delay={50}
                            />
                        </div>

                        {/* Activity Chart */}
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-[28px] p-6 shadow-sm border border-white/20 dark:border-white/5 animate-slide-up" style={{ animationDelay: '100ms' }}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <MdBarChart size={14} /> Activity Timeline
                                </h3>
                                <div className="flex items-center gap-2">
                                     <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full">{stats.activity.length} Days</span>
                                </div>
                            </div>
                            <ActivityChart data={stats.activity} />
                        </div>
                    </div>
                )}

                {/* Records List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detailed Logs</h3>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase">
                           <MdSort /> {sortBy.replace('_', ' ')}
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="py-20 flex flex-col items-center opacity-50">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Records...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-20 text-center opacity-50">
                            <MdFilterList size={32} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No records found matching filters</p>
                        </div>
                    ) : (
                        logs.map((log, idx) => {
                            const style = getActionDetails(log.action);
                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                                    className="bg-white dark:bg-gray-900 p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm active:scale-[0.99] transition-transform animate-slide-up cursor-pointer group hover:border-teal-100 dark:hover:border-teal-900/30"
                                    style={{ animationDelay: `${Math.min(idx * 50, 500)}ms` }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${style.bg} ${style.color}`}>
                                            {getActionIcon(log.action)}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-black text-gray-900 dark:text-white truncate">
                                                    {log.user}
                                                </h4>
                                                <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                                                    {formatDate(log.timestamp)}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mb-2">
                                                 <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${style.bg} ${style.color}`}>
                                                     {log.action}
                                                 </span>
                                                 <span className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]">
                                                     {log.target}
                                                 </span>
                                            </div>

                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                                                {log.details}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Expanded Details */}
                                    {expandedId === idx && (
                                        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 animate-slide-up">
                                             <div className="grid grid-cols-1 gap-3 text-[10px] font-mono">
                                                {log.full_details?.old && (
                                                    <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/20 overflow-x-auto">
                                                        <span className="block font-black text-rose-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Before
                                                        </span>
                                                        <pre className="text-rose-900 dark:text-rose-100 whitespace-pre-wrap font-medium">{log.full_details.old}</pre>
                                                    </div>
                                                )}
                                                {log.full_details?.new && (
                                                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 overflow-x-auto">
                                                        <span className="block font-black text-emerald-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> After
                                                        </span>
                                                        <pre className="text-emerald-900 dark:text-emerald-100 whitespace-pre-wrap font-medium">{log.full_details.new}</pre>
                                                    </div>
                                                )}
                                                {!log.full_details?.old && !log.full_details?.new && log.details && (
                                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                                                        <p className="text-gray-500 italic">Full details: {log.details}</p>
                                                    </div>
                                                )}
                                             </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Pagination */}
            {!loading && logs.length > 0 && (
                <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between pb-[calc(1rem+env(safe-area-inset-bottom))] sticky bottom-0 z-20">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-6 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 disabled:opacity-30 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                    >
                        Prev
                    </button>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Page {page} of {totalPages}
                    </span>
                    <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 disabled:opacity-30 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-gray-200 dark:shadow-none"
                    >
                        Next
                    </button>
                </div>
            )}
            
            <style>{`
                .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; transform: translateY(20px); }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
                @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

export default SystemRecordsScreen;
