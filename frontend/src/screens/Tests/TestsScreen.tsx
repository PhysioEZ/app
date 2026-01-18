import { useState, useEffect } from 'react';
import { 
  MdSearch, MdArrowBack, MdScience, MdCalendarToday, 
  MdPerson, MdPhone, MdAdd, MdClose, MdWarning,
  MdCheckCircle, MdCancel, MdAccessTime, MdBiotech
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// Types
interface TestHeader {
  test_id: number;
  test_uid: string;
  patient_name: string;
  age: number;
  gender: string;
  phone_number: string;
  alternate_phone_no: string | null;
  dob: string | null;
  parents: string | null;
  relation: string | null;
  test_name: string; 
  total_amount: number;
  advance_amount: number;
  due_amount: number;
  discount: number;
  payment_status: string;
  test_status: string;
  created_at: string;
  items?: TestItem[]; 
}

interface TestItem {
  item_id: number;
  test_name: string;
  limb: string | null;
  assigned_test_date: string;
  test_done_by: string;
  referred_by: string | null;
  total_amount: number;
  discount: number;
  advance_amount: number;
  due_amount: number;
  payment_method: string;
  test_status: string;
  payment_status: string;
}



export const TestsScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // List State
  const [tests, setTests] = useState<TestHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail State
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<TestHeader | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // --- Helpers ---
  const fetchTests = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      const branchId = user?.branch_id || 1;
      const params = new URLSearchParams({
        branch_id: branchId.toString(),
        search,
        test_status: statusFilter === 'all' ? '' : statusFilter,
        limit: '50'
      });
      
      const res = await fetch(`${baseUrl}/tests.php?${params.toString()}`);
      const json = await res.json();
      if (json.status === 'success') {
        setTests(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchTests, 500);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const fetchDetail = async (id: number) => {
    setDetailLoading(true);
    setDetailData(null);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      const branchId = user?.branch_id || 1;
      const employeeId = user?.employee_id || '';
      const res = await fetch(`${baseUrl}/test_details.php?id=${id}&branch_id=${branchId}&employee_id=${employeeId}`);
      const json = await res.json();
      if (json.status === 'success') {
        setDetailData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCardClick = (id: number) => {
    setSelectedTestId(id);
    fetchDetail(id);
  };

  const formatCurrency = (n: number | undefined | null) => {
      if (n === undefined || n === null || isNaN(n)) return '₹0';
      return `₹${Number(n).toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
          case 'completed': return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400';
          case 'pending': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400';
          case 'cancelled': return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400';
          default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400';
      }
  };

  const getStatusIcon = (status: string) => {
      switch (status?.toLowerCase()) {
          case 'completed': return <MdCheckCircle size={14} />;
          case 'pending': return <MdAccessTime size={14} />;
          case 'cancelled': return <MdCancel size={14} />;
          default: return <MdWarning size={14} />;
      }
  };

  // --- Render ---
  return (
    <div className="flex flex-col h-full bg-surface dark:bg-black font-sans transition-colors relative">
      
      {/* Primary Gradient Mesh */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/30 to-transparent pointer-events-none z-0 dark:from-primary/10" />

      {/* 1. Header (Transparent + Gradient) */}
      <div className="bg-transparent backdrop-blur-xl sticky top-0 z-20 pt-[max(env(safe-area-inset-top),32px)] transition-colors">
         <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-surface-variant/40 text-on-surface dark:text-white transition-colors">
                   <MdArrowBack size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight">Lab Tests</h1>
                    <p className="text-xs font-medium text-outline/80 dark:text-gray-400">Diagnostics</p>
                </div>
            </div>
            {/* Search */}
            <div className="relative group">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-gray-400 group-focus-within:text-primary pointer-events-none" size={20} />
                <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..." 
                    className="w-32 focus:w-48 transition-all pl-9 pr-4 py-2 bg-surface-variant/40 dark:bg-gray-800 backdrop-blur-md rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/50 text-on-surface dark:text-gray-100 placeholder:text-outline/60 dark:placeholder:text-gray-500"
                />
            </div>
         </div>

         {/* Filter Chips */}
         <div className="px-5 py-2 flex gap-2 overflow-x-auto no-scrollbar mask-gradient relative z-10 pb-4">
            {[ 
                { id: 'all', label: 'All Tests' }, 
                { id: 'pending', label: 'Pending' }, 
                { id: 'completed', label: 'Completed' }, 
                { id: 'cancelled', label: 'Cancelled' } 
            ].map((chip) => {
                 const isActive = statusFilter === chip.id;
                 return (
                     <button
                        key={chip.id}
                        onClick={() => setStatusFilter(chip.id)}
                        className={`
                            flex items-center gap-2 pl-4 pr-5 py-2 rounded-full border transition-all duration-300 shadow-sm whitespace-nowrap
                            ${isActive 
                               ? 'bg-secondary-container text-on-secondary-container border-secondary-container shadow-md scale-[1.02]' 
                               : 'bg-surface dark:bg-gray-800 border-outline-variant/40 dark:border-gray-800 text-on-surface-variant dark:text-gray-300 hover:bg-surface-variant/50'}
                        `}
                     >
                         <span className="text-xs font-bold uppercase tracking-wide">{chip.label}</span>
                     </button>
                 )
             })}
         </div>
      </div>

      {/* 2. Main List */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-3 pt-2 no-scrollbar relative z-10">
         {/* Stats Cards (Optional row if needed, but filters act as stats mostly. Keeping it hidden or minimal unless requested) */}
         
         {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div></div>
         ) : tests.length > 0 ? (
             tests.map((t, index) => (
                 <div 
                   key={t.test_id}
                   onClick={() => handleCardClick(t.test_id)}
                   className="bg-surface dark:bg-gray-900 rounded-[24px] p-4 shadow-sm border border-outline-variant/10 dark:border-gray-800 relative overflow-hidden active:scale-[0.98] transition-all duration-300 animate-slide-up group hover:shadow-md cursor-pointer"
                   style={{ animationDelay: `${index * 50}ms` }}
                 >
                     {/* Status Stripe */}
                     <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 ${t.test_status === 'pending' ? 'bg-amber-500' : t.test_status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />
                     
                     <div className="flex gap-4 pl-3">
                         {/* Icon Box */}
                         <div className="relative shrink-0 pt-0.5">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-colors ${t.test_status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-primary/10 text-primary dark:bg-gray-800 dark:text-gray-400'}`}>
                                 <MdScience />
                             </div>
                         </div>

                         {/* Info */}
                         <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start mb-2">
                                 <div className="pr-2">
                                     <h3 className="text-base font-bold text-on-surface dark:text-white truncate">{t.patient_name}</h3>
                                     <p className="text-[10px] font-bold text-primary dark:text-primary-container uppercase tracking-wide truncate">{t.test_name || 'General Lab Test'}</p>
                                 </div>
                                 
                                 <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide shadow-sm ${getStatusColor(t.test_status)}`}>
                                     {getStatusIcon(t.test_status)} {t.test_status}
                                 </div>
                             </div>

                             {/* Stats Grid */}
                             <div className="flex items-center gap-4 border-t border-outline-variant/10 dark:border-gray-800 pt-3 mt-1">
                                 <div>
                                     <p className="text-[9px] font-bold text-outline dark:text-gray-500 uppercase tracking-wider mb-0.5">Total</p>
                                     <p className="text-xs font-black text-on-surface dark:text-gray-200">{formatCurrency(t.total_amount)}</p>
                                 </div>
                                 <div>
                                     <p className="text-[9px] font-bold text-outline dark:text-gray-500 uppercase tracking-wider mb-0.5">Paid</p>
                                     <p className="text-xs font-black text-green-600 dark:text-green-400">{formatCurrency(t.advance_amount)}</p>
                                 </div>
                                 {t.due_amount > 0 && (
                                     <div>
                                         <p className="text-[9px] font-bold text-error/80 dark:text-red-400 uppercase tracking-wider mb-0.5">Due</p>
                                         <p className="text-xs font-black text-error dark:text-red-400">{formatCurrency(t.due_amount)}</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                 </div>
             ))
         ) : (
             <div className="flex flex-col items-center justify-center py-24 opacity-60">
                <div className="w-20 h-20 bg-surface-variant/30 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <MdBiotech size={40} className="text-outline/50 dark:text-gray-600" />
                </div>
                <p className="text-outline font-medium dark:text-gray-500">No tests found</p>
             </div>
         )}
      </div>

      {/* FAB */}
      <button 
        onClick={() => navigate('/tests/new')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-primary text-on-primary rounded-[20px] shadow-xl shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform z-30 hover:bg-primary/90"
      >
        <MdAdd size={28} />
      </button>

      {/* --- Detail Modal (Full Screen Sheet) --- */}
      {selectedTestId && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setSelectedTestId(null)} />
            
            {/* Modal */}
            <div className="pointer-events-auto bg-surface dark:bg-gray-900 w-full sm:max-w-md h-[90vh] sm:h-[85vh] shadow-2xl flex flex-col animate-slide-up rounded-t-[32px] sm:rounded-[32px] overflow-hidden relative border border-white/10">
               
               {/* Header */}
               <div className="bg-surface dark:bg-gray-900 p-6 flex items-center justify-between z-10 border-b border-outline-variant/10 dark:border-gray-700">
                  <div>
                      <h2 className="text-xl font-bold text-on-surface dark:text-white">Test Details</h2>
                      <p className="text-xs text-outline dark:text-gray-400 flex items-center gap-1">
                          #{detailData?.test_uid || detailData?.test_id} • {detailData?.created_at ? new Date(detailData.created_at).toLocaleDateString('en-IN') : '...'}
                      </p>
                  </div>
                  <button onClick={() => setSelectedTestId(null)} className="p-2 rounded-full bg-surface-variant/50 hover:bg-surface-variant dark:bg-gray-800 text-on-surface dark:text-white"><MdClose size={20} /></button>
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
                                 <div className="flex items-center gap-2 mt-1 opacity-80">
                                    <MdPhone size={12} /> <span className="text-xs">{detailData.phone_number}</span>
                                 </div>
                                 {detailData.alternate_phone_no && (
                                    <div className="flex items-center gap-2 mt-0.5 opacity-70">
                                       <MdPhone size={10} /> <span className="text-[10px]">Alt: {detailData.alternate_phone_no}</span>
                                    </div>
                                 )}
                              </div>
                              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                 <MdScience size={20} />
                              </div>
                           </div>

                           <div className="grid grid-cols-3 gap-2 relative z-10 text-center">
                               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/5">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total</p>
                                  <p className="text-lg font-black text-white">{formatCurrency(detailData.total_amount)}</p>
                               </div>
                               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/5">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Paid</p>
                                  <p className="text-lg font-black text-green-400">{formatCurrency(detailData.advance_amount)}</p>
                               </div>
                               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/5">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due</p>
                                  <p className="text-lg font-black text-red-400">{formatCurrency(detailData.due_amount)}</p>
                               </div>
                           </div>
                        </div>

                        {/* Patient Info Card */}
                        <div className="bg-surface dark:bg-gray-800 rounded-[24px] p-5 shadow-sm border border-outline-variant/10 dark:border-gray-700">
                           <h3 className="text-xs font-bold text-outline dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <MdPerson size={16} /> Patient Information
                           </h3>
                           <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                 <p className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase mb-1">Age</p>
                                 <p className="text-sm font-bold text-on-surface dark:text-white">{detailData.age || 'N/A'} years</p>
                              </div>
                              <div>
                                 <p className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase mb-1">Gender</p>
                                 <p className="text-sm font-bold text-on-surface dark:text-white capitalize">{detailData.gender || 'N/A'}</p>
                              </div>
                              {detailData.dob && (
                                 <div className="col-span-2">
                                    <p className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase mb-1">Date of Birth</p>
                                    <p className="text-sm font-bold text-on-surface dark:text-white">{new Date(detailData.dob).toLocaleDateString('en-IN')}</p>
                                 </div>
                              )}
                              {detailData.parents && (
                                 <div className="col-span-2">
                                    <p className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase mb-1">Parents/Guardian</p>
                                    <p className="text-sm font-bold text-on-surface dark:text-white">{detailData.parents} {detailData.relation && `(${detailData.relation})`}</p>
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* Status Toggles */}
                        <div className="bg-surface dark:bg-gray-800 rounded-[24px] p-5 shadow-sm border border-outline-variant/10 dark:border-gray-700">
                           <h3 className="text-xs font-bold text-outline dark:text-gray-400 uppercase tracking-wider mb-4">Status Management</h3>
                           
                           {/* Test Status */}
                           <div className="mb-4">
                              <p className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase mb-2">Test Status</p>
                              <div className="flex gap-2">
                                 {['pending', 'completed', 'cancelled'].map((status) => (
                                    <button
                                       key={status}
                                       onClick={async () => {
                                          if (detailData.test_status === status) return;
                                          try {
                                             const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
                                             const res = await fetch(`${baseUrl}/update_test_status.php`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                   test_id: selectedTestId,
                                                   branch_id: user?.branch_id || 1,
                                                   employee_id: user?.employee_id || '',
                                                   update_type: 'test_status',
                                                   new_value: status
                                                })
                                             });
                                             const json = await res.json();
                                             if (json.status === 'success') {
                                                setDetailData({...detailData, test_status: status});
                                                fetchTests(); // Refresh list
                                             }
                                          } catch (err) {
                                             console.error(err);
                                          }
                                       }}
                                       className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                                          detailData.test_status === status 
                                             ? status === 'completed' ? 'bg-green-500 text-white' :
                                               status === 'cancelled' ? 'bg-red-500 text-white' :
                                               'bg-amber-500 text-white'
                                             : 'bg-surface-variant/50 dark:bg-gray-700 text-outline dark:text-gray-400 hover:bg-surface-variant'
                                       }`}
                                    >
                                       {status}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           {/* Payment Status */}
                           <div>
                              <p className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase mb-2">Payment Status</p>
                              <div className="flex gap-2">
                                 {['pending', 'partial', 'paid'].map((status) => (
                                    <button
                                       key={status}
                                       onClick={async () => {
                                          if (detailData.payment_status === status) return;
                                          try {
                                             const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
                                             const res = await fetch(`${baseUrl}/update_test_status.php`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                   test_id: selectedTestId,
                                                   branch_id: user?.branch_id || 1,
                                                   employee_id: user?.employee_id || '',
                                                   update_type: 'payment_status',
                                                   new_value: status
                                                })
                                             });
                                             const json = await res.json();
                                             if (json.status === 'success') {
                                                setDetailData({...detailData, payment_status: status});
                                                fetchTests(); // Refresh list
                                             }
                                          } catch (err) {
                                             console.error(err);
                                          }
                                       }}
                                       className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                                          detailData.payment_status === status 
                                             ? status === 'paid' ? 'bg-green-500 text-white' :
                                               status === 'partial' ? 'bg-amber-500 text-white' :
                                               'bg-red-500 text-white'
                                             : 'bg-surface-variant/50 dark:bg-gray-700 text-outline dark:text-gray-400 hover:bg-surface-variant'
                                       }`}
                                    >
                                       {status}
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>

                        {/* Test Items */}
                        <div>
                           <h3 className="text-xs font-bold text-outline dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <MdBiotech size={16} /> Test Items ({detailData.items?.length || 0})
                           </h3>
                           
                           <div className="space-y-3">
                               {detailData.items?.map((item) => (
                                   <div key={item.item_id} className="bg-surface dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-outline-variant/10 dark:border-gray-700 relative overflow-hidden group">
                                       <div className="flex justify-between items-start mb-3 border-b border-outline-variant/10 dark:border-gray-700 pb-2">
                                           <h4 className="font-bold text-on-surface dark:text-white flex-1 text-sm">{item.test_name} {item.limb && <span className="text-xs text-outline">({item.limb})</span>}</h4>
                                           <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 ${getStatusColor(item.test_status)}`}>
                                               {getStatusIcon(item.test_status)} {item.test_status}
                                           </span>
                                       </div>
                                       <div className="grid grid-cols-2 gap-y-2 text-xs text-outline dark:text-gray-500 mb-3">
                                           <div className="flex items-center gap-1.5"><MdCalendarToday size={12}/> {item.assigned_test_date}</div>
                                           <div className="flex items-center gap-1.5"><MdPerson size={12}/> {item.test_done_by}</div>
                                           {item.referred_by && (
                                              <div className="col-span-2 flex items-center gap-1.5 text-[11px]">
                                                 <MdPerson size={12}/> Referred by: <span className="font-bold">{item.referred_by}</span>
                                              </div>
                                           )}
                                           {item.payment_method && (
                                              <div className="col-span-2 flex items-center gap-1.5 text-[11px]">
                                                 Payment: <span className="font-bold uppercase">{item.payment_method}</span>
                                              </div>
                                           )}
                                       </div>
                                       <div className="flex justify-between items-center pt-2 border-t border-outline-variant/10 dark:border-gray-700">
                                          <div className="flex gap-3 text-xs">
                                             <div>
                                                <p className="text-[9px] text-outline dark:text-gray-500 uppercase">Amount</p>
                                                <p className="font-bold text-on-surface dark:text-white">{formatCurrency(item.total_amount)}</p>
                                             </div>
                                             {item.discount > 0 && (
                                                <div>
                                                   <p className="text-[9px] text-outline dark:text-gray-500 uppercase">Discount</p>
                                                   <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(item.discount)}</p>
                                                </div>
                                             )}
                                          </div>
                                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${getStatusColor(item.payment_status)}`}>
                                             {item.payment_status}
                                          </span>
                                       </div>
                                   </div>
                               ))}
                           </div>
                        </div>

                     </div>
                  )}
               </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TestsScreen;
