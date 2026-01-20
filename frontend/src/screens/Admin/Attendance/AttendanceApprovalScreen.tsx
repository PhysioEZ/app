import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdCheckCircle, MdClose, MdBusiness, MdSearch, 
    MdDoneAll, MdChevronLeft, MdWarning
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface AttendanceRecord {
    attendance_id: number;
    attendance_date: string;
    status: 'pending' | 'present' | 'rejected';
    remarks: string;
    approval_request_at: string;
    patient_id: number;
    patient_name: string;
    branch_name: string;
    patient_uid: string;
    advance_payment: number;
    treatment_cost_per_day: number;
    treatment_type: string;
    package_cost: number;
    treatment_days: number;
}

// --- Custom UI Components ---


const AttendanceApprovalScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [branches, setBranches] = useState<{branch_id: number, branch_name: string}[]>([]);
    const [stats, setStats] = useState({ pending: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<number | null>(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | ''>('pending');
    const [filterBranch, setFilterBranch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAttendance();
    }, [user, filterStatus, filterBranch]);

    const fetchAttendance = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const empId = (user as any).employee_id || user.id;
            const res = await fetch(`${API_URL}/admin/attendance.php?action=fetch_attendance&user_id=${empId}&status=${filterStatus}&branch_id=${filterBranch}`);
            const json = await res.json();
            if (json.status === 'success') {
                setRecords(json.data);
                setBranches(json.branches || []);
                setStats(json.stats || { pending: 0 });
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleUpdateStatus = async (attendanceId: number, newStatus: 'approved' | 'rejected') => {
        if (!user) return;
        setSubmitting(attendanceId);
        try {
            const empId = (user as any).employee_id || user.id;
            const res = await fetch(`${API_URL}/admin/attendance.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'update_status', 
                    user_id: empId, 
                    attendance_id: attendanceId, 
                    status: newStatus 
                })
            });
            const json = await res.json();
            if (json.status === 'success') {
                fetchAttendance();
            }
        } catch (ex) { console.error(ex); }
        finally { setSubmitting(null); }
    };

    const filteredRecords = useMemo(() => {
        if (!searchTerm) return records;
        const low = searchTerm.toLowerCase();
        return records.filter(r => 
            r.patient_name.toLowerCase().includes(low) || 
            r.patient_uid?.toLowerCase().includes(low) ||
            r.remarks?.toLowerCase().includes(low)
        );
    }, [records, searchTerm]);

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-200 relative overflow-hidden font-sans">
            
            {/* Branded Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/10 dark:to-transparent pointer-events-none z-0" />

            {/* Header */}
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
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">Approvals</h1>
                                {stats.pending > 0 && (
                                    <span className="bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm animate-pulse">{stats.pending} New</span>
                                )}
                            </div>
                            <p className="text-[10px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] mt-2">Attendance & Sessions</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            className="w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-gray-300"
                            placeholder="Search records..."
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        {/* Status Hub */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {[
                                { id: 'pending', label: 'Awaiting' },
                                { id: 'approved', label: 'Done' },
                                { id: 'rejected', label: 'Denied' },
                                { id: '', label: 'All' }
                            ].map(opt => (
                                <button 
                                    key={opt.id}
                                    onClick={() => setFilterStatus(opt.id as any)}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border
                                        ${filterStatus === opt.id 
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-md' 
                                            : 'bg-white/50 dark:bg-zinc-900/50 text-gray-400 border-gray-100 dark:border-white/5'}
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Branch Strip */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {[
                                { id: '', label: 'All Offices' },
                                ...branches.map(b => ({ id: b.branch_id.toString(), label: b.branch_name.split(' ')[0] }))
                            ].map(opt => (
                                <button 
                                    key={opt.id}
                                    onClick={() => setFilterBranch(opt.id)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border
                                        ${filterBranch === opt.id 
                                            ? 'bg-teal-600 text-white border-teal-500 shadow-sm' 
                                            : 'bg-white/30 dark:bg-zinc-900/30 text-gray-400 border-gray-100 dark:border-white/5'}
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* SCROLLABLE CONTENT AREA */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-40 relative z-10">

                {/* Queue List */}
                <div className="p-5 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                            <div className="w-6 h-6 border-2 border-transparent border-t-teal-500 rounded-full animate-spin" />
                            <p className="text-[9px] font-black uppercase tracking-widest italic tracking-tighter">Syncing Queue...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="py-24 text-center opacity-30">
                            <MdDoneAll size={24} className="mx-auto text-gray-300 mb-3" />
                            <h3 className="text-sm font-light italic tracking-widest text-gray-400 uppercase">Queue Clear</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredRecords.map((req, index) => (
                                <div 
                                    key={req.attendance_id} 
                                    className="bg-white dark:bg-zinc-900/40 p-5 rounded-[28px] shadow-sm border border-white dark:border-white/5 relative overflow-hidden group hover:shadow-md transition-all duration-500 animate-slide-up"
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[18px] bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex flex-col items-center justify-center font-serif italic shadow-sm relative overflow-hidden">
                                                <span className="text-base leading-none">{new Date(req.attendance_date).getDate()}</span>
                                                <span className="text-[7px] uppercase font-sans font-black tracking-widest mt-0.5 opacity-60">
                                                    {new Date(req.attendance_date).toLocaleString('en', { month: 'short' })}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">{req.patient_name}</h4>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[8px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest bg-gray-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded-lg">
                                                        #{req.patient_uid || req.patient_id}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[8px] font-bold text-teal-600 uppercase tracking-widest">
                                                        <MdBusiness size={10} /> {req.branch_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {req.status === 'pending' && (
                                                <div className={`mb-2 px-2 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-sm ${
                                                    Number(req.advance_payment) >= Number(req.treatment_cost_per_day) 
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                }`}>
                                                    {Number(req.advance_payment) >= Number(req.treatment_cost_per_day) ? (
                                                        <><MdCheckCircle size={10} /><span className="text-[8px] font-black uppercase tracking-widest">System Trust</span></>
                                                    ) : (
                                                        <><MdWarning size={10} /><span className="text-[8px] font-black uppercase tracking-widest">Low Balance</span></>
                                                    )}
                                                </div>
                                            )}
                                            <p className="text-[8px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest mb-0.5">STAMP</p>
                                            <p className="text-[9px] font-light text-gray-900 dark:text-white italic">
                                                {req.approval_request_at ? new Date(req.approval_request_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {req.remarks && (
                                        <div className="mt-4 bg-gray-50/50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-gray-100 dark:border-white/5 relative z-10">
                                            <p className="text-[10px] font-light text-gray-600 dark:text-gray-400 leading-relaxed italic line-clamp-2">
                                                "{req.remarks}"
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-4 flex gap-2 relative z-10">
                                        {req.status === 'pending' ? (
                                            <>
                                                <button 
                                                    disabled={submitting !== null}
                                                    onClick={() => handleUpdateStatus(req.attendance_id, 'approved')}
                                                    className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 h-11 rounded-[18px] text-[9px] font-black uppercase tracking-[0.2em] shadow-sm active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-2 group/btn"
                                                >
                                                    {submitting === req.attendance_id ? (
                                                        <div className="w-3 h-3 border-2 border-transparent border-t-current rounded-full animate-spin" />
                                                    ) : (
                                                        <>Verify <MdCheckCircle size={14} /></>
                                                    )}
                                                </button>
                                                <button 
                                                    disabled={submitting !== null}
                                                    onClick={() => handleUpdateStatus(req.attendance_id, 'rejected')}
                                                    className="w-11 h-11 bg-white dark:bg-zinc-900 text-gray-300 hover:text-rose-500 border border-gray-100 dark:border-white/5 flex items-center justify-center rounded-[18px] active:scale-95 transition-all"
                                                >
                                                    <MdClose size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className={`w-full py-3 rounded-[18px] flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] border ${req.status === 'present' ? 'bg-teal-500/5 text-teal-600 border-teal-500/20' : 'bg-rose-500/5 text-rose-600 border-rose-500/20'}`}>
                                                {req.status === 'present' ? <MdCheckCircle size={12} /> : <MdWarning size={12} />}
                                                {req.status === 'present' ? 'VERIFIED' : 'DENIED'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Insight Overlay (Slimmed) */}
            <div className="fixed bottom-28 left-0 right-0 flex justify-center pointer-events-none z-20 px-6">
                <div className="bg-gray-900/95 dark:bg-zinc-800/95 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white/50 border border-white/5 shadow-xl animate-fade-in-up">
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] italic">{loading ? 'Syncing...' : `Channel: ${filterStatus || 'Root'}`}</span>
                    <div className={`w-1 h-1 rounded-full ${loading ? 'bg-teal-500 animate-ping' : 'bg-white/20'}`} />
                </div>
            </div>

        </div>
    );
};

export default AttendanceApprovalScreen;
