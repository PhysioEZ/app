import React, { useState, useEffect } from 'react';
import {
  MdSearch,
  MdArrowBack,
  MdCheckCircle,
  MdAccessTime,
  MdHistory,
  MdClose,
  MdWarning,
  MdMonetizationOn,
  MdCreditCard,
  MdQrCode,
  MdChevronLeft,
  MdChevronRight,
  MdPerson,
  MdOutlineInsights,
  MdOutlineSwipe,
  MdDoneAll
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

// Date Strip (Optimized Compact Selector)
const DateStrip = ({ selectedDate, onSelectDate }: { selectedDate: string, onSelectDate: (d: string) => void }) => {
    const dates = [];
    const center = new Date(selectedDate);
    for (let i = -3; i <= 3; i++) {
        const d = new Date(center);
        d.setDate(center.getDate() + i);
        dates.push(d);
    }

    return (
        <div className="flex items-center gap-2 px-5 pt-1 pb-3 overflow-x-auto no-scrollbar scroll-smooth">
             {dates.map((date, i) => {
                 const dateStr = date.toISOString().split('T')[0];
                 const isSelected = dateStr === selectedDate;
                 const isToday = dateStr === new Date().toISOString().split('T')[0];
                 
                 return (
                     <button
                        key={i}
                        onClick={() => onSelectDate(dateStr)}
                        className={`flex flex-col items-center justify-center min-w-[2.8rem] h-14 rounded-2xl transition-all duration-300 border ${
                            isSelected 
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-sm' 
                                : 'bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-gray-400 dark:text-gray-500 border-gray-100 dark:border-white/5 shadow-sm'
                        }`}
                     >
                         <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isSelected ? 'opacity-70' : 'opacity-40'}`}>
                             {date.toLocaleDateString('en-US', { weekday: 'short' })}
                         </span>
                         <span className="text-base font-medium tracking-tighter">
                             {date.getDate()}
                         </span>
                         {isToday && !isSelected && <div className="w-1 h-1 bg-teal-500 rounded-full mt-0.5 animate-pulse" />}
                     </button>
                 )
             })}
        </div>
    );
};

export const AttendanceScreen: React.FC = () => {
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
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-black font-sans transition-colors relative overflow-hidden">
      
      {/* Ambient Branded Backgrounds */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* ULTRA COMPACT STICKY HEADER */}
      <header className="bg-white/80 dark:bg-black/60 backdrop-blur-md sticky top-0 z-30 pt-[max(env(safe-area-inset-top),16px)] border-b border-gray-100 dark:border-white/5 transition-all">
         <div className="px-5 py-2 space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/')} 
                        className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-gray-500 active:scale-90 transition-transform"
                    >
                        <MdArrowBack size={18} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight italic">Records</h1>
                </div>
                
                <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-32 focus:w-44 transition-all pl-8 pr-4 py-2 bg-gray-50 dark:bg-zinc-900 border-none rounded-xl text-[10px] font-bold text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
                    />
                </div>
            </div>

            {/* Premium Date Browser - Slimmed */}
            <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
         </div>
      </header>

      {/* SCROLLABLE FILTER & CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pb-40 no-scrollbar relative z-10">
         
         {/* Filter Micro-System (Not Sticky) */}
         <div className="flex items-center gap-2 px-5 py-4 overflow-x-auto no-scrollbar bg-white/30 dark:bg-black/20 border-b border-gray-50 dark:border-white/5 backdrop-blur-sm">
            {[
                { id: 'all', label: 'All', count: stats?.total_active ?? 0 },
                { id: 'present', label: 'Verified', count: stats?.present ?? 0 },
                { id: 'pending', label: 'Awaiting', count: stats?.pending ?? 0 },
            ].map((chip) => {
                const isActive = filter === chip.id;
                return (
                    <button
                        key={chip.id}
                        onClick={() => setFilter(chip.id as any)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all duration-300 shadow-sm whitespace-nowrap
                            ${isActive 
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-sm' 
                                : 'bg-white dark:bg-zinc-900 border-gray-50 dark:border-white/5 text-gray-500 dark:text-gray-400'}
                        `}
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest">{chip.label}</span>
                        <span className={`text-[10px] font-bold opacity-50`}>{chip.count}</span>
                    </button>
                )
            })}
         </div>

         {/* Patients Grid */}
         <div className="p-5 space-y-4">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                    <div className="w-6 h-6 border-2 border-transparent border-t-teal-500 rounded-full animate-spin" />
                    <p className="text-[9px] font-black uppercase tracking-widest italic tracking-tighter">Scanning Records...</p>
                </div>
            ) : patients.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {patients.map((patient, index) => {
                        const isPresent = patient.attendance_status === 'present';
                        const isPending = patient.attendance_status === 'pending';
                        const progress = patient.treatment_days > 0 ? Math.min(100, (patient.session_count / patient.treatment_days) * 100) : 0;
                        
                        return (
                            <div 
                            key={patient.patient_id}
                            onClick={() => { setSelectedPatient(patient); setShowDetailModal(true); setCurrentHistoryMonth(new Date()); fetchHistory(patient.patient_id); }}
                            className="bg-white dark:bg-zinc-900/40 rounded-[28px] p-5 shadow-sm border border-white dark:border-white/5 relative overflow-hidden active:scale-[0.98] transition-all duration-500 animate-slide-up hover:shadow-md group"
                            style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <div className="flex gap-5 relative z-10">
                                    {/* Bio Avatar */}
                                    <div className="relative shrink-0">
                                        <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center text-xl font-light overflow-hidden transition-all duration-500 border-2 ${isPresent ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600' : 'border-gray-100 dark:border-white/10 dark:bg-zinc-800 text-gray-400'}`}>
                                            {patient.patient_photo_path ? (
                                                <img src={getImageUrl(patient.patient_photo_path) || ''} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-serif italic text-lg">{patient.patient_name[0]}</span>
                                            )}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center shadow-lg border border-white dark:border-zinc-900 ${isPresent ? 'bg-teal-500 text-white' : isPending ? 'bg-rose-500 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-400'}`}>
                                            {isPresent ? <MdCheckCircle size={12} /> : isPending ? <MdAccessTime size={12} /> : <MdPerson size={10} />}
                                        </div>
                                    </div>

                                    {/* Intelligent Info Payload */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="min-w-0">
                                                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate tracking-tight">{patient.patient_name}</h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                    <span className="text-[8px] font-black text-teal-600/70 border border-teal-500/20 px-1.5 py-0.5 rounded-lg uppercase tracking-widest bg-teal-500/5">
                                                        {patient.treatment_type}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                                                        ID: #{patient.patient_uid || patient.patient_id}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {!isPresent && !isPending && (
                                                <div className="text-right">
                                                    <p className={`text-[10px] font-medium tracking-tighter ${patient.effective_balance < 0 ? 'text-rose-600' : 'text-gray-900 dark:text-white'}`}>
                                                        ₹{patient.effective_balance}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress Visualization */}
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex-1 h-1 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isPresent ? 'bg-teal-500' : isPending ? 'bg-rose-500' : 'bg-gray-200 dark:bg-zinc-700'}`} 
                                                    style={{width: `${progress}%`}}
                                                />
                                            </div>
                                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                                {patient.session_count} / {patient.treatment_days || '∞'}
                                            </div>
                                        </div>

                                        {/* Smart Dynamic Action */}
                                        {(!isPresent && !isPending) && (
                                            <div className="mt-3 flex items-center justify-between border-t border-gray-50 dark:border-white/5 pt-3">
                                                <p className="text-[8px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest">Awaiting Pulse</p>
                                                <button 
                                                    onClick={(e) => handleMarkClick(e, patient)}
                                                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5 group/btn"
                                                >
                                                    Arrived
                                                    <MdChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 text-center opacity-30">
                    <MdPerson size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-sm font-light tracking-widest uppercase text-gray-400 italic">Clear Hall</h3>
                </div>
            )}
         </div>
      </main>

      {/* --- Intelligent Modals --- */}

      {/* Balance Verification Modal */}
      {showBalanceActionModal && selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
             <div className="bg-white dark:bg-black w-full sm:max-w-xs rounded-[32px] shadow-2xl p-8 mb-20 sm:mb-0 border border-gray-100 dark:border-white/5 animate-slide-up">
                 <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                    <MdWarning size={32} />
                 </div>
                 <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2 tracking-tight">Financial Gap</h2>
                 <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8">
                     <b>{selectedPatient.patient_name}</b> does not have enough credit to cover this session.
                 </p>
                 <div className="flex flex-col gap-3">
                     <button 
                        onClick={() => { setShowBalanceActionModal(false); setShowPaymentModal(true); }} 
                        className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl text-sm transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2"
                     >
                        <MdMonetizationOn size={18}/> Collect Payment
                     </button>
                     <button 
                        onClick={() => submitAttendance({ markAsPending: true })} 
                        className="w-full py-4 bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 font-bold rounded-2xl text-sm border border-gray-100 dark:border-white/5 transition-all active:scale-95 flex items-center justify-center gap-2"
                     >
                        <MdOutlineInsights size={18}/> Request Pass
                     </button>
                     <button onClick={() => setShowBalanceActionModal(false)} className="w-full py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 hover:text-gray-900 dark:hover:text-white transition-colors">Discard</button>
                 </div>
             </div>
          </div>
      )}

      {/* Confirm Action Modal */}
      {showConfirmModal && selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
             <div className="bg-white dark:bg-black w-full sm:max-w-xs rounded-[32px] shadow-2xl p-8 mb-20 sm:mb-0 border border-gray-100 dark:border-white/5 animate-slide-up">
                 <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 text-teal-500 rounded-2xl flex items-center justify-center mb-6">
                    <MdCheckCircle size={32} />
                 </div>
                 <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2 tracking-tight">Confirm Arrival</h2>
                 <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8">Marking <b>{selectedPatient.patient_name}</b> as present for today's session.</p>
                 <div className="flex flex-col gap-3">
                     <button 
                        onClick={() => submitAttendance({})} 
                        disabled={processing} 
                        className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl text-sm transition-all active:scale-95 shadow-xl"
                     >
                        {processing ? 'Processing...' : 'Verify Session'}
                     </button>
                     <button onClick={() => setShowConfirmModal(false)} className="w-full py-4 bg-gray-50 dark:bg-zinc-900 text-gray-400 font-bold rounded-2xl text-sm transition-all active:scale-95">Cancel</button>
                 </div>
             </div>
          </div>
      )}

      {/* Payment Collector Modal */}
      {showPaymentModal && selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
             <div className="bg-white dark:bg-black w-full sm:max-w-sm rounded-[40px] shadow-2xl p-8 mb-20 sm:mb-0 border border-gray-100 dark:border-white/5 animate-slide-up">
                 <div className="flex justify-between items-center mb-8">
                     <div>
                        <h2 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none italic">Revenue Entry</h2>
                        <p className="text-[10px] font-medium text-teal-600/70 uppercase tracking-[0.2em] mt-2">Fund Allocation</p>
                     </div>
                     <button onClick={() => setShowPaymentModal(false)} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-gray-400"><MdClose size={20}/></button>
                 </div>
                 
                 <div className="space-y-8">
                     <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-3xl p-6 border border-gray-100 dark:border-white/5 transition-all">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Input Amount (₹)</label>
                         <div className="flex items-center text-gray-900 dark:text-white">
                             <input 
                                type="number" 
                                value={paymentAmount} 
                                onChange={e => setPaymentAmount(e.target.value)} 
                                className="bg-transparent border-none text-4xl font-light tracking-tighter w-full focus:ring-0 p-0 placeholder:text-gray-200 dark:placeholder:text-zinc-800 outline-none italic" 
                                placeholder="0.00" 
                                autoFocus 
                             />
                         </div>
                     </div>

                     <div>
                         <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mb-4 block">Channel Selection</label>
                         <div className="grid grid-cols-3 gap-3">
                             {[
                                { id: 'cash', label: 'Cash', icon: MdMonetizationOn },
                                { id: 'upi', label: 'UPI/Online', icon: MdQrCode },
                                { id: 'card', label: 'Visa/MC', icon: MdCreditCard }
                             ].map(m => (
                                 <button 
                                    key={m.id} 
                                    onClick={() => setPaymentMode(m.id)} 
                                    className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all duration-300 ${paymentMode === m.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white scale-105 shadow-xl' : 'bg-white dark:bg-zinc-900 border-gray-50 dark:border-white/5 text-gray-400'}`}
                                 >
                                     <m.icon size={22} className={paymentMode === m.id ? 'opacity-100' : 'opacity-30'} />
                                     <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                                 </button>
                             ))}
                         </div>
                     </div>

                     <div className="flex flex-col gap-4">
                        <input 
                            value={remarks} 
                            onChange={e => setRemarks(e.target.value)} 
                            placeholder="Transactional notes (optional)" 
                            className="w-full py-4 px-6 bg-white dark:bg-transparent rounded-2xl border border-gray-100 dark:border-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-zinc-800 outline-none focus:border-teal-500/30 transition-all" 
                        />
                        <button 
                            onClick={() => submitAttendance({ withPayment: true })} 
                            disabled={!paymentAmount || !paymentMode || processing} 
                            className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[28px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl disabled:opacity-20 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <MdDoneAll size={20} className="hidden" />
                            Finalize Deposit
                        </button>
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* History Intelligence Console (Premium Sidebar Sheet) */}
      {showDetailModal && selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
             <div className="bg-white dark:bg-black w-full sm:max-w-md h-[85vh] sm:h-[90vh] sm:max-h-[800px] rounded-t-[48px] sm:rounded-[48px] flex flex-col shadow-2xl animate-slide-up border border-white dark:border-white/5 overflow-hidden">
                 {/* Premium Profile Header */}
                 <div className="p-10 shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-br from-teal-500/10 via-transparent to-transparent pointer-events-none" />
                     <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-zinc-900 border-2 border-white dark:border-white/5 flex items-center justify-center text-teal-600 font-serif italic text-2xl shadow-lg ring-4 ring-gray-50/50 dark:ring-zinc-900/40">
                                {selectedPatient.patient_photo_path ? (
                                    <img src={getImageUrl(selectedPatient.patient_photo_path) || ''} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    selectedPatient.patient_name[0]
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{selectedPatient.patient_name}</h2>
                                <p className="text-[10px] font-black text-teal-600/70 border-b border-teal-500/20 inline-block py-0.5 uppercase tracking-widest hover:text-teal-500 transition-colors cursor-pointer" onClick={() => navigate(`/patients/${selectedPatient.patient_id}`)}>View Profile Archive</p>
                            </div>
                        </div>
                        <button onClick={() => setShowDetailModal(false)} className="w-12 h-12 bg-gray-50 dark:bg-zinc-900 shadow-sm rounded-full flex items-center justify-center text-gray-400 active:scale-90 transition-transform"><MdClose size={24}/></button>
                     </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto px-10 pb-20 no-scrollbar">
                     {historyLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                           <div className="w-8 h-8 border-2 border-transparent border-t-teal-500 rounded-full animate-spin" />
                           <p className="text-[10px] font-bold uppercase tracking-widest">Compiling Analytics...</p>
                        </div>
                     ) : historyData ? (
                         <div className="space-y-12">
                             {/* Stats Dashboard */}
                             <div className="grid grid-cols-3 gap-6">
                                 {[
                                     { label: 'Total', val: historyData.stats.total_days, color: 'text-gray-900 dark:text-white' },
                                     { label: 'Attended', val: historyData.stats.present_count, color: 'text-teal-600' },
                                     { label: 'Cycles Left', val: historyData.stats.remaining, color: 'text-rose-500' }
                                 ].map((s, i) => (
                                     <div key={i} className="text-center">
                                         <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">{s.label}</p>
                                         <p className={`text-2xl font-light tracking-tighter ${s.color}`}>{s.val}</p>
                                     </div>
                                 ))}
                             </div>

                             {/* Calendar Visualization */}
                             <div>
                                 <div className="flex items-center justify-between mb-8 px-1">
                                     <h3 className="text-xs font-black flex items-center gap-2 text-gray-900 dark:text-gray-400 uppercase tracking-widest"><MdHistory size={16} /> Bio-Metrics Log</h3>
                                     <div className="flex items-center gap-4">
                                         <button onClick={() => setCurrentHistoryMonth(new Date(currentHistoryMonth.setMonth(currentHistoryMonth.getMonth()-1)))} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg text-gray-400 transition-colors"><MdChevronLeft size={20}/></button>
                                         <span className="text-[10px] font-black w-24 text-center text-gray-900 dark:text-white uppercase tracking-widest">{currentHistoryMonth.toLocaleString('default', {month:'long', year:'numeric'})}</span>
                                         <button onClick={() => setCurrentHistoryMonth(new Date(currentHistoryMonth.setMonth(currentHistoryMonth.getMonth()+1)))} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg text-gray-400 transition-colors"><MdChevronRight size={20}/></button>
                                     </div>
                                 </div>

                                 <div className="bg-gray-50 dark:bg-zinc-900/30 rounded-[40px] p-8 border border-gray-100 dark:border-white/5 relative overflow-hidden group/cal">
                                     <div className="absolute inset-0 bg-gradient-to-br from-white/50 dark:from-white/[0.02] to-transparent pointer-events-none" />
                                     <div className="grid grid-cols-7 gap-4 text-center mb-6 relative z-10">
                                         {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-[8px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-tighter">{d}</div>)}
                                     </div>
                                     <div className="grid grid-cols-7 gap-4 text-center relative z-10">
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
                                                   
                                                   let baseCls = 'w-full aspect-square rounded-[14px] flex items-center justify-center text-[10px] font-bold transition-all duration-500 relative ring-offset-4 dark:ring-offset-black';
                                                   let statusCls = 'bg-white dark:bg-zinc-900 text-gray-300 dark:text-gray-700 border border-gray-100 dark:border-white/5';

                                                   if (rec?.status === 'present') {
                                                       statusCls = 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl scale-110 z-10 rotate-3';
                                                   } else if (rec?.status === 'pending') {
                                                       statusCls = 'bg-rose-500 text-white shadow-lg scale-105';
                                                   }
                                                   
                                                   els.push(
                                                     <div 
                                                        key={d} 
                                                        className={`${baseCls} ${statusCls} ${isToday ? 'ring-2 ring-teal-500' : ''}`}
                                                        title={rec?.remarks}
                                                     >
                                                         {d}
                                                         {rec?.status === 'present' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full border-2 border-white dark:border-gray-900" />}
                                                     </div>
                                                   );
                                               }
                                               return els;
                                         })()}
                                     </div>
                                 </div>
                             </div>

                             {/* Bottom Visualizer Overlay */}
                             <div className="py-10 text-center relative">
                                <MdOutlineSwipe size={24} className="mx-auto text-gray-200 dark:text-zinc-800 mb-2 animate-pulse" />
                                <p className="text-[10px] font-black text-gray-300 dark:text-zinc-800 uppercase tracking-[0.4em]">Physio EZ Intelligence</p>
                             </div>
                         </div>
                     ) : <div className="text-center py-20 opacity-30 italic text-gray-400">Zero data fingerprints found.</div>}
                 </div>
             </div>
          </div>
      )}

      {/* Persistence Dock Feedback (Slimmed) */}
      <div className="fixed bottom-28 left-0 right-0 flex justify-center pointer-events-none z-20 px-6">
        <div className="bg-gray-900/95 dark:bg-zinc-800/95 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 text-white/50 border border-white/5 shadow-xl">
            <span className="text-[7px] font-black uppercase tracking-[0.2em] italic">{loading ? 'Scanning...' : filter === 'all' ? 'Live Flow' : `${filter} mode`}</span>
            <div className={`w-1 h-1 rounded-full ${loading ? 'bg-teal-500 animate-ping' : 'bg-white/20'}`} />
        </div>
      </div>

    </div>
  );
};

export default AttendanceScreen;
