import { useState, useEffect } from 'react';
import {
  MdSearch,
  MdArrowBack,
  MdAdd,
  MdClose,
  MdAccountBalanceWallet,
  MdCreditCard,
  MdMonetizationOn,
  MdHistory,
  MdCheckCircle,
  MdReceipt,
  MdWarning,
  MdSmartphone
} from 'react-icons/md';
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
        status: statusFilter === 'all' ? '' : statusFilter === 'due' ? 'active' : statusFilter, 
        limit: '50'
      });

      const res = await fetch(`${baseUrl}/billing.php?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        let filtered = data.data;
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
    <div className="flex flex-col h-full bg-surface dark:bg-black font-sans transition-colors relative">
      
      {/* Primary Gradient Mesh */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/30 to-transparent pointer-events-none z-0 dark:from-primary/10" />

      {/* 1. Glass Header */}
      <div className="bg-transparent backdrop-blur-xl sticky top-0 z-20 pt-[max(env(safe-area-inset-top),32px)] transition-colors">
         <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-surface-variant/40 text-on-surface dark:text-white transition-colors">
                   <MdArrowBack size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight">Billing</h1>
                    <p className="text-xs font-medium text-outline/80 dark:text-gray-400">Payments & Dues</p>
                </div>
            </div>
            {/* Search */}
            <div className="relative group">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-gray-400 group-focus-within:text-primary pointer-events-none" size={20} />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..." 
                    className="w-32 focus:w-48 transition-all pl-9 pr-4 py-2 bg-surface-variant/40 dark:bg-gray-800 backdrop-blur-md rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/50 text-on-surface dark:text-gray-100 placeholder:text-outline/60 dark:placeholder:text-gray-500"
                />
            </div>
         </div>

         {/* 2. Filter Chips */}
         <div className="px-5 py-2 flex gap-2 overflow-x-auto no-scrollbar mask-gradient relative z-10 pb-4">
             {[
                 { id: 'all', label: 'All Records', icon: null },
                 { id: 'due', label: 'Pending Due', icon: <MdWarning size={16} /> },
                 { id: 'completed', label: 'Settled', icon: <MdCheckCircle size={16} /> }
             ].map((chip) => {
                 const isActive = statusFilter === chip.id;
                 return (
                     <button
                        key={chip.id}
                        onClick={() => setStatusFilter(chip.id as any)}
                        className={`
                            flex items-center gap-2 pl-4 pr-5 py-2 rounded-full border transition-all duration-300 shadow-sm whitespace-nowrap
                            ${isActive 
                               ? 'bg-secondary-container text-on-secondary-container border-secondary-container shadow-md scale-[1.02]' 
                               : 'bg-surface dark:bg-gray-800 border-outline-variant/40 dark:border-gray-800 text-on-surface-variant dark:text-gray-300 hover:bg-surface-variant/50'}
                        `}
                     >
                         {chip.icon && <span className={isActive ? 'opacity-100' : 'opacity-70'}>{chip.icon}</span>}
                         <span className="text-xs font-bold uppercase tracking-wide">{chip.label}</span>
                     </button>
                 )
             })}
         </div>
      </div>

      {/* 3. Main List */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-3 pt-2 no-scrollbar relative z-10">
         {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div></div>
         ) : patients.length > 0 ? (
             patients.map((p, index) => {
                 const hasDue = p.total_due > 0;
                 return (
                     <div 
                       key={p.patient_id}
                       onClick={() => handlePatientClick(p.patient_id)}
                       className="bg-surface dark:bg-gray-900 rounded-[24px] p-4 shadow-sm border border-outline-variant/10 dark:border-gray-800 relative overflow-hidden active:scale-[0.98] transition-all duration-300 animate-slide-up group hover:shadow-md cursor-pointer"
                       style={{ animationDelay: `${index * 50}ms` }}
                     >
                         {/* Status Stripe */}
                         <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 ${hasDue ? 'bg-error' : 'bg-primary'}`} />
                         
                         <div className="flex gap-4 pl-3">
                             {/* Avatar */}
                             <div className="relative shrink-0 pt-0.5">
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold uppercase overflow-hidden shadow-inner transition-colors ${hasDue ? 'bg-error/10 text-error dark:bg-red-900/30 dark:text-red-400' : 'bg-primary/10 text-primary dark:bg-green-900/30 dark:text-green-400'}`}>
                                     {p.patient_photo_path ? <img src={getImageUrl(p.patient_photo_path) || ''} alt="" className="w-full h-full object-cover" /> : p.patient_name[0]}
                                 </div>
                             </div>

                             {/* Info */}
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="pr-2">
                                         <h3 className="text-base font-bold text-on-surface dark:text-white truncate">{p.patient_name}</h3>
                                         <span className="text-[10px] bg-surface-variant/50 dark:bg-gray-800 text-outline dark:text-gray-300 px-1.5 py-0.5 rounded font-mono">#{p.patient_uid || p.patient_id}</span>
                                     </div>
                                     
                                     {/* Simple Status Badge */}
                                     {hasDue ? (
                                         <div className="flex items-center gap-1.5 px-3 py-1 bg-error/10 dark:bg-red-900/30 text-error dark:text-red-300 rounded-xl text-[10px] font-black uppercase tracking-wide shadow-sm">
                                             <MdWarning size={14} /> Due
                                         </div>
                                     ) : (
                                          <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 dark:bg-green-900/30 text-primary dark:text-green-300 rounded-xl text-[10px] font-black uppercase tracking-wide shadow-sm">
                                             <MdCheckCircle size={14} /> Paid
                                         </div>
                                     )}
                                 </div>

                                 {/* Stats Grid - Cleaner */}
                                 <div className="flex gap-4 border-t border-outline-variant/10 dark:border-gray-800 pt-3 mt-1">
                                     <div>
                                         <p className="text-[9px] font-bold text-outline dark:text-gray-500 uppercase tracking-wider mb-0.5">Paid</p>
                                         <p className="text-sm font-black text-on-surface dark:text-gray-200">{formatCurrency(p.total_paid)}</p>
                                     </div>
                                     {hasDue && (
                                         <div>
                                             <p className="text-[9px] font-bold text-error/80 dark:text-red-400 uppercase tracking-wider mb-0.5">Due</p>
                                             <p className="text-sm font-black text-error dark:text-red-400">{formatCurrency(p.total_due)}</p>
                                         </div>
                                     )}
                                     <div className="ml-auto">
                                          <MdAccountBalanceWallet className="text-outline/20 dark:text-gray-700 text-3xl" />
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 )
             })
         ) : (
             <div className="flex flex-col items-center justify-center py-24 opacity-60">
                <div className="w-20 h-20 bg-surface-variant/30 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <MdReceipt size={40} className="text-outline/50 dark:text-gray-600" />
                </div>
                <p className="text-outline font-medium dark:text-gray-500">No records found</p>
             </div>
         )}
      </div>

      {/* --- Detail Modal (Full Screen Sheet) --- */}
      {selectedPatientId && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setSelectedPatientId(null)} />
            
            {/* Modal */}
            <div className="pointer-events-auto bg-surface dark:bg-gray-900 w-full sm:max-w-md h-[90vh] sm:h-[85vh] shadow-2xl flex flex-col animate-slide-up rounded-t-[32px] sm:rounded-[32px] overflow-hidden relative border border-white/10">
               
               {/* Header */}
               <div className="bg-surface dark:bg-gray-900 p-6 flex items-center justify-between z-10 border-b border-outline-variant/10 dark:border-gray-700">
                  <div>
                      <h2 className="text-xl font-bold text-on-surface dark:text-white">Billing Details</h2>
                      <p className="text-xs text-outline dark:text-gray-400">Transaction History</p>
                  </div>
                  <button onClick={() => setSelectedPatientId(null)} className="p-2 rounded-full bg-surface-variant/50 hover:bg-surface-variant dark:bg-gray-800 text-on-surface dark:text-white"><MdClose size={20} /></button>
               </div>

               {/* Content */}
               <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
                  {detailLoading || !detailData ? (
                     <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div></div>
                  ) : (
                     <div className="space-y-6">
                        
                        {/* Hero Card */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-[28px] p-6 text-white shadow-xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                           
                           <div className="flex justify-between items-start relative z-10 mb-6">
                              <div>
                                 <h2 className="text-2xl font-black tracking-tight">{detailData.patient_name}</h2>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-mono">#{selectedPatientId}</span>
                                    <span className="text-gray-400 text-xs">{detailData.phone_number}</span>
                                 </div>
                              </div>
                              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                 <MdAccountBalanceWallet size={20} />
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-3 relative z-10">
                               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/5">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Due</p>
                                  <p className="text-2xl font-black text-error dark:text-red-400">₹{detailData.due_amount.toLocaleString()}</p>
                               </div>
                               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/5">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Paid So Far</p>
                                  <p className="text-2xl font-black text-primary dark:text-green-400">₹{detailData.total_paid.toLocaleString()}</p>
                               </div>
                           </div>
                        </div>

                        {/* Transactions List */}
                        <div>
                           <h3 className="text-xs font-bold text-outline dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <MdHistory size={16} /> Recent Activity
                           </h3>
                           
                           <div className="space-y-4 pl-2">
                              {detailData.payments.length > 0 ? (
                                 detailData.payments.map((tx) => (
                                    <div key={tx.payment_id} className="relative pl-6 border-l border-dashed border-outline-variant dark:border-gray-700">
                                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-surface dark:bg-gray-900 border-2 border-primary"></div>
                                        
                                        <div className="bg-surface dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-outline-variant/10 dark:border-gray-700 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-secondary-container dark:bg-gray-700 flex items-center justify-center text-on-secondary-container dark:text-white">
                                                    {tx.mode === 'cash' ? <MdMonetizationOn size={18} /> : 
                                                     tx.mode === 'upi' ? <MdSmartphone size={18} /> : <MdCreditCard size={18} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-on-surface dark:text-white text-sm">{tx.remarks || 'Payment Received'}</p>
                                                    <p className="text-[10px] text-outline dark:text-gray-400 font-medium mt-0.5 uppercase tracking-wide">{new Date(tx.payment_date).toLocaleDateString()} • {tx.mode}</p>
                                                </div>
                                            </div>
                                            <span className="font-black text-primary dark:text-green-400 text-sm">+₹{tx.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                 ))
                              ) : (
                                 <div className="p-8 text-center text-outline dark:text-gray-500 font-medium text-sm border border-dashed border-outline-variant/50 rounded-2xl">
                                    No transaction history
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Footer Action */}
               <div className="p-4 bg-surface dark:bg-gray-900 border-t border-outline-variant/10 dark:border-gray-800 absolute bottom-0 left-0 right-0">
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-primary/90"
                  >
                    <MdAdd size={24} /> Record New Payment
                  </button>
               </div>
            </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
           <div className="relative bg-surface dark:bg-gray-900 w-full sm:max-w-sm rounded-[32px] shadow-2xl p-6 animate-slide-up border border-white/10">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-xl font-bold text-on-surface dark:text-white">Record Payment</h3>
                    <p className="text-xs text-outline dark:text-gray-400 font-bold uppercase tracking-wide mt-1">Collecting from {detailData?.patient_name}</p>
                 </div>
                 <button onClick={() => setShowPaymentModal(false)} className="bg-surface-variant dark:bg-gray-800 p-2 rounded-full text-on-surface dark:text-white hover:bg-surface-variant/80"><MdClose size={20} /></button>
              </div>

              <div className="space-y-5">
                 <div className="bg-surface-variant/30 dark:bg-gray-800 rounded-2xl p-4 border border-outline-variant/10 dark:border-gray-700">
                    <label className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase tracking-wider block mb-2">Amount (₹)</label>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-outline/50">₹</span>
                        <input 
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0"
                        className="w-full text-3xl font-black bg-transparent outline-none text-on-surface dark:text-white placeholder-outline/30 dark:placeholder-gray-600"
                        autoFocus
                        />
                    </div>
                 </div>
                 
                 <div>
                    <label className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase tracking-wider block mb-3">Payment Mode</label>
                    <div className="grid grid-cols-4 gap-2">
                       {['cash', 'upi', 'card', 'other'].map(m => (
                          <button
                            key={m}
                            onClick={() => setPaymentMode(m)}
                            className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                                paymentMode === m 
                                  ? 'bg-primary/5 border-primary text-primary' 
                                  : 'bg-surface dark:bg-gray-800 border-outline-variant/20 dark:border-gray-700 text-outline dark:text-gray-400'
                            }`}
                          >
                            {m === 'cash' && <MdMonetizationOn size={18} />}
                            {m === 'upi' && <MdSmartphone size={18} />}
                            {m === 'card' && <MdCreditCard size={18} />}
                            {m === 'other' && <MdAccountBalanceWallet size={18} />}
                            <span className="text-[9px] font-bold uppercase">{m}</span>
                          </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase tracking-wider block mb-2">Remarks</label>
                    <div className="bg-surface-variant/30 dark:bg-gray-800 rounded-xl px-4 py-3 border border-outline-variant/10 dark:border-gray-700 focus-within:border-primary transition-colors">
                        <input 
                        value={paymentRemarks}
                        onChange={(e) => setPaymentRemarks(e.target.value)}
                        placeholder="Add optional note..."
                        className="w-full bg-transparent text-sm font-bold text-on-surface dark:text-white outline-none placeholder-outline/50 dark:placeholder-gray-500"
                        />
                    </div>
                 </div>

                 <button 
                    onClick={handleAddPayment}
                    disabled={processing || !paymentAmount}
                    className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-primary/90"
                 >
                    {processing ? 'Processing...' : 'Confirm Payment'}
                    {!processing && <MdCheckCircle size={20} />}
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default BillingScreen;
