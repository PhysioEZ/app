import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, MdStorage, MdRefresh, MdSpeed, MdWarning, MdCheck
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface TableInfo {
    table_name: string;
    table_rows: number;
    size_mb: number;
    overhead_mb: number;
    engine: string;
    update_time: string;
}

const TableManagementScreen: React.FC = () => {
    const navigate = useNavigate();
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [optimizing, setOptimizing] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadTables();
    }, []);

    const loadTables = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/dev/table_management.php?action=list_tables`);
            const data = await res.json();
            if (data.status === 'success') {
                setTables(data.tables);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const optimizeTable = async (tableName: string) => {
        setOptimizing(tableName);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('action', 'optimize_table');
            formData.append('table_name', tableName);
            
            const res = await fetch(`${API_URL}/dev/table_management.php`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                setMessage({ type: 'success', text: data.message });
                loadTables(); // Reload to see updated overhead
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: `Network error: ${error.message}` });
        } finally {
            setOptimizing(null);
        }
    };

    const optimizeAll = async () => {
        setOptimizing('all');
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('action', 'optimize_all');
            
            const res = await fetch(`${API_URL}/dev/table_management.php`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                setMessage({ type: 'success', text: data.message });
                loadTables();
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: `Network error: ${error.message}` });
        } finally {
            setOptimizing(null);
        }
    };

    const totalSize = tables.reduce((sum, t) => sum + parseFloat(t.size_mb.toString()), 0);
    const totalOverhead = tables.reduce((sum, t) => sum + parseFloat(t.overhead_mb.toString()), 0);

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/20 dark:to-transparent pointer-events-none z-0" />
            
            {/* Header */}
            <header className="px-6 py-6 pt-12 flex items-center justify-between z-30 relative">
                <div className="animate-fade-in">
                   <p className="text-[10px] font-medium text-gray-500/70 dark:text-gray-500 uppercase tracking-[0.2em] mb-0.5">
                     Database
                   </p>
                   <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
                     Table Management
                   </h1>
                </div>
                
                <div className="flex items-center gap-3">
                    {/*  */}
                    <button 
                        onClick={loadTables}
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
                
                {/* Summary Cards */}
                <section className="mb-6 animate-scale-in">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-zinc-900/80 p-5 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                    <MdStorage size={20} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Size</p>
                            </div>
                            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{totalSize.toFixed(2)} MB</p>
                            <p className="text-[10px] text-gray-500 mt-1">{tables.length} tables</p>
                        </div>

                        <div className="bg-white dark:bg-zinc-900/80 p-5 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <MdWarning size={20} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overhead</p>
                            </div>
                            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{totalOverhead.toFixed(2)} MB</p>
                            <p className="text-[10px] text-gray-500 mt-1">Can be optimized</p>
                        </div>
                    </div>
                </section>

                {/* Optimize All Button */}
                <section className="mb-6">
                    <button
                        onClick={optimizeAll}
                        disabled={optimizing === 'all'}
                        className="w-full py-4 rounded-[20px] bg-emerald-600 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-98 transition-all disabled:opacity-50"
                    >
                        {optimizing === 'all' ? 'Optimizing...' : <><MdSpeed size={18} /> Optimize All Tables</>}
                    </button>
                </section>

                {/* Message */}
                {message && (
                    <div className={`mb-4 p-4 rounded-[20px] border ${
                        message.type === 'success' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
                    } flex items-center gap-3`}>
                        {message.type === 'success' ? <MdCheck size={18} /> : <MdWarning size={18} />}
                        <span className="text-sm font-bold">{message.text}</span>
                    </div>
                )}

                {/* Tables List */}
                <section className="space-y-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    {tables.map((table, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900/80 p-4 rounded-[20px] border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{table.table_name}</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{table.engine} • {table.table_rows.toLocaleString()} rows</p>
                                </div>
                                <button
                                    onClick={() => optimizeTable(table.table_name)}
                                    disabled={optimizing === table.table_name}
                                    className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {optimizing === table.table_name ? 'Optimizing...' : 'Optimize'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-xl">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Size</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{table.size_mb} MB</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-xl">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Overhead</p>
                                    <p className={`text-lg font-bold ${parseFloat(table.overhead_mb.toString()) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                                        {table.overhead_mb} MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
};

export default TableManagementScreen;
