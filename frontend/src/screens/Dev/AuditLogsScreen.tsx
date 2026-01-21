import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, MdRefresh, MdSearch, 
    MdHistory, MdPerson, MdLayers, MdCompareArrows,
    MdChevronLeft, MdChevronRight, MdCode, MdExpandMore, MdExpandLess
} from 'react-icons/md';
import { formatIST } from '../../utils/timeUtils';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface AuditLog {
    log_id: string;
    log_timestamp: string;
    username: string;
    action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN_SUCCESS' | 'LOGIN_FAIL' | 'LOGOUT';
    target_table: string;
    target_id: string;
    details_before: string;
    details_after: string;
    ip_address: string;
}

const AuditLogsScreen: React.FC = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const limit = 50;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/dev/audit_logs.php?limit=${limit}&offset=${page * limit}&search=${searchTerm}`);
            const data = await res.json();
            if (data.status === 'success') {
                setLogs(data.logs);
                setTotal(data.pagination.total);
            }
        } catch (error) {
            console.error("Audit Logs API Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchLogs();
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchLogs();
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Direct Teal Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/20 dark:to-transparent pointer-events-none z-0" />

            {/* Header */}
            <header className="px-6 py-6 pt-12 flex flex-col gap-6 z-30 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                        >
                            <MdArrowBack size={18} />
                        </button>
                        <div>
                            <h1 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">Audit Logs</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Event Stream</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => { setPage(0); fetchLogs(); }}
                        className={`w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 active:scale-90 transition-transform ${loading ? 'animate-spin' : ''}`}
                    >
                        <MdRefresh size={18} />
                    </button>
                </div>

                {/* Search Bar Embedded in Header */}
                <form onSubmit={handleSearch} className="relative">
                     <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                     <input 
                         type="text" 
                         placeholder="Search events..." 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="w-full bg-white/50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white backdrop-blur-md placeholder:text-gray-400"
                     />
                </form>
            </header>

            {/* Logs List */}
            <div ref={containerRef} className="flex-1 overflow-y-auto px-6 space-y-3 no-scrollbar pb-40 z-10 relative">
                {logs.length === 0 && !loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-zinc-700 opacity-50 py-20">
                        <MdHistory size={64} />
                        <p className="text-[10px] font-black uppercase tracking-widest mt-4">No events found</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <LogCard key={log.log_id} log={log} />
                    ))
                )}
            </div>

            {/* Pagination Floating Bar */}
            <div className="absolute min-w-[200px] bottom-16 left-1/2 -translate-x-1/2 flex items-center justify-between p-2 px-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-full shadow-2xl z-20 mb-8">
                <button 
                    disabled={page === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 disabled:opacity-30 active:scale-90 transition-all hover:bg-gray-100 dark:hover:bg-white/5"
                >
                    <MdChevronLeft size={20} />
                </button>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-4">
                    Page <span className="text-gray-900 dark:text-white">{page + 1}</span>
                </div>
                <button 
                    disabled={(page + 1) * limit >= total}
                    onClick={() => setPage(p => p + 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 disabled:opacity-30 active:scale-90 transition-all hover:bg-gray-100 dark:hover:bg-white/5"
                >
                    <MdChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

// Extracted Card for cleaner code & potential interactivity
const LogCard = ({ log }: { log: AuditLog }) => {
    const [expanded, setExpanded] = useState(false);

    const getActionColor = (action: string) => {
        if (action === 'DELETE') return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
        if (action === 'CREATE') return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
        if (action === 'UPDATE') return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
        return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    };

    const date = new Date(log.log_timestamp);
    const timeStr = formatIST(log.log_timestamp);
    const dateStr = date.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' });

    return (
        <div 
            onClick={() => setExpanded(!expanded)}
            className="bg-white dark:bg-zinc-900/80 p-5 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-sm active:scale-[0.99] transition-all group cursor-pointer"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${getActionColor(log.action_type)}`}>
                        <MdLayers size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black text-gray-900 dark:text-white">{log.action_type}</h3>
                            <span className="text-[9px] font-bold text-gray-400 lowercase tracking-wide">{log.target_table}</span>
                        </div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {log.target_id}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">{timeStr}</span>
                    <span className="text-[8px] font-bold text-gray-300 dark:text-zinc-600 uppercase tracking-widest block mt-0.5">{dateStr}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <MdPerson size={12} className="text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 truncate">{log.username || 'System'}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                    <MdCompareArrows size={12} className="text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter">{log.ip_address}</span>
                </div>
            </div>

            {log.details_after && expanded && (
                <div className="mt-4 animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-2">
                        <MdCode size={12} className="text-indigo-500" />
                        <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Change Payload</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-black/40 rounded-xl border border-gray-100 dark:border-white/5 overflow-x-auto">
                        <pre className="text-[9px] font-mono text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-all">
                            {log.details_after}
                        </pre>
                    </div>
                </div>
            )}
            
            <div className="flex justify-center mt-2 opacity-20">
                {expanded ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
            </div>
        </div>
    );
};

export default AuditLogsScreen;
