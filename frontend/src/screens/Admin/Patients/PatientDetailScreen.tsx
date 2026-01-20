import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MdChevronLeft,
    MdPerson,
    MdPhone,
    MdEmail,
    MdLocationOn,
    MdWork,
    MdMedicalServices,
    MdTimeline,
    MdHistory,
    MdDescription,
    MdSmartButton,
    MdInfoOutline,
    MdAccessTime,
    MdLibraryBooks,
    MdCheckCircle
} from 'react-icons/md';
import { useAuthStore } from '../../../store/useAuthStore';

// Define API URLs
const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
const ADMIN_ASSETS_URL = 'https://prospine.in/admin';

interface PatientDetail {
    basic: {
        patient_id: number;
        patient_uid: string;
        name: string;
        photo: string | null;
        status: string;
        age: number;
        gender: string;
        phone: string;
        email: string;
        address: string;
        occupation?: string;
        remarks?: string;
        chief_complaint?: string;
        assigned_doctor?: string;
        created_at: string;
    };
    treatment: {
        type: string;
        days: number;
        start_date: string;
        end_date: string;
        cost_per_day: number;
        total_cost: number;
    };
    financials: {
        total_billed: number;
        paid: number;
        due: number;
        percentage: number;
    };
    attendance: {
        total_present: number;
        history: Array<{
            attendance_date: string;
            remarks: string;
        }>;
    };
    consultation: {
        notes?: string;
        prescription?: string;
        date?: string;
    }
}

const PatientDetailScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [patient, setPatient] = useState<PatientDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'overview' | 'clinical' | 'history'>('overview');

    const fetchPatientDetails = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/patient_details.php?patient_id=${id}&employee_id=${user?.employee_id || user?.id}`);
            const json = await res.json();
            if (json.status === 'success') {
                setPatient(json.data);
            } else {
                console.error(json.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        if (user) fetchPatientDetails();
    }, [fetchPatientDetails, user]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#f8fafc] dark:bg-black font-sans">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading Patient Record...</p>
            </div>
        </div>
    );

    if (!patient) return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black items-center justify-center p-6 text-center font-sans">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/10 rounded-[40px] flex items-center justify-center text-rose-500 mb-6 border border-rose-100 dark:border-rose-900/20 shadow-sm">
                <MdInfoOutline size={40} />
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Patient Not Found</h1>
            <p className="text-sm text-gray-500 max-w-[240px] leading-relaxed mb-8">This patient profile could not be reached. Please check the ID and try again.</p>
            <button onClick={() => navigate(-1)} className="px-8 py-4 bg-teal-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-md shadow-teal-500/20 active:scale-95 transition-all">Go Back</button>
        </div>
    );

    const { basic, financials, treatment, attendance } = patient;
    const progressPercent = treatment.days > 0 ? Math.min(100, Math.round((attendance.total_present / treatment.days) * 100)) : 0;

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-200 relative overflow-hidden font-sans">
            
            {/* Ambient Lighting */}
            <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-teal-600/10 via-teal-600/5 to-transparent dark:from-teal-900/20 dark:via-teal-900/10 dark:to-transparent z-0" />
            <div className="absolute top-20 -left-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

            <header className="px-6 py-4 pt-12 flex items-center justify-between sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-900 dark:text-white active:scale-90 transition-all">
                        <MdChevronLeft size={24} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest leading-none mb-1">Patient Profile</p>
                        <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter leading-none">{basic.name}</h1>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-100/50 dark:border-teal-900/30">
                    <MdSmartButton size={20} />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
                <div className="p-6 pb-12 space-y-6">

                    {/* Header Identity */}
                    <div className="flex gap-5 items-start">
                        <div className="w-24 h-24 rounded-[32px] bg-white dark:bg-zinc-900 border-4 border-white dark:border-white/10 shadow-md overflow-hidden relative group shrink-0">
                            {basic.photo ? (
                                <img src={`${ADMIN_ASSETS_URL}/${basic.photo}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-teal-500/20 bg-teal-50/30 dark:bg-teal-900/10">
                                    {basic.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 py-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-[9px] font-black uppercase tracking-widest shadow-md shadow-teal-500/20">
                                    {basic.status}
                                </div>
                                <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 text-[9px] font-black uppercase tracking-widest border border-gray-100 dark:border-white/5 shadow-sm">
                                    {basic.patient_uid || `#${basic.patient_id}`}
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter leading-[1.1] mb-3">{basic.name}</h2>
                            <div className="flex gap-2">
                                <a href={`tel:${basic.phone}`} className="h-10 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm">
                                    <MdPhone size={16} /> Call
                                </a>
                                <div className="h-10 px-4 rounded-xl bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400 border border-teal-100/50 dark:border-teal-900/30 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm">
                                    <MdEmail size={16} /> WhatsApp
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Attendance Progress */}
                        <div className="p-5 rounded-[32px] bg-gradient-to-br from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-900 text-white shadow-md relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-teal-100/60 uppercase tracking-[0.2em] mb-4">Attendance</p>
                                <div className="flex items-end gap-1 mb-2">
                                    <h3 className="text-3xl font-black leading-none">{attendance.total_present}</h3>
                                    <span className="text-[12px] font-bold text-teal-100/40 mb-1">/ {treatment.days} Days</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mt-4">
                                    <div className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${progressPercent}%` }} />
                                </div>
                                <p className="text-[10px] font-black text-teal-50/60 mt-3 uppercase">{progressPercent}% Progress</p>
                            </div>
                            <MdTimeline size={60} className="absolute -right-4 -bottom-4 text-white/5" />
                        </div>

                        {/* Financial State */}
                        <div className="p-5 rounded-[32px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden">
                            <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">Due Amount</p>
                            <div className="flex items-center gap-1.5 mb-1">
                                <h3 className={`text-2xl font-black tracking-tight ${financials.due > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {formatCurrency(financials.due)}
                                </h3>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Total: {formatCurrency(financials.total_billed)}</p>
                            <div className="mt-6 flex items-center gap-2">
                                <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${financials.due > 0 ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/10' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/10'}`}>
                                    {financials.due > 0 ? 'Pending Payment' : 'Fully Paid'}
                                </div>
                            </div>
                        </div>

                        {/* Treatment Info */}
                        <div className="col-span-2 p-5 rounded-[32px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 flex items-center justify-center text-teal-600 shadow-sm">
                                <MdMedicalServices size={28} />
                            </div>
                            <div className="flex-1 shrink-0 min-w-0">
                                <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">Treatment Plan</p>
                                <h4 className="text-[15px] font-black text-gray-900 dark:text-white truncate uppercase">{treatment.type}</h4>
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Started: {new Date(treatment.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-[18px] font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(treatment.cost_per_day)}</div>
                                <p className="text-[8px] font-black text-gray-400 uppercase mt-0.5">Rate / Day</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                        {[
                            { id: 'overview', label: 'Basic Info', icon: MdPerson },
                            { id: 'clinical', label: 'Clinical Notes', icon: MdDescription },
                            { id: 'history', label: 'Visits', icon: MdHistory }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id as any)}
                                className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                                    activeSection === tab.id 
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-900/20 dark:bg-white dark:text-black dark:border-white' 
                                    : 'bg-white dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 border-gray-100 dark:border-white/5 shadow-sm'
                                }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Section Dynamic Content */}
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        {activeSection === 'overview' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 shadow-sm">
                                        <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <MdAccessTime size={14} className="text-teal-500" /> Patient Info
                                        </p>
                                        <div className="text-[15px] font-black text-gray-900 dark:text-white uppercase leading-none">{basic.age}Y • {basic.gender}</div>
                                    </div>
                                    <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 shadow-sm">
                                        <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <MdWork size={14} className="text-teal-500" /> Occupation
                                        </p>
                                        <div className="text-[15px] font-black text-gray-900 dark:text-white uppercase truncate leading-none">{basic.occupation || 'NA'}</div>
                                    </div>
                                    <div className="col-span-2 p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 shadow-sm">
                                        <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <MdLocationOn size={14} className="text-rose-500" /> Address
                                        </p>
                                        <div className="text-[13px] font-bold text-gray-700 dark:text-zinc-300 leading-relaxed uppercase">{basic.address || 'Location Hidden'}</div>
                                    </div>
                                    <div className="col-span-2 p-5 rounded-[32px] bg-teal-50/30 dark:bg-teal-900/5 border border-teal-100/50 dark:border-teal-900/10 shadow-sm">
                                        <p className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <MdInfoOutline size={14} /> Other Details
                                        </p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                                <span className="text-gray-400">Doctor</span>
                                                <span className="text-teal-600 dark:text-teal-400">{basic.assigned_doctor}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                                <span className="text-gray-400">Registered On</span>
                                                <span className="text-gray-900 dark:text-white">{new Date(patient.consultation?.date || basic.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'clinical' && (
                            <div className="space-y-4">
                                <div className="p-6 rounded-[32px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 shadow-sm">
                                    <h3 className="text-[11px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                        <MdLibraryBooks size={18} className="text-teal-500" /> Case Summary
                                    </h3>
                                    <div className="space-y-8">
                                        <div className="relative pl-6 border-l border-teal-500/30">
                                            <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                                            <p className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-2 leading-none">Complaint</p>
                                            <p className="text-[15px] font-bold text-gray-900 dark:text-white leading-relaxed lowercase first-letter:uppercase italic">
                                                "{basic.chief_complaint || 'No complaint recorded'}"
                                            </p>
                                        </div>
                                        <div className="relative pl-6 border-l border-zinc-200 dark:border-zinc-800">
                                            <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                            <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2 leading-none">Special Observations</p>
                                            <p className="text-[14px] font-bold text-gray-600 dark:text-zinc-400 leading-relaxed lowercase first-letter:uppercase">
                                                {basic.remarks || 'No critical observations noted.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-[32px] bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md relative overflow-hidden">
                                     <h3 className="text-[11px] font-black text-white/40 dark:text-black/40 uppercase tracking-[0.3em] mb-4">Doctor's Notes</h3>
                                     <p className="text-[13px] font-bold leading-relaxed mb-4 opacity-80 italic">
                                         {patient.consultation?.notes || 'No assessment notes recorded yet.'}
                                     </p>
                                     <div className="pt-4 border-t border-white/10 dark:border-black/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                         <span>Prescription Issued</span>
                                         <MdCheckCircle size={18} className="text-teal-400 dark:text-teal-600" />
                                     </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'history' && (
                            <div className="space-y-4">
                                {attendance.history.map((item, idx) => (
                                    <div key={idx} className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 relative group cursor-default shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100/50 dark:border-teal-900/30">
                                                    <MdHistory size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">Session Record</h4>
                                                    <p className="text-[13px] font-black text-gray-900 dark:text-white tracking-tight leading-none uppercase">{new Date(item.attendance_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 flex items-center justify-center">
                                                <MdCheckCircle size={18} />
                                            </div>
                                        </div>
                                        <div className="pl-[52px]">
                                            <p className="text-[12px] font-bold text-gray-500 dark:text-zinc-400 leading-relaxed lowercase first-letter:uppercase italic">
                                                "{item.remarks || 'Session completed.'}"
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {attendance.history.length === 0 && (
                                    <div className="py-24 text-center">
                                        <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-white/5 flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-zinc-700">
                                            <MdHistory size={32} />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.3em]">No visits logged</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailScreen;
