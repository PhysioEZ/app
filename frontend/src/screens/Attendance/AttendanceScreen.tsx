import { useState, useEffect } from 'react';
import {
  MdSearch,
  MdArrowBack,
  MdCheckCircle,
  MdAccessTime,
  MdAccountBalanceWallet,
  MdHistory,
  MdClose,
  MdWarning,
  MdMonetizationOn,
  MdCreditCard,
  MdQrCode,
  MdChevronLeft,
  MdChevronRight,
  MdPerson
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// --- Types ---
interface AttendanceRecord {
  patient_id: number;
  patient_name: string;
  patient_uid: string | null;
  patient_photo_path: string | null;
  phone_number: string;
  treatment_type: string;
  treatment_days: number;
  session_count: number;
  is_present: boolean;
  attendance_status: 'present' | 'pending' | null;
  attended_date: string | null;
  cost_per_day: number;
  effective_balance: number;
  due_amount?: number;
}

interface AttendanceStats {
    total_active: number;
    present: number;
    pending: number;
    absent: number;
}

// --- Components ---

// Date Strip (Google Calendar Style)
const DateStrip = ({ selectedDate, onSelectDate }: { selectedDate: string, onSelectDate: (d: string) => void }) => {
    // Generate 2 weeks window
    const dates = [];
    const center = new Date(selectedDate);
    for (let i = -3; i <= 3; i++) {
        const d = new Date(center);
        d.setDate(center.getDate() + i);
        dates.push(d);
    }

    return (
        <div className="flex items-center justify-between px-2 pt-2 pb-4 overflow-x-auto no-scrollbar mask-gradient">
             {dates.map((date, i) => {
                 const dateStr = date.toISOString().split('T')[0];
                 const isSelected = dateStr === selectedDate;
                 const isToday = dateStr === new Date().toISOString().split('T')[0];
                 
                 return (
                     <button
                        key={i}
                        onClick={() => onSelectDate(dateStr)}
                        className={`flex flex-col items-center justify-center min-w-[3rem] h-16 mx-1 rounded-[20px] transition-all duration-300 ${
                            isSelected 
                                ? 'bg-primary text-on-primary shadow-lg shadow-primary/25 scale-105 z-10' 
                                : 'bg-surface-variant/30 dark:bg-gray-800 text-outline border border-outline-variant/10 dark:border-gray-700'
                        }`}
                     >
                         <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? 'text-on-primary/80' : 'text-outline/70 dark:text-gray-400'}`}>
                             {date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0,3)}
                         </span>
                         <span className={`text-lg font-black ${isSelected ? 'text-on-primary' : isToday ? 'text-primary' : 'text-on-surface dark:text-gray-200'}`}>
                             {date.getDate()}
                         </span>
                         {isToday && !isSelected && <div className="w-1 h-1 bg-primary rounded-full mt-1" />}
                     </button>
                 )
             })}
        </div>
    );
};

export const AttendanceScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // State
  const [patients, setPatients] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'present' | 'pending'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Modals
  const [selectedPatient, setSelectedPatient] = useState<AttendanceRecord | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBalanceActionModal, setShowBalanceActionModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Forms
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  // History
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentHistoryMonth, setCurrentHistoryMonth] = useState(new Date());

  // --- API Functions ---

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const branchId = user?.branch_id || 1;
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      const params = new URLSearchParams({
        branch_id: branchId.toString(),
        date: selectedDate,
        search: searchQuery,
        status: filter === 'pending' ? 'all' : filter,
        limit: '100'
      });

      const response = await fetch(`${baseUrl}/attendance.php?${params.toString()}`);
      const data = await response.json();

      if (data.status === 'success') {
        let fetchedPatients: AttendanceRecord[] = data.data;
        if (filter === 'pending') {
            fetchedPatients = fetchedPatients.filter(p => p.attendance_status === 'pending');
        }
        setPatients(fetchedPatients);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (patientId: number) => {
    setHistoryLoading(true);
    setHistoryData(null);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      const response = await fetch(`${baseUrl}/attendance_history.php?patient_id=${patientId}`);
      const data = await response.json();
      if (data.status === 'success') {
        setHistoryData(data.data);
      }
    } catch (error) {
       console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const submitAttendance = async (options: { withPayment?: boolean, markAsPending?: boolean }) => {
    if (!selectedPatient) return;
    setProcessing(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      const payload = {
        patient_id: selectedPatient.patient_id,
        employee_id: user?.employee_id || 1,
        payment_amount: options.withPayment ? parseFloat(paymentAmount) : 0,
        mode: options.withPayment ? paymentMode : '',
        remarks: remarks,
        mark_as_pending: options.markAsPending || false
      };

      const response = await fetch(`${baseUrl}/mark_attendance.php`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        setShowPaymentModal(false);
        setShowConfirmModal(false);
        setShowBalanceActionModal(false);
        fetchAttendance(); 
      } else {
        alert(result.message || 'Error marking attendance');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to submit');
    } finally {
      setProcessing(false);
    }
  };

  // --- Handlers ---
  
  useEffect(() => {
    const timer = setTimeout(() => { fetchAttendance(); }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, filter, selectedDate]);

  const handleMarkClick = (e: React.MouseEvent, patient: AttendanceRecord) => {
    e.stopPropagation();
    setSelectedPatient(patient);
    setPaymentAmount(''); setPaymentMode(''); setRemarks('');

    const hasBalance = patient.effective_balance >= patient.cost_per_day;
    if (hasBalance) setShowConfirmModal(true);
    else {
      const needed = Math.max(0, patient.cost_per_day - patient.effective_balance);
      setPaymentAmount(Math.ceil(needed).toString());
      setShowBalanceActionModal(true);
    }
  };

  const getImageUrl = (path: string | null) => path ? `https://prospine.in/proadmin/admin/${path.replace(/^\//, '')}` : null;

  // --- Render ---

  return (
    <div className="flex flex-col h-full bg-surface dark:bg-gray-950 font-sans transition-colors relative">
      
      {/* Primary Gradient (From Previous Design) */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/30 to-transparent pointer-events-none z-0 dark:from-primary/10" />

      {/* 1. Header (Transparent + Gradient) */}
      <div className="bg-transparent backdrop-blur-xl sticky top-0 z-20 pt-[max(env(safe-area-inset-top),32px)] transition-colors">
         <div className="px-5 py-3 flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-surface-variant/40 text-on-surface dark:text-white transition-colors">
               <MdArrowBack size={24} />
            </button>
            <div className="flex-1">
                <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight">Daily Visits</h1>
                <p className="text-xs font-medium text-outline/80 dark:text-gray-400">
                    {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
            </div>
            
            {/* Search Trigger (Collapsible) */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <MdSearch className="text-outline group-focus-within:text-primary" />
                </div>
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-32 focus:w-48 transition-all pl-9 pr-4 py-2 bg-surface-variant/40 dark:bg-gray-800 backdrop-blur-md rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/50 text-on-surface dark:text-gray-100 placeholder:text-outline/60 dark:placeholder:text-gray-500"
                />
            </div>
         </div>

         {/* 2. Date Strip (Google Calendar Style) */}
         <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </div>

      {/* 3. Filter Chips (Clean & Consolidated) */}
      <div className="px-5 py-2 flex gap-2 overflow-x-auto no-scrollbar mask-gradient relative z-10">
         {[
             { id: 'all', label: 'All', count: stats?.total_active ?? 0 },
             { id: 'present', label: 'Present', count: stats?.present ?? 0 },
             { id: 'pending', label: 'Pending', count: stats?.pending ?? 0 },
         ].map((chip) => {
             const isActive = filter === chip.id;
             return (
                 <button
                    key={chip.id}
                    onClick={() => setFilter(chip.id as any)}
                    className={`
                        flex items-center gap-2 pl-4 pr-5 py-2 rounded-full border transition-all duration-300 shadow-sm
                        ${isActive 
                           ? 'bg-secondary-container text-on-secondary-container border-secondary-container shadow-md scale-[1.02]' 
                           : 'bg-surface dark:bg-gray-800 border-outline-variant/40 dark:border-gray-800 text-on-surface-variant dark:text-gray-300 hover:bg-surface-variant/50'}
                    `}
                 >
                     <span className="text-xs font-bold uppercase tracking-wide">{chip.label}</span>
                     <span className={`text-xs ml-1 font-black px-1.5 rounded-md ${isActive ? 'bg-black/10' : 'bg-surface-variant dark:bg-gray-800 text-outline dark:text-gray-400'}`}>{chip.count}</span>
                 </button>
             )
         })}
      </div>

      {/* 4. Main List (Card Style from Current Design) */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-3 pt-2 no-scrollbar relative z-10">
         {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div></div>
         ) : patients.length > 0 ? (
             patients.map((patient, index) => {
                 const isPresent = patient.attendance_status === 'present';
                 const isPending = patient.attendance_status === 'pending';
                 const progress = patient.treatment_days > 0 ? Math.min(100, (patient.session_count / patient.treatment_days) * 100) : 0;
                 
                 return (
                     <div 
                       key={patient.patient_id}
                       onClick={() => { setSelectedPatient(patient); setShowDetailModal(true); setCurrentHistoryMonth(new Date()); fetchHistory(patient.patient_id); }}
                       className="bg-surface dark:bg-gray-900 rounded-[24px] p-4 shadow-sm border border-outline-variant/10 dark:border-gray-800 relative overflow-hidden active:scale-[0.98] transition-all duration-300 animate-slide-up group hover:shadow-md"
                       style={{ animationDelay: `${index * 50}ms` }}
                     >
                         {/* Status Bar Indicator */}
                         <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 ${isPresent ? 'bg-green-500' : isPending ? 'bg-amber-500' : 'bg-transparent'}`} />
                         
                         <div className="flex gap-4 pl-3">
                             {/* Avatar */}
                             <div className="relative shrink-0 pt-0.5">
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold uppercase overflow-hidden shadow-inner transition-colors ${isPresent ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-surface-variant text-outline dark:bg-gray-800 dark:text-gray-400'}`}>
                                     {patient.patient_photo_path ? <img src={getImageUrl(patient.patient_photo_path) || ''} alt="" className="w-full h-full object-cover" /> : patient.patient_name[0]}
                                 </div>
                             </div>

                             {/* Info */}
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start mb-1.5">
                                     <div className="pr-2">
                                         <h3 className="text-base font-bold text-on-surface dark:text-white truncate">{patient.patient_name}</h3>
                                         <div className="flex items-center gap-2 mt-0.5">
                                             <span className="text-[10px] bg-surface-variant/50 dark:bg-gray-800 text-outline dark:text-gray-300 px-1.5 py-0.5 rounded font-mono">#{patient.patient_uid || patient.patient_id}</span>
                                             <span className="text-[10px] font-black text-primary uppercase tracking-wide bg-primary/5 px-1.5 py-0.5 rounded">{patient.treatment_type}</span>
                                         </div>
                                     </div>
                                     
                                     {/* Status Badge */}
                                     {isPresent ? (
                                         <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-[10px] font-black uppercase tracking-wide shadow-sm">
                                             <MdCheckCircle size={14} /> Present
                                         </div>
                                     ) : isPending ? (
                                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-xl text-[10px] font-black uppercase tracking-wide shadow-sm">
                                             <MdAccessTime size={14} /> Pending
                                         </div>
                                     ) : null}
                                 </div>

                                 {/* Progress Bar */}
                                 <div className="flex items-center gap-3">
                                     <div className="flex-1 h-2 bg-surface-variant/50 dark:bg-gray-800 rounded-full overflow-hidden">
                                         <div className={`h-full rounded-full transition-all duration-700 ease-out ${isPresent ? 'bg-green-500' : isPending ? 'bg-amber-500' : 'bg-primary'}`} style={{width: `${progress}%`}}></div>
                                     </div>
                                     <div className="text-[10px] font-bold text-outline uppercase">{patient.session_count}/{patient.treatment_days}</div>
                                 </div>

                                 {/* Action Button (Visible if NOT present) */}
                                 {(!isPresent && !isPending) && (
                                     <div className="mt-3 flex items-center justify-between border-t border-outline-variant/10 dark:border-gray-800 pt-3">
                                         <div className={`text-xs font-bold flex items-center gap-1.5 ${patient.effective_balance < 0 ? 'text-error' : 'text-outline'}`}>
                                             <MdAccountBalanceWallet size={14} /> ₹{patient.effective_balance}
                                         </div>
                                         <button 
                                           onClick={(e) => handleMarkClick(e, patient)}
                                           className="bg-on-surface dark:bg-white text-surface dark:text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                         >
                                             Mark Present
                                         </button>
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                 )
             })
         ) : (
             <div className="flex flex-col items-center justify-center py-24 opacity-60">
                <div className="w-20 h-20 bg-surface-variant/30 rounded-full flex items-center justify-center mb-4">
                    <MdPerson size={40} className="text-outline/50" />
                </div>
                <p className="text-outline font-medium">No patients found</p>
             </div>
         )}
      </div>

      {/* --- Modals (Consistent M3 Glass Style) --- */}

      {/* Balance Modal */}
      {showBalanceActionModal && selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 perspective-1000">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowBalanceActionModal(false)} />
             <div className="relative w-full max-w-sm bg-surface dark:bg-gray-900 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-slide-up border border-white/10">
                 <div className="w-12 h-1 bg-outline-variant/20 rounded-full mx-auto mb-6" />
                 <div className="text-center mb-6">
                     <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl border-4 border-surface dark:border-gray-900"><MdWarning /></div>
                     <h2 className="text-xl font-bold text-on-surface dark:text-white">Low Balance</h2>
                     <p className="text-outline mt-2 text-sm leading-relaxed">
                         <b>{selectedPatient.patient_name}</b> has insufficient funds.<br/>
                         Required: <span className="text-on-surface font-bold">₹{selectedPatient.cost_per_day}</span> • Available: <span className="text-error font-bold">₹{selectedPatient.effective_balance}</span>
                     </p>
                 </div>
                 <div className="flex flex-col gap-3">
                     <button onClick={() => { setShowBalanceActionModal(false); setShowPaymentModal(true); }} className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                        <MdMonetizationOn className="inline mr-2 text-lg"/> Collect Payment
                     </button>
                     <button onClick={() => submitAttendance({ markAsPending: true })} className="w-full py-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-2xl font-bold border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors">
                        Request Admin Approval
                     </button>
                     <button onClick={() => setShowBalanceActionModal(false)} className="w-full py-2 text-outline font-bold text-xs uppercase tracking-widest hover:text-on-surface">Cancel</button>
                 </div>
             </div>
          </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
             <div className="relative w-full max-w-[320px] bg-surface dark:bg-gray-900 rounded-[32px] p-6 shadow-2xl animate-scale-in border border-white/10">
                 <h2 className="text-xl font-bold text-on-surface dark:text-white mb-2">Mark Present?</h2>
                 <p className="text-outline text-sm mb-6">Confirm attendance for <b>{selectedPatient.patient_name}</b>.</p>
                 <div className="flex gap-3">
                     <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-surface-variant text-on-surface-variant rounded-xl font-bold hover:bg-surface-variant/80 transition-colors">No</button>
                     <button onClick={() => submitAttendance({})} disabled={processing} className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">Yes</button>
                 </div>
             </div>
          </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
             <div className="relative w-full max-w-sm bg-surface dark:bg-gray-900 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-slide-up border border-white/10">
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-on-surface dark:text-white">Record Payment</h2>
                     <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-surface-variant/50 rounded-full hover:bg-surface-variant"><MdClose /></button>
                 </div>
                 <div className="space-y-6">
                     <div className="bg-surface-variant/30 rounded-2xl p-4 border border-outline-variant/10">
                         <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Amount</label>
                         <div className="flex items-center text-primary dark:text-primary-container">
                             <span className="text-2xl mr-1 font-bold">₹</span>
                             <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="bg-transparent border-none text-3xl font-black w-full focus:ring-0 p-0 placeholder:text-outline/30 outline-none" placeholder="0" autoFocus />
                         </div>
                     </div>
                     <div>
                         <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2 block">Payment Mode</label>
                         <div className="grid grid-cols-3 gap-3">
                             {['cash','upi','card'].map(m => (
                                 <button key={m} onClick={() => setPaymentMode(m)} className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${paymentMode === m ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/20 text-outline hover:bg-surface-variant/30'}`}>
                                     {m === 'cash' && <MdMonetizationOn size={20} />}
                                     {m === 'upi' && <MdQrCode size={20} />}
                                     {m === 'card' && <MdCreditCard size={20} />}
                                     <span className="text-[10px] font-bold uppercase tracking-wider">{m}</span>
                                 </button>
                             ))}
                         </div>
                     </div>
                     <input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Remarks (Optional)" className="w-full py-4 px-4 bg-surface-variant/30 rounded-2xl outline-none text-sm font-medium border-2 border-transparent focus:border-primary/50 transition-colors text-on-surface" />
                     <button onClick={() => submitAttendance({ withPayment: true })} disabled={!paymentAmount || !paymentMode || processing} className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none hover:bg-primary/90 transition-colors">
                         Complete Payment
                     </button>
                 </div>
             </div>
          </div>
      )}

      {/* History Detail Modal (Full Screen Sheet) */}
      {showDetailModal && selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowDetailModal(false)} />
             <div className="relative w-full sm:max-w-md bg-surface dark:bg-gray-900 rounded-t-[32px] sm:rounded-[32px] h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden border border-white/10">
                 {/* Header */}
                 <div className="p-6 bg-surface dark:bg-gray-900 border-b border-outline-variant/10 z-10">
                     <div className="flex justify-between items-start mb-4">
                         <div>
                             <h2 className="text-2xl font-bold text-on-surface dark:text-white leading-tight">{selectedPatient.patient_name}</h2>
                             <div className="flex items-center gap-2 mt-1">
                                 <span className="text-xs font-mono bg-surface-variant px-1.5 py-0.5 rounded text-outline">#{selectedPatient.patient_uid || selectedPatient.patient_id}</span>
                                 <span className="text-[10px] font-black text-primary uppercase tracking-wide bg-primary/5 px-2 py-0.5 rounded">{selectedPatient.treatment_type}</span>
                             </div>
                         </div>
                         <button onClick={() => setShowDetailModal(false)} className="bg-surface-variant/50 p-2 rounded-full hover:bg-surface-variant text-on-surface"><MdClose size={20}/></button>
                     </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 pb-safe">
                     {historyLoading ? <div className="flex justify-center py-10"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"/></div> : historyData ? (
                         <div className="space-y-6">
                             {/* Stats Row */}
                             <div className="flex justify-between text-center bg-surface-variant/20 dark:bg-gray-800 p-5 rounded-[24px] border border-outline-variant/10 dark:border-gray-700">
                                 <div><div className="text-2xl font-black text-on-surface dark:text-white">{historyData.stats.total_days}</div><div className="text-[10px] font-bold text-outline uppercase tracking-wider dark:text-gray-400">Total</div></div>
                                 <div className="w-px bg-outline-variant/20 dark:bg-gray-700"></div>
                                 <div><div className="text-2xl font-black text-primary dark:text-primary-container">{historyData.stats.present_count}</div><div className="text-[10px] font-bold text-primary/80 dark:text-primary/60 uppercase tracking-wider">Present</div></div>
                                 <div className="w-px bg-outline-variant/20 dark:bg-gray-700"></div>
                                 <div><div className="text-2xl font-black text-on-surface dark:text-white">{historyData.stats.remaining}</div><div className="text-[10px] font-bold text-outline uppercase tracking-wider dark:text-gray-400">Left</div></div>
                             </div>

                             {/* Calendar Section */}
                             <div>
                                 <div className="flex items-center justify-between mb-4 px-1">
                                     <h3 className="font-bold flex items-center gap-2 text-on-surface dark:text-gray-200"><MdHistory size={18} /> Attendance Log</h3>
                                     <div className="flex gap-1 bg-surface-variant/50 p-1 rounded-lg">
                                         <button onClick={() => setCurrentHistoryMonth(new Date(currentHistoryMonth.setMonth(currentHistoryMonth.getMonth()-1)))} className="p-1 hover:bg-surface rounded-md text-outline"><MdChevronLeft size={16}/></button>
                                         <span className="text-xs font-bold w-20 text-center flex items-center justify-center text-on-surface dark:text-gray-200">{currentHistoryMonth.toLocaleString('default', {month:'short', year:'numeric'})}</span>
                                         <button onClick={() => setCurrentHistoryMonth(new Date(currentHistoryMonth.setMonth(currentHistoryMonth.getMonth()+1)))} className="p-1 hover:bg-surface rounded-md text-outline"><MdChevronRight size={16}/></button>
                                     </div>
                                 </div>

                                 <div className="bg-surface-variant/10 rounded-[28px] p-4 border border-outline-variant/10">
                                     <div className="grid grid-cols-7 gap-2 text-center mb-2">
                                         {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[10px] font-black text-outline/50">{d}</div>)}
                                     </div>
                                     <div className="grid grid-cols-7 gap-2 text-center">
                                         {(() => {
                                              const year = currentHistoryMonth.getFullYear();
                                              const month = currentHistoryMonth.getMonth();
                                              const daysInMonth = new Date(year, month + 1, 0).getDate();
                                              const firstDay = new Date(year, month, 1).getDay();
                                              const els = [];
                                              for(let i=0; i<firstDay; i++) els.push(<div key={`empty-${i}`}/>);
                                              for(let d=1; d<=daysInMonth; d++) {
                                                  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                                                  const rec = historyData.history.find((h:any) => h.attendance_date === dateStr);
                                                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                                                  let cls = 'bg-surface dark:bg-gray-800 text-outline/40 dark:text-gray-400';
                                                  
                                                  if (rec?.status === 'present') cls = 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105 z-10';
                                                  else if (rec?.status === 'pending') cls = 'bg-amber-400 text-black shadow-md';
                                                  
                                                  els.push(
                                                    <div key={d} className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all ${cls} ${isToday ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900' : ''}`} title={rec?.remarks}>
                                                        {d}
                                                    </div>
                                                  );
                                              }
                                              return els;
                                         })()}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     ) : <div className="text-center py-10 opacity-50 text-outline">No history found</div>}
                 </div>
             </div>
          </div>
      )}

    </div>
  );
};

export default AttendanceScreen;
