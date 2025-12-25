import { useState, useEffect } from 'react';
import {
  Search,
  ArrowLeft,
  Plus,
  X,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  History as HistoryIcon,
  Receipt,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// Interfaces
interface BillingRecord {
  patient_id: number;
  patient_name: string;
  patient_uid: string | null;
  patient_photo_path: string | null;
  total_billed: number;
  total_paid: number;
  total_due: number;
  status: string;
}

interface PaymentTransaction {
  payment_id: number;
  payment_date: string;
  amount: number;
  mode: string;
  remarks: string;
}

interface BillingDetail {
  patient_id: number;
  patient_name: string;
  phone_number: string;
  assigned_doctor: string;
  total_amount: number;
  total_paid: number;
  due_amount: number;
  today_paid: number;
  payments: PaymentTransaction[];
}

export const BillingScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // List State
  const [patients, setPatients] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'completed'>('all');

  // Detail State
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<BillingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  // --- Fetch List ---
  const fetchList = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      const branchId = user?.branch_id || 1;
      const params = new URLSearchParams({
        branch_id: branchId.toString(),
        search: searchQuery,
        status: statusFilter === 'all' ? '' : statusFilter === 'due' ? 'active' : statusFilter, // Map 'due' to 'active' roughly or handle in backend
        limit: '50'
      });
      // Note: Backend might expect 'active', 'completed'. 
      // User likely wants to toggle between "People who owe money" (Due) and "Fully Paid".
      // Assuming 'active' implies running treatment (likely due), but proper due filter might need backend support.
      // For now, passing mapped status.

      const res = await fetch(`${baseUrl}/billing.php?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        let filtered = data.data;
        // Frontend filtering for Due to be precise if backend is generic
        if (statusFilter === 'due') {
            filtered = filtered.filter((p: BillingRecord) => p.total_due > 0);
        } else if (statusFilter === 'completed') {
            filtered = filtered.filter((p: BillingRecord) => p.total_due <= 0);
        }
        setPatients(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchList, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  // --- Fetch Detail ---
  const fetchDetail = async (id: number) => {
    setDetailLoading(true);
    setDetailData(null);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      const branchId = user?.branch_id || 1;
      const employeeId = user?.employee_id || '';
      const res = await fetch(`${baseUrl}/billing_details.php?patient_id=${id}&branch_id=${branchId}&employee_id=${employeeId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setDetailData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePatientClick = (id: number) => {
    setSelectedPatientId(id);
    fetchDetail(id);
  };

  // --- Submit Payment ---
  const handleAddPayment = async () => {
    if (!detailData || !paymentAmount) return;
    setProcessing(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      const payload = {
        patient_id: detailData.patient_id,
        amount: parseFloat(paymentAmount),
        mode: paymentMode,
        remarks: paymentRemarks,
        employee_id: user?.employee_id || 1
      };

      const res = await fetch(`${baseUrl}/add_payment.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (result.status === 'success') {
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentRemarks('');
        // Refresh details & list
        fetchDetail(detailData.patient_id);
        fetchList();
      } else {
        alert(result.message || 'Payment failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  // Helper
  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    return `https://prospine.in/proadmin/admin/${path.replace(/^\//, '')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900 transition-colors pb-20 relative">
      
      {/* 1. Glassy Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-sm px-4 py-3 pt-[var(--safe-area-inset-top,32px)] mt-0 sticky top-0 z-20 flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-transform">
            <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
            </button>
            <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Billing</h1>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Payments & Dues</p>
            </div>
        </div>
        <div className="p-2 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/20 text-white">
            <Receipt size={20} />
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="px-4 py-4 space-y-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
         <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors">
                 <Search size={18} />
             </div>
             <input 
               type="text" 
               placeholder="Search patient by name or UID..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 rounded-2xl text-sm border-2 border-transparent focus:border-teal-500/30 shadow-sm outline-none transition-all dark:text-white font-medium"
             />
         </div>
         
         <div className="flex gap-2">
            {[
                { id: 'all', label: 'All Records' },
                { id: 'due', label: 'Payment Due' },
                { id: 'completed', label: 'Fully Paid' }
            ].map(f => (
               <button
                 key={f.id}
                 onClick={() => setStatusFilter(f.id as any)}
                 className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                   statusFilter === f.id
                     ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white shadow-lg shadow-gray-200 dark:shadow-none scale-105'
                     : 'bg-white border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                 }`}
               >
                 {f.label}
               </button>
            ))}
         </div>
      </div>

      {/* 3. Patient List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {loading ? (
           <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent"></div></div>
        ) : patients.length > 0 ? (
           <div className="grid gap-3">
           {patients.map(p => {
             const hasDue = p.total_due > 0;
             return (
               <div 
                 key={p.patient_id}
                 onClick={() => handlePatientClick(p.patient_id)}
                 className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group
                    ${hasDue 
                        ? 'border-red-100 dark:border-red-900/30' 
                        : 'border-gray-100 dark:border-gray-700'
                    }
                 `}
               >
                  {/* Status Indicator Stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors
                      ${hasDue ? 'bg-red-500' : 'bg-green-500'}
                  `}></div>

                  <div className="flex items-start gap-4 pl-3">
                     {/* Avatar */}
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold uppercase shrink-0 transition-colors
                         ${hasDue ? 'bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/10 dark:text-green-400'}
                     `}>
                        {p.patient_photo_path ? (
                            <img src={getImageUrl(p.patient_photo_path) || ''} alt="" className="w-full h-full object-cover rounded-2xl" />
                        ) : p.patient_name.charAt(0)}
                     </div>

                     <div className="flex-1 min-w-0">
                         {/* Header Info */}
                         <div className="flex justify-between items-start mb-2">
                             <div>
                                 <h3 className="font-bold text-gray-900 dark:text-white truncate pr-2">{p.patient_name}</h3>
                                 <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">UID: {p.patient_uid || p.patient_id}</p>
                             </div>
                             {hasDue ? (
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-red-600 bg-red-50 px-2 py-1 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                                    Due
                                </span>
                             ) : (
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded-lg dark:bg-green-900/20 dark:text-green-400">
                                    Paid
                                </span>
                             )}
                         </div>

                         {/* Stats Grid */}
                         <div className="grid grid-cols-3 gap-1 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-2.5">
                            <div className="text-center">
                                <p className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Billed</p>
                                <p className="text-xs font-black text-gray-900 dark:text-white">{formatCurrency(p.total_billed)}</p>
                            </div>
                            <div className="text-center border-l border-gray-200 dark:border-gray-600">
                                <p className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Paid</p>
                                <p className="text-xs font-black text-green-600 dark:text-green-400">{formatCurrency(p.total_paid)}</p>
                            </div>
                            <div className="text-center border-l border-gray-200 dark:border-gray-600">
                                <p className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Due</p>
                                <p className={`text-xs font-black ${p.total_due > 0 ? 'text-red-500' : 'text-gray-400'}`}>{formatCurrency(p.total_due)}</p>
                            </div>
                         </div>
                     </div>
                  </div>
               </div>
             );
           })}
           </div>
        ) : (
           <div className="flex flex-col items-center justify-center py-20 opacity-60">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                 <Wallet size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No billing records found</p>
           </div>
        )}
      </div>

      {/* DETAIL DRAWER */}
      {selectedPatientId && (
         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-end sm:justify-center pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setSelectedPatientId(null)}></div>
            
            {/* Side Drawer Panel */}
            <div className="pointer-events-auto bg-white dark:bg-gray-900 w-full sm:w-[500px] h-[90vh] sm:h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 rounded-t-3xl sm:rounded-l-3xl overflow-hidden relative">
               
               {/* Drawer Header */}
               <div className="bg-white dark:bg-gray-900 p-4 flex items-center gap-4 z-10 sticky top-0 border-b border-gray-100 dark:border-gray-800">
                  <button onClick={() => setSelectedPatientId(null)} className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-gray-600"><ArrowLeft size={20} /></button>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">Billing Details</h2>
               </div>

               {/* Drawer Content */}
               <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-32">
                  {detailLoading || !detailData ? (
                     <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent"></div></div>
                  ) : (
                     <div className="space-y-6">
                        
                        {/* Hero Card */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-teal-500/10 transition-colors"></div>
                           
                           <div className="flex justify-between items-start relative z-10">
                              <div>
                                 <h2 className="text-2xl font-black tracking-tight">{detailData.patient_name}</h2>
                                 <p className="text-gray-400 text-sm font-medium mt-1">#{selectedPatientId} • {detailData.phone_number}</p>
                              </div>
                              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                 <Wallet size={20} />
                              </div>
                           </div>

                           <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
                               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Due</p>
                                  <p className="text-2xl font-black text-red-400">₹{detailData.due_amount.toLocaleString()}</p>
                               </div>
                               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Paid So Far</p>
                                  <p className="text-2xl font-black text-green-400">₹{detailData.total_paid.toLocaleString()}</p>
                               </div>
                           </div>
                        </div>

                        {/* Recent Transactions */}
                        <div>
                           <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                              <HistoryIcon size={16} /> Transaction History
                           </h3>
                           
                           <div className="space-y-3 relative before:absolute before:left-5 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800">
                              {detailData.payments.length > 0 ? (
                                 detailData.payments.map((tx) => (
                                    <div key={tx.payment_id} className="relative pl-10">
                                        {/* Timeline Dot */}
                                        <div className="absolute left-3 top-4 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-2 border-teal-500 z-10"></div>
                                        
                                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                                    {tx.mode === 'cash' ? <Banknote size={16} /> : 
                                                     tx.mode === 'upi' ? <Smartphone size={16} /> : <CreditCard size={16} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{tx.remarks || 'Payment Received'}</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{new Date(tx.payment_date).toLocaleDateString()} • <span className="uppercase text-[10px] font-bold">{tx.mode}</span></p>
                                                </div>
                                            </div>
                                            <span className="font-black text-green-600 text-sm">+₹{tx.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                 ))
                              ) : (
                                 <div className="ml-10 py-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                                    <p className="text-gray-400 text-xs font-bold uppercase">No transactions found</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Footer Action */}
               <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 absolute bottom-0 left-0 right-0">
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 active:scale-95 transition-all text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 flex items-center justify-center gap-2"
                  >
                    <Plus size={20} strokeWidth={3} /> Record New Payment
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
           <div className="relative bg-white dark:bg-gray-800 w-full sm:max-w-sm rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-20 sm:zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Record Payment</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mt-1">Collecting from {detailData?.patient_name}</p>
                 </div>
                 <button onClick={() => setShowPaymentModal(false)} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full"><X size={20} className="text-gray-500" /></button>
              </div>

              <div className="space-y-5">
                 <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Amount (₹)</label>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-gray-400">₹</span>
                        <input 
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0"
                        className="w-full text-3xl font-black bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-200"
                        autoFocus
                        />
                    </div>
                 </div>
                 
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Payment Mode</label>
                    <div className="grid grid-cols-4 gap-2">
                       {['cash', 'upi', 'card', 'other'].map(m => (
                          <button
                            key={m}
                            onClick={() => setPaymentMode(m)}
                            className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                               paymentMode === m 
                                 ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' 
                                 : 'bg-white border-gray-100 text-gray-400 dark:bg-gray-800 dark:border-gray-700'
                            }`}
                          >
                            {m === 'cash' && <Banknote size={18} />}
                            {m === 'upi' && <Smartphone size={18} />}
                            {m === 'card' && <CreditCard size={18} />}
                            {m === 'other' && <Wallet size={18} />}
                            <span className="text-[9px] font-bold uppercase">{m}</span>
                          </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Remarks</label>
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700 focus-within:border-teal-500 transition-colors">
                        <input 
                        value={paymentRemarks}
                        onChange={(e) => setPaymentRemarks(e.target.value)}
                        placeholder="Add optional note..."
                        className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none placeholder-gray-400"
                        />
                    </div>
                 </div>

                 <button 
                    onClick={handleAddPayment}
                    disabled={processing || !paymentAmount}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                    {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <CheckCircle size={20} />}
                    {processing ? 'Processing...' : 'Confirm Payment'}
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default BillingScreen;
