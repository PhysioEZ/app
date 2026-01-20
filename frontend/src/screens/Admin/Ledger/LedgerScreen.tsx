import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdTrendingUp, 
    MdAccountBalanceWallet, 
    MdFilterList, 
    MdExpandMore, 
    MdPayments, 
    MdScience,
    MdPerson,
    MdReceiptLong,
    MdLocalHospital,
    MdTrendingDown,
    MdChevronLeft
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface LedgerSummary {
    total_income: number;
    total_expenses: number;
    net_profit_loss: number;
    opening_balance: number;
    current_balance: number;
}

interface Transaction {
    description: string;
    branch_name: string;
    method: 'cash' | 'online';
    credit: number;
    debit: number;
    time: string;
}

interface DailyLedger {
    date: string;
    opening_balance: { total: number; cash: number; online: number };
    credits: { total: number; cash: number; online: number };
    debits: { total: number; cash: number; online: number };
    closing_balance: { total: number; cash: number; online: number };
    transactions: Transaction[];
}

const LedgerScreen: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<LedgerSummary | null>(null);
    const [ledger, setLedger] = useState<DailyLedger[]>([]);
    
    // Filters
    const now = new Date();
    const listStartOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const listEndOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [startDate, setStartDate] = useState(listStartOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(listEndOfMonth.toISOString().split('T')[0]);
    
    // Expanded state
    const [expandedDate, setExpandedDate] = useState<string | null>(null);

    const fetchLedger = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            const branchId = user?.branch_id || 1; 
            params.append('branch_id', branchId.toString());
            params.append('start_date', startDate);
            params.append('end_date', endDate);

            const response = await fetch(`${API_BASE_URL}/admin/ledger.php?${params.toString()}`);
            const data = await response.json();

            if (data.status === 'success') {
                setSummary(data.summary);
                setLedger(data.ledger);
            }
        } catch (error) {
            console.error("Failed to fetch ledger", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            day: date.getDate(),
            month: date.toLocaleString('default', { month: 'short' }),
            year: date.getFullYear(),
            weekday: date.toLocaleString('default', { weekday: 'long' })
        };
    };

    const getTxnIcon = (desc: string) => {
        const d = desc.toLowerCase();
        if (d.includes('test') || d.includes('lab') || d.includes('diagnostic')) return <MdScience size={20} />;
        if (d.includes('registration')) return <MdPerson size={20} />;
        if (d.includes('treatment') || d.includes('session')) return <MdLocalHospital size={20} />;
        if (d.includes('expense') || d.includes('purchase')) return <MdReceiptLong size={20} />;
        return <MdPayments size={20} />;
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Branded Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/10 dark:to-transparent pointer-events-none z-0" />
            
            {/* Sticky Navigation & Title */}
            <header className="px-6 py-6 pt-12 flex flex-col gap-6 z-30 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/admin/menu')} 
                            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900/50 shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
                        >
                            <MdChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">Financial Ledger</h1>
                            <p className="text-[10px] font-medium text-teal-600/70 dark:text-teal-400 uppercase tracking-[0.2em] mt-2">Real-time Accounting</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[9px] font-medium text-teal-600/70 dark:text-teal-400/50 uppercase tracking-widest mb-0.5">Balance</p>
                        <p className="text-xl font-light text-teal-600 dark:text-teal-400 tracking-tighter">
                            {summary ? formatCurrency(summary.current_balance) : '...'}
                        </p>
                    </div>
                </div>

                {/* Date Controls */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center bg-white/70 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white dark:border-gray-800 p-1.5 shadow-sm overflow-hidden">
                         <div className="relative flex-1 min-w-0">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-transparent border-none text-[11px] font-medium text-gray-700 dark:text-gray-300 px-3 py-2 focus:ring-0 appearance-none"
                            />
                        </div>
                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-1 shrink-0" />
                        <div className="relative flex-1 min-w-0">
                             <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-transparent border-none text-[11px] font-medium text-gray-700 dark:text-gray-300 px-3 py-2 focus:ring-0 text-right appearance-none"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={fetchLedger}
                        className="w-12 h-12 bg-gray-900 dark:bg-teal-600 text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-transform shrink-0"
                    >
                        <MdFilterList size={22} />
                    </button>
                </div>
            </header>

            <main className="flex-1 px-6 overflow-y-auto no-scrollbar pb-32 z-10 relative">
                
                {isLoading && !summary ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-8 h-8 border-2 border-gray-100 border-t-teal-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Compiling Records...</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Snapshot - Redesigned to be more 'Hero' like */}
                        <section className="mb-8 animate-scale-in">
                            <div className="bg-[#00796B] rounded-[40px] p-8 shadow-[0_12px_40px_rgba(0,121,107,0.2)] text-white relative overflow-hidden">
                                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[60px]" />
                                
                                <div className="relative z-10 flex flex-col gap-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                <MdAccountBalanceWallet size={16} />
                                            </div>
                                            <span className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-80">Period Performance</span>
                                        </div>
                                        <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[9px] font-medium uppercase tracking-widest whitespace-nowrap">Net ROI</span>
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest pl-1">Accumulated Net</p>
                                            <h2 className="text-4xl font-light tracking-tighter truncate max-w-[200px]">
                                                {formatCurrency(summary?.net_profit_loss || 0)}
                                            </h2>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                                                <MdTrendingUp size={10} /> Income
                                            </div>
                                            <p className="text-lg font-light tracking-tight">{formatCurrency(summary?.total_income || 0)}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-rose-300">
                                                 <MdTrendingDown size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Expenses</p>
                                                <p className="text-sm font-medium truncate">{formatCurrency(summary?.total_expenses || 0)}</p>
                                            </div>
                                        </div>
                                         <div className="flex items-center gap-3 justify-end text-right">
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Opening</p>
                                                <p className="text-sm font-medium truncate">{formatCurrency(summary?.opening_balance || 0)}</p>
                                            </div>
                                            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-teal-300">
                                                 <MdPayments size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Daily Timeline */}
                        <div className="space-y-4">
                            {ledger.length > 0 ? ledger.map((day, idx) => {
                                const d = formatDate(day.date);
                                const isExpanded = expandedDate === day.date;
                                
                                return (
                                    <div 
                                        key={day.date} 
                                        className={`bg-white dark:bg-gray-900 rounded-[32px] border transition-all duration-300 animate-slide-up
                                            ${isExpanded ? 'border-teal-100 dark:border-teal-900 shadow-xl shadow-teal-500/5' : 'border-gray-100 dark:border-gray-800 shadow-sm'}
                                        `}
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                    >
                                        <div 
                                            onClick={() => setExpandedDate(isExpanded ? null : day.date)}
                                            className="p-5 flex flex-col gap-4 cursor-pointer active:scale-[0.99] transition-transform"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-12 h-12 rounded-2xl bg-[#00796B]/5 dark:bg-teal-500/10 flex flex-col items-center justify-center border border-[#00796B]/10 shrink-0">
                                                        <span className="text-[9px] font-medium text-teal-600/60 uppercase leading-none">{d.month}</span>
                                                        <span className="text-xl font-light text-teal-700 dark:text-teal-400 mt-1">{d.day}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{d.weekday}</h4>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{d.year}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right shrink-0">
                                                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-0.5">Closing</p>
                                                    <p className="text-base font-medium text-gray-900 dark:text-white tracking-tight">
                                                        {formatCurrency(day.closing_balance.total)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Preview Strip: In/Out Badges */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800/50">
                                                <div className="flex gap-2 overflow-hidden">
                                                    <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100/50 dark:border-emerald-500/10 flex items-center gap-1.5 shrink-0">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                        <span className="text-[9px] font-medium text-emerald-600">+{formatCurrency(day.credits.total)}</span>
                                                    </div>
                                                    <div className="px-3 py-1 bg-rose-50 dark:bg-rose-500/10 rounded-full border border-rose-100/50 dark:border-rose-500/10 flex items-center gap-1.5 shrink-0">
                                                        <div className="w-1 h-1 rounded-full bg-rose-500" />
                                                        <span className="text-[9px] font-medium text-rose-500">-{formatCurrency(day.debits.total)}</span>
                                                    </div>
                                                </div>
                                                <div className={`transition-transform duration-500 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                                                    <MdExpandMore size={20} className="text-gray-300" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* EXPANDED VIEW */}
                                        {isExpanded && (
                                            <div className="px-5 pb-6 space-y-8 animate-fade-in">
                                                
                                                {/* Structural Balance Breakdown */}
                                                <div className="bg-[#f8fafc] dark:bg-gray-950/50 rounded-3xl p-6 border border-gray-100/50 dark:border-gray-800 grid grid-cols-2 gap-y-6 gap-x-8">
                                                    <BalanceMetric label="Opening" value={day.opening_balance.total} sub="Start" />
                                                    <BalanceMetric label="Closing" value={day.closing_balance.total} sub="End" isHighlight />
                                                    
                                                    <div className="col-span-2 h-px bg-gray-200/50 dark:bg-gray-800/50 my-1" />
                                                    
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.2em] mb-2">Vault Cash</p>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{formatCurrency(day.closing_balance.cash)}</p>
                                                            <p className="text-[8px] text-emerald-500 font-bold uppercase truncate">+{formatCurrency(day.credits.cash)} Cr</p>
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.2em] mb-2 text-right">E-Banking</p>
                                                        <div className="space-y-1 text-right">
                                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{formatCurrency(day.closing_balance.online)}</p>
                                                            <p className="text-[8px] text-emerald-500 font-bold uppercase truncate">+{formatCurrency(day.credits.online)} Cr</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Daily Transaction Feed */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-4 px-1">
                                                        <h5 className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.3em]">Operational Feed</h5>
                                                        <span className="text-[9px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-400 shrink-0">{day.transactions.length} Events</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {day.transactions.map((txn, tIdx) => (
                                                            <div key={tIdx} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-50 dark:border-gray-800 flex items-center justify-between gap-3 active:scale-[0.98] transition-all">
                                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm 
                                                                        ${txn.debit > 0 ? 'bg-rose-50 text-rose-400 dark:bg-rose-900/10' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/10'}`}>
                                                                        {getTxnIcon(txn.description)}
                                                                    </div>
                                                                    <div className="min-w-0 overflow-hidden">
                                                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate leading-snug">{txn.description}</p>
                                                                        <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
                                                                            <span className="text-[8px] font-bold bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                                                {txn.time}
                                                                            </span>
                                                                            <span className="text-[9px] text-gray-300 font-medium uppercase tracking-widest">{txn.method}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <p className={`text-sm font-medium tracking-tighter ${txn.credit > 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                                                                        {txn.credit > 0 ? '+' : '-'}{formatCurrency(txn.credit || txn.debit)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="flex flex-col items-center justify-center py-32 opacity-30">
                                    <MdAccountBalanceWallet size={48} className="text-gray-400 mb-4" />
                                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em]">Zero Activity Period</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

// --- Helper Components ---

const BalanceMetric = ({ label, value, sub, isHighlight }: any) => (
    <div className="min-w-0">
        <p className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
        <h5 className={`text-lg font-light tracking-tighter truncate ${isHighlight ? 'text-[#00796B] dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
        </h5>
        <p className="text-[8px] text-gray-300 uppercase font-medium truncate">{sub}</p>
    </div>
);

export default LedgerScreen;
