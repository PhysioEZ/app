import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, MdStorage, MdRefresh, MdSearch, MdViewColumn, MdDataArray 
} from 'react-icons/md';
import { useAuthStore } from '../../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface TableInfo {
    name: string;
    rows: number;
    last_updated: string;
}

interface TableDetail {
    table: string;
    columns: any[];
    data: any[];
    status: string;
}

const DbSchemaScreen: React.FC = () => {
    const navigate = useNavigate();
    // const { user } = useAuthStore(); // Not needed for read-only schema check if backend allows it, but let's keep it if we need auth later, actually linter says unused.
    // Removing completely to clean lint
    const { } = useAuthStore();
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [selectedTable, setSelectedTable] = useState<TableDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'columns' | 'data'>('columns');

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/dev/db_schema.php`);
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

    const fetchTableDetails = async (tableName: string) => {
        setLoadingDetail(true);
        try {
            const res = await fetch(`${API_URL}/dev/db_schema.php?table=${tableName}`);
            const data = await res.json();
            if (data.status === 'success') {
                setSelectedTable(data);
                setViewMode('columns');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingDetail(false);
        }
    };

    const filteredTables = tables.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-500 font-sans">
            
            {/* Header */}
            <header className="px-6 py-4 pt-12 pb-6 flex items-center justify-between z-30 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-b border-gray-200 dark:border-white/10 sticky top-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => selectedTable ? setSelectedTable(null) : navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <MdArrowBack size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {selectedTable ? selectedTable.table : 'Database Overview'}
                        </h1>
                        <p className="text-[10px] uppercase font-bold text-blue-500 tracking-widest">
                            {selectedTable ? 'Table Inspector' : 'Schema Explorer'}
                        </p>
                    </div>
                </div>
                {!selectedTable && (
                    <button 
                        onClick={fetchTables}
                        className={`w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 ${loading ? 'animate-spin' : ''}`}
                    >
                        <MdRefresh size={20} />
                    </button>
                )}
            </header>

            <div className="flex-1 overflow-hidden flex flex-col relative">
                
                {/* Search Bar (Only in List View) */}
                {!selectedTable && (
                    <div className="px-6 py-4">
                        <div className="relative">
                            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search tables..."
                                className="w-full bg-white dark:bg-zinc-900 h-12 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-zinc-800 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-20 no-scrollbar">
                    
                    {/* TABLE LIST VIEW */}
                    {!selectedTable ? (
                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-center py-10 text-gray-400 text-xs uppercase tracking-widest">Loading Schema...</div>
                            ) : (
                                filteredTables.map((table) => (
                                    <button 
                                        key={table.name}
                                        onClick={() => fetchTableDetails(table.name)}
                                        className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all hover:border-blue-500/50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                                                <MdStorage size={20} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-mono">{table.name}</h3>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Updated: {table.last_updated}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-lg font-light text-gray-900 dark:text-white">{table.rows.toLocaleString()}</span>
                                            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Entries</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        /* TABLE DETAIL VIEW */
                        <div className="animate-fade-in">
                            
                            {/* Toggle Tabs */}
                            <div className="flex p-1 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 mb-6 mt-4 shadow-sm">
                                <button 
                                    onClick={() => setViewMode('columns')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${viewMode === 'columns' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                                >
                                    <MdViewColumn size={16} /> Structure
                                </button>
                                <button 
                                    onClick={() => setViewMode('data')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${viewMode === 'data' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                                >
                                    <MdDataArray size={16} /> Sample Data
                                </button>
                            </div>

                            {viewMode === 'columns' ? (
                                <div className="space-y-2">
                                    {selectedTable.columns.map((col, idx) => (
                                        <div key={idx} className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 flex flex-col gap-1">
                                            <div className="flex justify-between items-start">
                                                <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">{col.Field}</span>
                                                <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 px-2 py-0.5 rounded">{col.Type}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                {col.Key === 'PRI' && <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">PRIMARY</span>}
                                                {col.Null === 'YES' ? 
                                                    <span className="text-[9px] text-gray-400">Nullable</span> : 
                                                    <span className="text-[9px] text-rose-500 font-medium">Required</span>
                                                }
                                                {col.Default && <span className="text-[9px] text-gray-400">Default: {col.Default}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
                                     <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-gray-50 dark:bg-zinc-800/50">
                                                <tr>
                                                    {selectedTable.columns.map((col, idx) => (
                                                        <th key={idx} className="p-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 dark:border-zinc-800 whitespace-nowrap">
                                                            {col.Field}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                                {selectedTable.data.length > 0 ? selectedTable.data.map((row, rIdx) => (
                                                    <tr key={rIdx}>
                                                        {selectedTable.columns.map((col, cIdx) => (
                                                            <td key={cIdx} className="p-3 text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-nowrap max-w-[150px] truncate">
                                                                {row[col.Field]}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={selectedTable.columns.length} className="p-8 text-center text-gray-400 text-xs">
                                                            No data found in table
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                     </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Loading Overlay */}
            {(loadingDetail) && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

        </div>
    );
};

export default DbSchemaScreen;
