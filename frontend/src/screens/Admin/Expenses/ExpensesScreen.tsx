import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdFilterList, 
    MdCalendarToday, 
    MdCheckCircle, 
    MdCancel, 
    MdDescription,
    MdRefresh,
    MdPayments,
    MdAccountBalanceWallet,
    MdBusiness,
    MdPerson,
    MdAdd,
    MdClose,
    MdArrowForward,
    MdTrendingUp,
    MdChevronLeft
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface Expense {
    expense_id: number;
    voucher_no: string;
    description: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    expense_date: string;
    paid_to: string;
    expense_for: string;
    payment_method: string;
    branch_name: string;
    creator_username: string;
    approver_username: string | null;
}

const AdminExpensesScreen: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'clinic' | 'admin' | 'personal'>('clinic');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [stats, setStats] = useState({ total_amount: 0 });
    const [branches, setBranches] = useState<{branch_id: number, branch_name: string}[]>([]);
    const [categories, setCategories] = useState<{category_id: number, category_name: string}[]>([]);
    
    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        branch_id: user?.branch_id || '',
        category: '',
        expense_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'cash',
        cheque_details: '',
        paid_to: '',
        manual_voucher_no: '',
        description: ''
    });

    // Filters
    const now = new Date();
    const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    
    const fetchBranches = useCallback(async () => {
        if (!user?.employee_id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/expenses.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_branches', user_id: user.employee_id })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setBranches(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch branches", error);
        }
    }, [user?.employee_id]);

    const fetchCategories = useCallback(async () => {
        if (!user?.employee_id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/expenses.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_categories', user_id: user.employee_id })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setCategories(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    }, [user?.employee_id]);

    useEffect(() => {
        fetchBranches();
        fetchCategories();
    }, [fetchBranches, fetchCategories]);

    const fetchExpenses = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('type', activeTab);
            params.append('start_date', startDate);
            params.append('end_date', endDate);
            if (user?.branch_id) params.append('branch_id', user.branch_id.toString());
            
            const response = await fetch(`${API_BASE_URL}/admin/expenses.php?${params.toString()}`);
            const data = await response.json();

            if (data.status === 'success') {
                setExpenses(data.data);
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch expenses", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, startDate, endDate, user?.branch_id]);

    useEffect(() => {
        fetchExpenses();
        // Set default payee for personal
        setFormData(prev => ({
            ...prev,
            paid_to: activeTab === 'personal' ? 'Self' : ''
        }));
    }, [fetchExpenses, activeTab]);

    const handleUpdateStatus = async (expenseId: number, newStatus: string) => {
        try {
            setExpenses(prev => prev.map(e => 
                e.expense_id === expenseId ? { ...e, status: newStatus as any } : e
            ));

            const response = await fetch(`${API_BASE_URL}/admin/expenses.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_status',
                    expense_id: expenseId,
                    status: newStatus,
                    user_id: user?.employee_id
                })
            });
            const data = await response.json();
            if (data.status !== 'success') {
                fetchExpenses();
                alert('Authorization failed');
            }
        } catch (error) {
            console.error(error);
            fetchExpenses();
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const action = activeTab === 'personal' ? 'create_personal_expense' : 'create_admin_expense';
            const response = await fetch(`${API_BASE_URL}/admin/expenses.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    user_id: user?.employee_id,
                    ...formData
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setIsModalOpen(false);
                setFormData({ 
                    branch_id: user?.branch_id || '',
                    category: '',
                    expense_date: new Date().toISOString().split('T')[0],
                    amount: '',
                    payment_method: 'cash',
                    cheque_details: '',
                    paid_to: activeTab === 'personal' ? 'Self' : '',
                    manual_voucher_no: '',
                    description: ''
                });
                fetchExpenses();
            } else {
                alert('Validation error: ' + data.message);
            }
        } catch (error) {
            console.error(error);
            alert('Cloud sync failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-900/20';
            case 'paid': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20';
            default: return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/20';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-200 relative overflow-hidden font-sans">
            
            {/* Branded Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/10 dark:to-transparent pointer-events-none z-0" />

            {/* Header Toolbar */}
            <header className="px-6 py-6 pt-12 flex flex-col gap-6 z-40 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/admin/menu')} 
                            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900/50 shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
                        >
                            <MdChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">Financial Audit</h1>
                            <p className="text-[10px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] mt-2">Expenses & Spendings</p>
                        </div>
                    </div>
                    {(activeTab === 'admin' || activeTab === 'personal') && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className={`w-12 h-12 rounded-2xl ${activeTab === 'personal' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-teal-600 shadow-teal-500/20'} text-white flex items-center justify-center shadow-xl active:scale-90 transition-all`}
                        >
                            <MdAdd size={28} />
                        </button>
                    )}
                </div>

                <div className="flex p-1 bg-gray-50 dark:bg-zinc-900 rounded-2xl mb-4 border border-gray-100 dark:border-white/5">
                    <button 
                        onClick={() => setActiveTab('clinic')}
                        className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                            activeTab === 'clinic' 
                            ? 'bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm border border-gray-100 dark:border-white/5' 
                            : 'text-gray-400'
                        }`}
                    >
                        Reception
                    </button>
                    <button 
                        onClick={() => setActiveTab('admin')}
                        className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                            activeTab === 'admin' 
                            ? 'bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm border border-gray-100 dark:border-white/5' 
                            : 'text-gray-400'
                        }`}
                    >
                        Clinic
                    </button>
                    <button 
                        onClick={() => setActiveTab('personal')}
                        className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                            activeTab === 'personal' 
                            ? 'bg-white dark:bg-zinc-800 text-rose-500 dark:text-rose-400 shadow-sm border border-gray-100 dark:border-white/5' 
                            : 'text-gray-400'
                        }`}
                    >
                        Personal
                    </button>
                </div>

                {/* Audit Window Picker */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-900 p-2 rounded-xl border border-gray-100 dark:border-white/5 flex-1 min-w-[220px]">
                        <div className="relative flex-1">
                            <MdCalendarToday size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-transparent border-none text-[10px] font-black uppercase text-gray-900 dark:text-white pl-8 outline-none focus:ring-0"
                            />
                        </div>
                        <span className="text-gray-300">/</span>
                        <div className="relative flex-1">
                             <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-transparent border-none text-[10px] font-black uppercase text-gray-900 dark:text-white pr-2 outline-none focus:ring-0 text-right"
                            />
                        </div>
                    </div>
                     <button 
                        onClick={fetchExpenses}
                        className="w-10 h-10 bg-gray-900 dark:bg-teal-600 text-white rounded-xl flex items-center justify-center transition-all active:scale-90"
                     >
                        <MdRefresh size={18} />
                     </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
                <div className="p-6 pb-32 space-y-6">
                    
                    {/* Expenditure Snapshot Hero */}
                    <div className={`p-8 rounded-[40px] bg-gradient-to-br ${activeTab === 'personal' ? 'from-rose-500 to-rose-600 dark:from-rose-700 dark:to-rose-900' : 'from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-900'} text-white shadow-2xl relative overflow-hidden group`}>
                        <div className="relative z-10">
                             <div className="flex justify-between items-start mb-10">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10">
                                    <MdAccountBalanceWallet size={24} />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none mb-2">Cycle period</p>
                                    <p className="text-xs font-bold bg-black/10 px-3 py-1 rounded-full border border-white/5 whitespace-nowrap">
                                        {activeTab === 'clinic' ? 'Staff Payouts' : activeTab === 'personal' ? 'Self-Managed' : 'Clinic Costs'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                 <p className="text-[11px] font-black text-white/60 uppercase tracking-[0.3em] mb-2 leading-none">Gross Expenditure</p>
                                 <h3 className="text-5xl font-black tracking-tighter">
                                    {formatCurrency(stats.total_amount)}
                                 </h3>
                            </div>
                        </div>
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none transition-all duration-1000 group-hover:scale-110" />
                    </div>

                    {/* Expenditure Stream */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Auditing stream...</p>
                            </div>
                        ) : expenses.length > 0 ? (
                            expenses.map((expense, idx) => (
                                <div key={expense.expense_id} className="bg-white dark:bg-zinc-900 p-5 rounded-[28px] shadow-sm border border-gray-100 dark:border-white/5 animate-slide-up group" style={{ animationDelay: `${idx * 40}ms` }}>
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center">
                                                <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{new Date(expense.expense_date).getDate()}</p>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{new Date(expense.expense_date).toLocaleString('default', { month: 'short' })}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-[16px] font-black text-gray-900 dark:text-white tracking-tight leading-tight group-hover:text-teal-500 transition-colors uppercase truncate max-w-[160px]">
                                                    {expense.paid_to}
                                                </h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                    VOUCHER #{expense.voucher_no || 'UNTITLED'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-current flex items-center gap-1.5 ${getStatusStyles(expense.status)}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                            {expense.status}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 dark:bg-zinc-800/40 p-5 rounded-[24px] border border-gray-100/50 dark:border-white/5 mb-4">
                                        <p className="text-xs text-gray-600 dark:text-gray-300 font-bold leading-relaxed italic line-clamp-2">
                                            "{expense.description || expense.expense_for || 'No detailed log entry provided.'}"
                                        </p>
                                        <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100 dark:border-zinc-700/50">
                                             <div className="flex items-center gap-3">
                                                 <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-teal-600 border border-gray-50 dark:border-white/5 shadow-sm"><MdBusiness size={18} /></div>
                                                 <div>
                                                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Station</p>
                                                     <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 truncate max-w-[80px]">{expense.branch_name}</p>
                                                 </div>
                                             </div>
                                             <div className="flex items-center gap-3 justify-end text-right">
                                                 <div>
                                                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Initiator</p>
                                                     <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 truncate max-w-[80px]">{expense.creator_username.split(' ')[0]}</p>
                                                 </div>
                                                 <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-indigo-600 border border-gray-50 dark:border-white/5 shadow-sm"><MdPerson size={18} /></div>
                                             </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100/50 dark:border-teal-900/20 shadow-sm"><MdPayments size={20} /></div>
                                             <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Market Value</p>
                                                <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
                                                    {formatCurrency(expense.amount)}
                                                </span>
                                             </div>
                                        </div>

                                        {activeTab === 'clinic' && expense.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleUpdateStatus(expense.expense_id, 'approved')}
                                                    className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
                                                >
                                                    <MdCheckCircle size={22} />
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateStatus(expense.expense_id, 'rejected')}
                                                    className="w-12 h-12 bg-gray-50 dark:bg-zinc-800 text-gray-400 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-white/5 active:scale-90 transition-all"
                                                >
                                                    <MdCancel size={22} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 text-center">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-900 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-gray-200 dark:text-zinc-800 border border-gray-100 dark:border-white/5 shadow-inner">
                                    <MdDescription size={40} />
                                </div>
                                <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.3em]">No archive entries</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Archive Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col animate-in slide-in-from-bottom duration-500 font-sans">
                    <header className="px-8 pt-12 pb-6 flex justify-between items-center border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Asset reallocation</p>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Record {activeTab === 'personal' ? 'Personal' : 'Clinic'} Expense</h3>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-900 dark:text-white active:scale-90 transition-all">
                            <MdClose size={24} />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[#f8fafc]/50 dark:bg-black">
                        <div className="max-w-md mx-auto space-y-8 pb-32">
                            
                            <div className="space-y-6">
                                <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] border-l-2 border-teal-500 pl-3">Logistics Meta</p>
                                
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Voucher ID (Optional)</label>
                                    <div className="relative">
                                        <MdDescription className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="Enter Voucher No."
                                            value={formData.manual_voucher_no}
                                            onChange={(e) => setFormData({...formData, manual_voucher_no: e.target.value})}
                                            className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-14 pr-5 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 focus:border-teal-500/50 shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Primary Station</label> 
                                    <div className="relative">
                                        <MdBusiness className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select 
                                            value={formData.branch_id} 
                                            onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                                            className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-14 pr-10 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 appearance-none focus:border-teal-500/50 shadow-sm"
                                        >
                                            <option value="">Detecting Branch...</option>
                                            {branches.map(branch => (
                                                <option key={branch.branch_id} value={branch.branch_id}>
                                                    {branch.branch_name}
                                                </option>
                                            ))}
                                        </select>
                                        <MdFilterList className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Audit Date</label>
                                        <div className="relative">
                                            <MdCalendarToday className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input 
                                                type="date" 
                                                required
                                                value={formData.expense_date}
                                                onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                                                className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black uppercase text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 focus:border-teal-500/50 shadow-sm"
                                            />
                                        </div>
                                     </div>
                                      <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Gross Value (₹)</label>
                                        <input 
                                            type="number" 
                                            required
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 px-5 text-sm font-black text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 focus:border-teal-500/50 shadow-sm"
                                        />
                                     </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] border-l-2 border-indigo-500 pl-3">Economic Classification</p>
                                
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Expenditure Purpose</label>
                                    <div className="relative">
                                        <MdTrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            list="category-options"
                                            required
                                            placeholder="Select or Type New Category"
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-14 pr-10 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 focus:border-teal-500/50 shadow-sm"
                                        />
                                        <datalist id="category-options">
                                            {categories.map(cat => (
                                                <option key={cat.category_id} value={cat.category_name} />
                                            ))}
                                        </datalist>
                                        <MdArrowForward className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Beneficiary (Payee)</label>
                                    <div className="relative">
                                        <MdPerson className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="Vendor or Employee Name"
                                            value={formData.paid_to}
                                            onChange={(e) => setFormData({...formData, paid_to: e.target.value})}
                                            className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-14 pr-5 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 focus:border-teal-500/50 shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Settlement Channel</label>
                                    <div className="relative">
                                        <MdPayments className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select 
                                            required
                                            value={formData.payment_method}
                                            onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                                            className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-14 pr-10 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 appearance-none focus:border-teal-500/50 shadow-sm"
                                        >
                                            <option value="cash">Hard Currency (Cash)</option>
                                            <option value="upi-hdfc">UPI (HDFC Bank)</option>
                                            <option value="net_banking">Internet Banking (NEFT)</option>
                                            <option value="cheque">Instrumental (Cheque)</option>
                                            <option value="cc_hdfc">Credit Card (HDFC)</option>
                                            <option value="cc_sbi">Credit Card (SBI)</option>
                                            <option value="other">Other Channel</option>
                                        </select>
                                        <MdPayments className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                </div>

                                {formData.payment_method === 'cheque' && (
                                     <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Instrument Details</label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="Cheque # / Drawee Bank"
                                            value={formData.cheque_details}
                                            onChange={(e) => setFormData({...formData, cheque_details: e.target.value})}
                                            className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 px-5 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 focus:border-teal-500/50 shadow-sm"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Clinical Remarks</label>
                                    <div className="relative">
                                        <textarea 
                                            rows={3}
                                            className="w-full bg-white dark:bg-zinc-900 rounded-3xl py-4 px-6 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 shadow-sm focus:border-teal-500/50 resize-none placeholder:text-gray-300 dark:placeholder:text-zinc-700"
                                            placeholder="Provide audit context..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Elite Modal Footer */}
                    <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl shrink-0 z-50">
                        <button 
                            onClick={handleCreateExpense}
                            disabled={isSubmitting}
                            className={`w-full h-16 ${activeTab === 'personal' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-teal-600 hover:bg-teal-700'} text-white font-black rounded-[24px] shadow-2xl shadow-teal-500/30 active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50`}
                        >
                            {isSubmitting ? 'SECURELY SAVING...' : (
                                <>
                                    <MdAccountBalanceWallet size={20} />
                                    Log {activeTab === 'personal' ? 'Personal' : 'Clinic'} Expenditure
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExpensesScreen;


