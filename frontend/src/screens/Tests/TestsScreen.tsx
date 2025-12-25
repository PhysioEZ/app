import { useState, useEffect } from 'react';
import { 
  Search, ArrowLeft, FlaskConical, Calendar, DollarSign, 
  User, Phone, Users, Microscope, Filter, Plus, XCircle
} from 'lucide-react';
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

interface TestStats {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
}

export const TestsScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // List State
  const [tests, setTests] = useState<TestHeader[]>([]);
  const [stats, setStats] = useState<TestStats | null>(null);
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
        if (json.stats) setStats(json.stats);
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
          case 'completed': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400';
          case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';
          case 'cancelled': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
          default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400';
      }
  };

  // --- Render ---
  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900 transition-colors pb-20 relative">
      
      {/* 1. Header Area with Glassmorphism */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-sm sticky top-0 z-20 pt-[var(--safe-area-inset-top,32px)] mt-0 border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-3 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')}
                className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors active:scale-95"
              >
                <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
              </button>
              <div>
                  <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Lab Tests</h1>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Diagnostics</p>
              </div>
           </div>
           <button className="p-2 bg-gradient-to-tr from-violet-500 to-indigo-500 rounded-xl shadow-lg shadow-violet-500/20 text-white active:scale-95 transition-transform">
                <Filter size={20} />
           </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 pb-4 space-y-3">
           <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors">
                <Search size={18} />
             </div>
             <input 
               type="text" 
               placeholder="Search by patient, test ID..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 rounded-2xl text-sm border-2 border-transparent focus:border-violet-500/30 shadow-sm outline-none transition-all dark:text-white font-medium"
             />
           </div>
           
           <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar mask-gradient">
              {[ { id: 'all', label: 'All Tests' }, { id: 'pending', label: 'Pending' }, { id: 'completed', label: 'Completed' }, { id: 'cancelled', label: 'Cancelled' } ].map(s => (
                 <button 
                   key={s.id}
                   onClick={() => setStatusFilter(s.id)}
                   className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                     statusFilter === s.id 
                       ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20'
                       : 'bg-white border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                   }`}
                 >
                   {s.label}
                 </button>
              ))}
           </div>
        </div>
      </div>

      {/* 2. Main List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-32 no-scrollbar">
         {/* Stats Card */}
         {stats && (
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-violet-900/10 relative overflow-hidden mb-4 group">
                 <div className="grid grid-cols-4 gap-2 text-center relative z-10">
                     <div className="bg-white/10 rounded-2xl p-2"><p className="text-xl font-black">{stats.total}</p><p className="text-[9px] uppercase">Total</p></div>
                     <div className="bg-white/10 rounded-2xl p-2"><p className="text-xl font-black text-amber-300">{stats.pending}</p><p className="text-[9px] uppercase">Pending</p></div>
                     <div className="bg-white/10 rounded-2xl p-2"><p className="text-xl font-black text-green-300">{stats.completed}</p><p className="text-[9px] uppercase">Done</p></div>
                     <div className="bg-white/10 rounded-2xl p-2 opacity-60"><p className="text-xl font-black">{stats.cancelled}</p><p className="text-[9px] uppercase">Cancel</p></div>
                 </div>
            </div>
         )}

         {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent"></div></div>
         ) : tests.length > 0 ? (
             <div className="grid gap-4">
                 {tests.map(t => (
                    <div key={t.test_id} onClick={() => handleCardClick(t.test_id)} className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden">
                        <div className={`absolute top-0 right-0 px-4 py-1.5 text-[10px] font-black uppercase rounded-bl-2xl ${getStatusColor(t.test_status)}`}>{t.test_status}</div>
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0"><Microscope size={24} /></div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{t.patient_name}</h3>
                                <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">{t.test_name || 'General Test'}</p>
                                <p className="text-[10px] text-gray-500 mt-1">Visit: {new Date(t.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
                            <div className="text-center"><p className="text-[9px] text-gray-400 font-bold uppercase">Total</p><p className="font-black text-gray-900 dark:text-white">{formatCurrency(t.total_amount)}</p></div>
                            <div className="text-center border-l"><p className="text-[9px] text-gray-400 font-bold uppercase">Paid</p><p className="font-black text-green-600">{formatCurrency(t.advance_amount)}</p></div>
                            <div className="text-center border-l"><p className="text-[9px] text-gray-400 font-bold uppercase">Due</p><p className={`font-black ${t.due_amount > 0 ? 'text-red-500' : 'text-gray-400'}`}>{formatCurrency(t.due_amount)}</p></div>
                        </div>
                    </div>
                 ))}
             </div>
         ) : <div className="text-center py-20 text-gray-400">No tests found</div>}
      </div>

      {/* FAB - Links to New Page */}
      <button 
        onClick={() => navigate('/tests/new')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-violet-600 rounded-full shadow-lg shadow-violet-600/30 text-white flex items-center justify-center active:scale-95 transition-transform z-30"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Detail Drawer */}
      {selectedTestId && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-end sm:justify-center pointer-events-none">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setSelectedTestId(null)}></div>
           <div className="pointer-events-auto bg-white dark:bg-gray-900 w-full sm:w-[500px] h-[90vh] sm:h-[85vh] shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 sm:zoom-in-95 duration-300 rounded-t-3xl sm:rounded-3xl overflow-hidden relative">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10 flex justify-between items-start">
                  <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">Test Details</h2>
                      <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide mt-1">
                          #{detailData?.test_uid || detailData?.test_id} • {detailData?.created_at ? new Date(detailData.created_at).toLocaleDateString() : '...'}
                      </p>
                  </div>
                  <button onClick={() => setSelectedTestId(null)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100"><XCircle size={24} className="text-gray-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                 {detailLoading || !detailData ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent"></div></div>
                 ) : (
                    <>
                       <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-800">
                           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <User size={14} /> Patient Info
                           </h3>
                           <div className="grid grid-cols-2 gap-2">
                               <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"><div className="mt-1 text-violet-500 bg-violet-50 dark:bg-violet-900/20 p-1.5 rounded-md"><User size={14} /></div><div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Name</p><p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight break-words">{detailData.patient_name || '-'}</p></div></div>
                               <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"><div className="mt-1 text-violet-500 bg-violet-50 dark:bg-violet-900/20 p-1.5 rounded-md"><Phone size={14} /></div><div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Contact</p><p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight break-words">{detailData.phone_number || '-'}</p></div></div>
                               <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"><div className="mt-1 text-violet-500 bg-violet-50 dark:bg-violet-900/20 p-1.5 rounded-md"><Users size={14} /></div><div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Age/Sex</p><p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight break-words">{`${detailData.age} Y / ${detailData.gender}`}</p></div></div>
                           </div>
                       </div>

                       <div className="bg-gradient-to-tr from-violet-700 to-indigo-600 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
                           <div className="flex items-center gap-2 mb-4 opacity-90">
                              <DollarSign size={18} />
                              <span className="font-bold text-sm uppercase tracking-widest">Financials</span>
                           </div>
                           <div className="grid grid-cols-3 gap-4 text-center relative z-10">
                               <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                                   <p className="text-[9px] uppercase font-bold opacity-70 mb-1">Total</p>
                                   <p className="text-lg font-black">{formatCurrency(detailData.total_amount)}</p>
                               </div>
                               <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                                   <p className="text-[9px] uppercase font-bold opacity-70 mb-1">Paid</p>
                                   <p className="text-lg font-black text-green-300">{formatCurrency(detailData.advance_amount)}</p>
                               </div>
                               <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                                   <p className="text-[9px] uppercase font-bold opacity-70 mb-1">Due</p>
                                   <p className="text-lg font-black text-rose-300">{formatCurrency(detailData.due_amount)}</p>
                               </div>
                           </div>
                       </div>

                       <div>
                           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 ml-1">
                               <FlaskConical size={14} /> Test Items ({detailData.items?.length || 0})
                           </h3>
                           <div className="space-y-3">
                               {detailData.items && detailData.items.map((item) => (
                                   <div key={item.item_id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden text-sm group">
                                       <div className="flex justify-between items-start mb-3 border-b border-gray-50 dark:border-gray-700 pb-2">
                                           <h4 className="font-bold text-gray-900 dark:text-white flex-1">{item.test_name}</h4>
                                           <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${getStatusColor(item.test_status)}`}>
                                               {item.test_status}
                                           </span>
                                       </div>
                                       <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 mb-3">
                                           <div className="flex items-center gap-1.5"><Calendar size={12} className="text-gray-300"/> {item.assigned_test_date}</div>
                                           <div className="flex items-center gap-1.5"><User size={12} className="text-gray-300"/> By: {item.test_done_by}</div>
                                       </div>
                                       <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/30 rounded-xl grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <p className="text-[9px] text-gray-400 uppercase font-bold">Cost</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.total_amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 uppercase font-bold">Paid</p>
                                                <p className="font-bold text-green-600">{formatCurrency(item.advance_amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 uppercase font-bold">Due</p>
                                                <p className="font-bold text-red-500">{formatCurrency(item.due_amount)}</p>
                                            </div>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                    </>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TestsScreen;
