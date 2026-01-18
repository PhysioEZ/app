import { useState, useEffect } from 'react';
import { 
  MdArrowBack, MdCalendarToday, MdAdd, MdClose, MdAccountBalanceWallet,
  MdCheckCircle, MdAccessTime, MdWarning, MdReceipt, MdTrendingUp,
  MdAttachMoney, MdRefresh
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// --- Utility for Indian Number to Words ---
const numberToWords = (price: any) => {
  const sglDigit = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const dblDigit = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tensPlace = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const handle_tens = (d: any) => {
    let str = "";
    let num = parseInt(d);
    if (num > 0 && num < 10) {
      str = sglDigit[num] + " ";
    } else if (num > 9 && num < 20) {
      str = dblDigit[num - 10] + " ";
    } else if (num > 19) {
      str = tensPlace[parseInt(d[0])] + " " + sglDigit[parseInt(d[1])] + " ";
    }
    return str;
  };

  const convert = (n: any): string => {
    let str = "";
    let num = parseInt(n);
    if (!num) return "";
    
    if (num >= 10000000) {
        str += convert(Math.floor(num / 10000000)) + "Crore ";
        num %= 10000000;
    }
    if (num >= 100000) {
        str += convert(Math.floor(num / 100000)) + "Lakh ";
        num %= 100000;
    }
    if (num >= 1000) {
        str += convert(Math.floor(num / 1000)) + "Thousand ";
        num %= 1000;
    }
    if (num >= 100) {
        str += convert(Math.floor(num / 100)) + "Hundred ";
        num %= 100;
    }
    if (num > 0) {
        if(str != "") str += "and ";
        str += handle_tens(num.toString().padStart(2,'0'));
    }
    return str;
  };

  let str = convert(price).trim();
  return str ? str + " Rupees Only" : "";
}

// --- Expense Details Modal ---
const ExpenseDetailsModal = ({ expense, onClose }: { expense: any; onClose: () => void }) => {
    if (!expense) return null;
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-slide-up">
            <div className="bg-surface dark:bg-gray-900 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-slide-up border border-outline-variant/10 dark:border-gray-800 max-h-[90vh] overflow-y-auto no-scrollbar">
                {/* Hero Header */}
                <div className="relative bg-gradient-to-br from-primary via-secondary to-tertiary p-6 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="relative z-10 flex justify-between items-start mb-6">
                         <h3 className="text-lg font-bold font-poppins">Voucher Details</h3>
                         <button onClick={onClose} className="p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors">
                            <MdClose size={18} />
                         </button>
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Total Amount</p>
                        <h2 className="text-4xl font-black font-poppins tracking-tight mt-1">₹{Number(expense.amount).toLocaleString()}</h2>
                        {expense.amount_in_words && (
                            <p className="text-[10px] font-medium opacity-70 italic mt-2 capitalize">
                                {expense.amount_in_words}
                            </p>
                        )}
                    </div>
                </div>
                
                {/* Details */}
                <div className="px-6 py-6 space-y-5 bg-surface dark:bg-gray-900">
                    <div className="flex justify-between items-center py-3 border-b border-outline-variant/10 dark:border-gray-800">
                         <span className="text-xs font-bold text-outline dark:text-gray-400 uppercase">Status</span>
                         <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${
                             expense.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                             expense.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                             'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                         }`}>
                             {expense.status}
                         </span>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <p className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase mb-1">Paid To</p>
                            <p className="text-sm font-bold text-on-surface dark:text-white">{expense.paid_to}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase mb-1">Date</p>
                            <p className="text-sm font-bold text-on-surface dark:text-white">{new Date(expense.expense_date).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase mb-1">Done By</p>
                            <p className="text-sm font-bold text-on-surface dark:text-white">{expense.expense_done_by || 'N/A'}</p>
                        </div>
                         <div>
                            <p className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase mb-1">Payment</p>
                            <p className="text-sm font-bold text-on-surface dark:text-white capitalize">{expense.payment_method}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase mb-1">Category / For</p>
                            <p className="text-sm font-bold text-on-surface dark:text-white">{expense.expense_for}</p>
                        </div>
                    </div>

                    {expense.description && (
                        <div className="bg-surface-variant/30 dark:bg-gray-800/50 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase mb-2">Description</p>
                            <p className="text-xs font-medium text-on-surface-variant dark:text-gray-300 leading-relaxed">
                                {expense.description}
                            </p>
                        </div>
                    )}
                    
                    <div className="text-center pt-2">
                        <p className="text-[10px] text-outline dark:text-gray-500 font-bold font-mono">Voucher No: {expense.voucher_no}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Add Expense Modal ---
const AddExpenseModal = ({ show, onClose, onSave, loading }: any) => {
    if (!show) return null;
    
    const [formData, setFormData] = useState({
        voucher_no: '',
        expense_date: new Date().toISOString().split('T')[0],
        paid_to: '',
        expense_done_by: '',
        expense_for: '',
        amount: '',
        payment_method: '',
        description: '',
        amount_in_words: ''
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'amount') {
                newData.amount_in_words = value ? numberToWords(Number(value)) : '';
            }
            return newData;
        });
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
             <div className="bg-surface dark:bg-gray-900 rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up border-t border-outline-variant/10 dark:border-gray-800">
                {/* Header */}
                <div className="px-6 py-5 border-b border-outline-variant/10 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold font-poppins text-on-surface dark:text-white">New Expense</h3>
                        <p className="text-xs text-primary font-bold uppercase tracking-wider">Create Voucher</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-surface-variant dark:bg-gray-800 hover:bg-surface-variant/80 transition-colors">
                        <MdClose size={20} className="text-on-surface dark:text-white" />
                    </button>
                </div>
                
                {/* Form */}
                <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                    <form id="add-expense-form" onSubmit={handleSubmit} className="space-y-5">
                         {/* Amount Hero */}
                         <div className="flex flex-col items-center justify-center p-6 bg-primary/10 dark:bg-primary/20 rounded-[28px] border border-primary/20">
                             <label className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Total Amount</label>
                             <div className="relative flex items-center justify-center w-full">
                                 <span className="text-2xl font-black text-primary mr-2">₹</span>
                                 <input 
                                     type="number" name="amount" required min="1" step="0.01" placeholder="0"
                                     value={formData.amount} onChange={handleChange}
                                     className="w-1/2 bg-transparent text-center text-4xl font-black font-poppins text-primary border-none outline-none placeholder-primary/30"
                                     autoFocus
                                 />
                             </div>
                         </div>

                         {/* Fields */}
                         <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1.5">
                                     <label className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase ml-1">Paid To</label>
                                     <input 
                                         type="text" name="paid_to" required
                                         value={formData.paid_to} onChange={handleChange}
                                         className="w-full bg-surface-variant/50 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm font-bold text-on-surface dark:text-white border border-outline-variant/20 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                         placeholder="Recipient"
                                     />
                                 </div>
                                 <div className="space-y-1.5">
                                     <label className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase ml-1">Method</label>
                                     <select 
                                         name="payment_method" required
                                         value={formData.payment_method} onChange={handleChange}
                                         className="w-full bg-surface-variant/50 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm font-bold text-on-surface dark:text-white border border-outline-variant/20 dark:border-gray-700 outline-none"
                                     >
                                         <option value="">Select...</option>
                                         <option value="cash">Cash</option>
                                         <option value="online">Online / UPI</option>
                                         <option value="card">Card</option>
                                         <option value="cheque">Cheque</option>
                                     </select>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1.5">
                                     <label className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase ml-1">Category</label>
                                     <input 
                                         type="text" name="expense_for" required
                                         value={formData.expense_for} onChange={handleChange}
                                         className="w-full bg-surface-variant/50 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm font-bold text-on-surface dark:text-white border border-outline-variant/20 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                         placeholder="e.g. Supplies"
                                     />
                                 </div>
                                 <div className="space-y-1.5">
                                     <label className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase ml-1">Date</label>
                                     <input 
                                         type="date" name="expense_date" required
                                         value={formData.expense_date} onChange={handleChange}
                                         className="w-full bg-surface-variant/50 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm font-bold text-on-surface dark:text-white border border-outline-variant/20 dark:border-gray-700 outline-none"
                                     />
                                 </div>
                             </div>

                             <div className="space-y-1.5">
                                     <label className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase ml-1">Amount In Words</label>
                                     <input 
                                         type="text" name="amount_in_words"
                                         value={formData.amount_in_words} onChange={handleChange}
                                         className="w-full bg-surface-variant/50 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm font-bold text-on-surface dark:text-white border border-outline-variant/20 dark:border-gray-700 outline-none"
                                         placeholder="Auto-generated"
                                     />
                             </div>
                             
                             <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase ml-1">Description (Optional)</label>
                                 <textarea 
                                     name="description" 
                                     value={formData.description} onChange={handleChange}
                                     placeholder="Add notes..."
                                     rows={3}
                                     className="w-full bg-surface-variant/50 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm font-medium text-on-surface dark:text-white border border-outline-variant/20 dark:border-gray-700 resize-none outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                 />
                             </div>
                         </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-outline-variant/10 dark:border-gray-800">
                    <button 
                        form="add-expense-form"
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-primary text-on-primary text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div> : <MdCheckCircle size={20} />}
                        Save Voucher
                    </button>
                    <p className="text-center text-[10px] text-outline dark:text-gray-500 mt-3 font-medium">
                        Approval status calculated based on daily budget
                    </p>
                </div>
             </div>
        </div>
    );
};

// --- Main Component ---
export const ExpensesScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const [loading, setLoading] = useState(false);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
            const branchId = user?.branch_id || 1;
            
            const params = new URLSearchParams({
                branch_id: branchId.toString(),
                start_date: startDate,
                end_date: endDate,
                limit: '1000'
            });

            const res = await fetch(`${baseUrl}/expenses.php?${params.toString()}`);
            const json = await res.json();
            
            if (json.status === 'success') {
                setExpenses(json.data);
                setStats(json.stats);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [startDate, endDate]);

    const handleSaveExpense = async (formData: any) => {
        setSaving(true);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
            const branchId = user?.branch_id || 1;
            const res = await fetch(`${baseUrl}/expenses.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    branch_id: branchId,
                    user_id: user?.id || 0,
                    expense_done_by: formData.expense_done_by || user?.name || 'Admin'
                })
            });
            const json = await res.json();
            if (json.status === 'success') {
                setShowAddModal(false);
                fetchExpenses();
            } else {
                alert("Error: " + json.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (n: any) => {
        const num = Number(n);
        return isNaN(num) ? '₹0' : `₹${num.toLocaleString('en-IN')}`;
    };

    return (
        <div className="flex flex-col h-full bg-surface dark:bg-black font-sans transition-colors relative">
            {/* Primary Gradient Mesh */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/30 to-transparent pointer-events-none z-0 dark:from-primary/10" />

            {/* Header */}
            <div className="bg-transparent backdrop-blur-xl sticky top-0 z-20 pt-[max(env(safe-area-inset-top),32px)] transition-colors border-b border-outline-variant/5">
                <div className="px-5 py-3 mb-2">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-surface-variant/40 text-on-surface dark:text-white transition-colors">
                            <MdArrowBack size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight">Expenses</h1>
                            <p className="text-xs font-medium text-outline/80 dark:text-gray-400">Financial Management</p>
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="flex gap-2">
                         <div className="flex-1 bg-surface-variant/40 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl flex items-center px-4 py-2.5 border border-outline-variant/10 dark:border-gray-700">
                             <MdCalendarToday className="text-outline dark:text-gray-400 mr-3" size={16} />
                             <div className="flex-1">
                                 <p className="text-[9px] font-bold text-outline dark:text-gray-500 uppercase tracking-wider">Start Date</p>
                                 <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent w-full text-xs font-bold text-on-surface dark:text-white outline-none" />
                             </div>
                         </div>
                         <div className="flex-1 bg-surface-variant/40 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl flex items-center px-4 py-2.5 border border-outline-variant/10 dark:border-gray-700">
                             <MdCalendarToday className="text-outline dark:text-gray-400 mr-3" size={16} />
                             <div className="flex-1">
                                 <p className="text-[9px] font-bold text-outline dark:text-gray-500 uppercase tracking-wider">End Date</p>
                                 <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent w-full text-xs font-bold text-on-surface dark:text-white outline-none" />
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Stats Card */}
            {stats && (
                <div className="px-5 pt-4 shrink-0 relative z-10 animate-slide-up">
                     <div className="relative overflow-hidden rounded-[32px] p-6 bg-gradient-to-br from-primary via-secondary to-tertiary text-white shadow-xl">
                         <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse-slow"></div>
                         
                         <div className="relative z-10 flex justify-between items-end">
                             <div>
                                 <p className="text-xs font-bold opacity-70 uppercase mb-1 flex items-center gap-1.5">
                                     <MdReceipt size={14} /> Total Spent
                                 </p>
                                 <h2 className="text-3xl font-black font-poppins tracking-tight">{formatCurrency(stats.total_amount)}</h2>
                                 <div className="flex items-center gap-2 mt-3">
                                     <div className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold border border-white/10">
                                         {stats.total_expenses} Vouchers
                                     </div>
                                     <div className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold border border-white/10 flex items-center gap-1">
                                         <MdTrendingUp size={12} /> +12%
                                     </div>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <p className="text-xs font-bold opacity-70 uppercase mb-1">Budget Left</p>
                                 <h3 className={`text-xl font-black font-poppins ${
                                     Number(stats.remaining_today) < 0 ? 'text-red-300' : 'text-green-300'
                                 }`}>
                                     {formatCurrency(stats.remaining_today)}
                                 </h3>
                                 <p className="text-[9px] opacity-50 mt-1">Daily: {formatCurrency(stats.daily_budget)}</p>
                             </div>
                         </div>
                     </div>
                </div>
            )}

            {/* Expense List */}
            <div className="flex-1 overflow-y-auto px-5 pb-28 pt-4 space-y-3 no-scrollbar relative z-10">
                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div></div>
                ) : !expenses.length ? (
                    <div className="flex flex-col items-center justify-center py-16 opacity-50">
                        <MdAccountBalanceWallet size={48} className="text-outline dark:text-gray-600 mb-3" />
                        <p className="text-sm font-bold text-outline dark:text-gray-400">No expenses recorded</p>
                    </div>
                ) : (
                    expenses.map((item, idx) => (
                        <div 
                            key={idx}
                            onClick={() => setSelectedExpense(item)} 
                            className="bg-surface dark:bg-gray-900 rounded-[24px] p-4 shadow-sm border border-outline-variant/10 dark:border-gray-800 active:scale-[0.98] transition-all hover:shadow-lg cursor-pointer relative overflow-hidden animate-slide-up"
                            style={{ animationDelay: `${idx * 30}ms` }}
                        >
                             {/* Status Strip */}
                             <div className={`absolute top-0 left-0 w-1 h-full rounded-l-[24px] ${
                                 item.status === 'approved' ? 'bg-green-500' : item.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                             }`}></div>
                             
                             <div className="flex justify-between items-center pl-3">
                                 <div className="flex items-center gap-3 flex-1 min-w-0">
                                     <div className="w-12 h-12 rounded-2xl bg-surface-variant/50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                         <span className="text-lg font-black text-primary">{new Date(item.expense_date).getDate()}</span>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <h4 className="text-sm font-bold text-on-surface dark:text-white truncate">{item.paid_to}</h4>
                                         <div className="flex items-center gap-1.5 mt-0.5">
                                             <p className="text-[11px] text-outline dark:text-gray-400 truncate max-w-[100px]">{item.expense_for}</p>
                                             <span className="w-1 h-1 rounded-full bg-outline/30 dark:bg-gray-600 shrink-0"></span>
                                             <p className="text-[10px] text-outline dark:text-gray-500 truncate">{item.expense_done_by}</p>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="text-right ml-4 shrink-0">
                                     <p className="text-base font-black text-on-surface dark:text-white">{formatCurrency(item.amount)}</p>
                                     <div className="flex items-center justify-end gap-1 mt-0.5">
                                          {item.status === 'pending' && <MdAccessTime size={10} className="text-amber-500" />}
                                          {item.status === 'approved' && <MdCheckCircle size={10} className="text-green-500" />}
                                          {item.status === 'rejected' && <MdWarning size={10} className="text-red-500" />}
                                          <span className={`text-[9px] font-bold uppercase ${
                                               item.status === 'approved' ? 'text-green-500' : item.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                                          }`}>{item.status}</span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    ))
                )}
            </div>

            {/* FAB */}
            <button 
                 onClick={() => setShowAddModal(true)}
                 className="fixed bottom-24 right-6 p-4 rounded-full bg-primary text-on-primary shadow-xl shadow-primary/40 hover:shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 animate-slide-up border-0 outline-none"
            >
                <MdAdd size={28} />
            </button>
            
            <AddExpenseModal 
                show={showAddModal} 
                onClose={() => setShowAddModal(false)}
                onSave={handleSaveExpense}
                loading={saving}
            />
            
            <ExpenseDetailsModal 
                expense={selectedExpense} 
                onClose={() => setSelectedExpense(null)} 
            />
        </div>
    );
};

export default ExpensesScreen;
