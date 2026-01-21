import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
    MdArrowBack, MdRefresh, MdSearch, 
    MdTerminal, MdContentCopy, MdCheck,
    MdFolderOpen, MdClose, MdFilePresent,
    MdTune
} from 'react-icons/md';
import { formatIST } from '../../utils/timeUtils';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface LogEntry {
    id: number;
    timestamp: string;
    type: 'error' | 'warning' | 'info' | 'notice';
    message: string;
    file?: string;
    raw: string;
    isJson?: boolean;
}

interface LogFile {
    name: string;
    size: number;
    modified: string;
}

const LogsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [parsedLogs, setParsedLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
    const [copied, setCopied] = useState(false);
    const [showExplorer, setShowExplorer] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [logFiles, setLogFiles] = useState<LogFile[]>([]);
    const [currentFile, setCurrentFile] = useState('error_log_prospine_in');
    const scrollRef = useRef<HTMLDivElement>(null);

    const parseLogs = (lines: string[]) => {
        const logs: LogEntry[] = [];
        let currentEntry: LogEntry | null = null;

        lines.forEach((line, index) => {
            const timestampMatch = line.match(/^\[(.*?)\]\s+(.*?):\s+(.*)/);
            
            if (timestampMatch) {
                if (currentEntry) logs.push(currentEntry);
                const [_, timestampRaw, typeStr, content] = timestampMatch;
                
                // Try to format timestamp to IST
                let timestamp = formatIST(timestampRaw);
                const type = typeStr.toLowerCase().includes('error') ? 'error' : 
                             typeStr.toLowerCase().includes('warning') ? 'warning' : 'info';
                currentEntry = { id: index, timestamp, type, message: content, raw: line };
            } else if (currentEntry) {
                currentEntry.message += '\n' + line;
                currentEntry.raw += '\n' + line;
                if (line.includes('{') || line.includes(': "')) currentEntry.isJson = true;
            } else {
                logs.push({ id: index, timestamp: '>', type: 'info', message: line, raw: line });
            }
        });
        if (currentEntry) logs.push(currentEntry);
        setParsedLogs(logs);
    };

    const loadLogs = async (fileName: string = currentFile) => {
        setLoading(true);
        try {
            const empId = user?.employee_id || (user as any)?.id;
            const res = await fetch(`${API_URL}/dev/logs.php?lines=400&file=${fileName}&employee_id=${empId}`);
            const data = await res.json();
            if (data.status === 'success') {
                parseLogs(data.lines);
                setCurrentFile(fileName);
            }
        } catch (error) {
            console.error("Logs API Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFileList = async () => {
        try {
            const empId = user?.employee_id || (user as any)?.id;
            const res = await fetch(`${API_URL}/dev/list_logs.php?employee_id=${empId}`);
            const data = await res.json();
            if (data.status === 'success') {
                setLogFiles(data.files);
            }
        } catch (error) {
            console.error("List Logs Error:", error);
        }
    };

    useEffect(() => {
        loadLogs();
        fetchFileList();
        const interval = setInterval(() => loadLogs(currentFile), 15000);
        return () => clearInterval(interval);
    }, [currentFile]);

    useEffect(() => {
        if (scrollRef.current && parsedLogs.length > 0) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [parsedLogs, filter]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredLogs = parsedLogs.filter(log => {
        const matchesSearch = log.raw.toLowerCase().includes(searchTerm.toLowerCase());
        if (filter === 'all') return matchesSearch;
        return matchesSearch && log.type === filter;
    });

    const stats = {
        errors: parsedLogs.filter(l => l.type === 'error').length,
        warnings: parsedLogs.filter(l => l.type === 'warning').length,
        total: parsedLogs.length
    };

    const copyLogs = () => {
        const text = filteredLogs.map(l => l.raw).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                        <div onClick={() => setShowExplorer(true)} className="cursor-pointer group">
                            <h1 className="text-xl font-light text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                System Logs <MdFolderOpen size={16} className="text-indigo-500 group-hover:scale-110 transition-transform"/>
                            </h1>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5 truncate max-w-[200px] group-hover:text-indigo-500 transition-colors">
                                {currentFile}
                            </p>
                        </div>
                    </div>
                
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={copyLogs}
                            className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                        >
                            {copied ? <MdCheck className="text-emerald-500" /> : <MdContentCopy size={18} />}
                        </button>
                        <button 
                            onClick={() => loadLogs()}
                            className={`w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 active:scale-90 transition-transform ${loading ? 'animate-spin' : ''}`}
                        >
                            <MdRefresh size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Terminal Console */}
            <div className="flex-1 overflow-hidden relative mx-6 mb-8 rounded-[32px] bg-zinc-950 border border-white/5 shadow-2xl z-20">
                <div className="absolute top-0 left-0 right-0 h-8 bg-zinc-900/80 border-b border-white/5 flex items-center px-4 gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                    <span className="ml-auto text-[9px] font-mono text-zinc-600">bash --tail</span>
                </div>
                
                <div ref={scrollRef} className="h-full overflow-y-auto pt-10 p-5 font-mono text-[10px] leading-relaxed select-text no-scrollbar">
                    {filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-800 opacity-50">
                            <MdTerminal size={48} />
                            <p className="text-[9px] uppercase font-black tracking-[0.3em] mt-3">Console Idle</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <div key={log.id} className="mb-4 group">
                                <div className="flex items-start gap-3">
                                    <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${
                                        log.type === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                                        log.type === 'warning' ? 'bg-amber-500' : 'bg-zinc-700'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <span className={`text-[8px] font-bold uppercase tracking-widest ${
                                                log.type === 'error' ? 'text-rose-400' : 
                                                log.type === 'warning' ? 'text-amber-400' : 'text-zinc-500'
                                            }`}>{log.type}</span>
                                            <span className="text-zinc-600 text-[8px] font-mono tracking-tight">{log.timestamp}</span>
                                        </div>
                                        <div className={`break-words whitespace-pre-wrap ${
                                            log.type === 'error' ? 'text-rose-200/90' : 
                                            log.type === 'warning' ? 'text-amber-200/90' : 'text-zinc-400'
                                        }`}>
                                            {log.message}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div className="h-10" />
                </div>
            </div>

            {/* Filter FAB */}
            <div className="absolute bottom-24 right-8 z-50">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-14 h-14 rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center active:scale-90 transition-transform hover:scale-105"
                >
                    {showFilters ? <MdClose size={24} /> : <MdTune size={24} />}
                </button>
            </div>

            {/* Filter & Search Overlay */}
            {showFilters && (
                <div className="absolute bottom-40 right-8 z-50 w-auto max-w-[350px] min-w-[300px] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-[24px] p-4 shadow-2xl animate-scale-in origin-bottom-right">
                    <div className="space-y-4">
                        <div className="relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="search" 
                                autoFocus
                                placeholder="Grep logs..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Levels</p>
                             <div className="flex flex-wrap gap-2">
                                <FilterChip label="All" count={stats.total} active={filter === 'all'} onClick={() => setFilter('all')} color="indigo" />
                                <FilterChip label="Err" count={stats.errors} active={filter === 'error'} onClick={() => setFilter('error')} color="rose" />
                                <FilterChip label="Warn" count={stats.warnings} active={filter === 'warning'} onClick={() => setFilter('warning')} color="amber" />
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Explorer Overlay */}
            {showExplorer && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end animate-fade-in">
                    <div className="w-full bg-[#f8fafc] dark:bg-zinc-950 rounded-t-[42px] overflow-hidden animate-slide-up max-h-[85%] flex flex-col shadow-2xl border-t border-white/10">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">Log Files</h3>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Available Descriptors</p>
                            </div>
                            <button 
                                onClick={() => setShowExplorer(false)} 
                                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <MdClose size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar pb-12">
                            {logFiles.map((file) => (
                                <button 
                                    key={file.name}
                                    onClick={() => {
                                        loadLogs(file.name);
                                        setShowExplorer(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-4 rounded-[24px] border transition-all active:scale-[0.98] ${
                                        currentFile === file.name 
                                        ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                        : 'bg-white dark:bg-zinc-900/50 border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentFile === file.name ? 'bg-white/20' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500'}`}>
                                            <MdFilePresent size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold truncate max-w-[200px]">{file.name}</p>
                                            <p className={`text-[9px] uppercase font-bold tracking-widest mt-0.5 ${currentFile === file.name ? 'text-white/70' : 'text-gray-400'}`}>
                                                {formatSize(file.size)} • {file.modified}
                                            </p>
                                        </div>
                                    </div>
                                    {currentFile === file.name && <MdCheck size={20} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                 .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                 @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
};

const FilterChip = ({ label, count, active, onClick, color }: any) => {
    const variants: any = {
        indigo: active ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400',
        rose: active ? 'bg-rose-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400',
        amber: active ? 'bg-amber-500 text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400',
    };
    return (
        <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${variants[color]}`}>
            {label}
            {count > 0 && <span className="opacity-60">{count}</span>}
        </button>
    );
};

export default LogsScreen;
