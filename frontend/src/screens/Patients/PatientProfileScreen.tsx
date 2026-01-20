import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, 
    MdPhone, 
    MdEmail, 
    MdLocationOn, 
    MdMedicalServices, 
    MdEventNote, 
    MdTimeline, 
    MdReceiptLong, 
    MdAccountBalanceWallet,
    MdCheckCircle,
    MdWarning,
    MdPerson,
    MdClose,
    MdPayment,
    MdMonitorHeart
} from 'react-icons/md';
import { useAuthStore } from '../../store/useAuthStore';

// Define API URLs
const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
const ADMIN_URL = 'https://prospine.in/admin';

// Types
interface PatientDetail {
  basic: {
    patient_id: string;
    patient_uid: string;
    name: string;
    photo: string | null;
    status: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
    address: string;
    assigned_doctor: string;
    occupation?: string;
    created_at?: string;
    referral?: string;
    chief_complaint?: string;
    remarks?: string;
  };
  financials: {
    total_billed: number;
    paid: number;
    due: number;
    percentage: number;
  };
  treatment: {
    type: string;
    days: number;
    start_date: string;
    end_date: string;
    cost_per_day?: number;
  };
  attendance: {
    total_present: number;
    history: any[];
  };
}

const PatientProfileScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const [patient, setPatient] = useState<PatientDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [isPayModalOpen, setPayModalOpen] = useState(false);
    
    // Payment State
    const [payAmount, setPayAmount] = useState('');
    const [payMode, setPayMode] = useState('cash');
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    const fetchPatientDetails = async () => {
        try {
            const res = await fetch(`${API_URL}/patient_details.php?patient_id=${id}&branch_id=${user?.role === 'admin' ? 1 : 1}`);
            const json = await res.json();
            if (json.status === 'success') {
                setPatient(json.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatientDetails();
    }, [id]);

    const handlePayDues = async (e: React.FormEvent) => {
        e.preventDefault();
        setPaymentProcessing(true);
        try {
            const res = await fetch(`${API_URL}/add_payment.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: id,
                    amount: parseFloat(payAmount),
                    mode: payMode,
                    remarks: 'Mobile App Payment',
                    employee_id: user?.id || 1
                })
            });
            const json = await res.json();
            if (json.status === 'success') {
                setPayModalOpen(false);
                setPayAmount('');
                alert('Payment Successful!');
                fetchPatientDetails(); // Refresh data
            } else {
                alert('Payment Failed: ' + json.message);
            }
        } catch (err) {
            alert('Error processing payment');
        } finally {
            setPaymentProcessing(false);
        }
    };

    if (loading) return (
        <div className="flex h-full items-center justify-center bg-surface dark:bg-gray-950">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!patient) return (
        <div className="flex flex-col h-full bg-surface dark:bg-gray-950 items-center justify-center">
            <p className="text-outline">Patient not found</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-primary font-bold">Go Back</button>
        </div>
    );

    const { basic, financials, treatment, attendance } = patient;
    const progressPercent = treatment.days > 0 ? Math.min(100, Math.round((attendance.total_present / treatment.days) * 100)) : 0;
    
    // Components helpers
    const TabButton = ({ active, onClick, label, icon }: any) => (
        <button 
            onClick={onClick} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wide rounded-full transition-all duration-300
            ${active ? 'bg-primary text-on-primary shadow-sm' : 'text-outline dark:text-gray-400 hover:bg-surface-variant'}`}
        >
            {icon} {label}
        </button>
    );

    const Section = ({ title, icon, children }: any) => (
        <div className="bg-white dark:bg-gray-900 rounded-[20px] p-5 shadow-sm border border-outline-variant/10 dark:border-gray-800">
            <h3 className="text-[11px] font-bold text-outline dark:text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant/10 dark:border-gray-800 pb-2">
                <span className="text-primary">{icon}</span>
                {title}
            </h3>
            <div className="mt-2 text-sm">{children}</div>
        </div>
    );


    const StatCard = ({ label, value, colorClass, icon }: any) => (
         <div className={`rounded-2xl p-4 border flex justify-between items-center ${colorClass}`}>
            <div>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black mt-1">{value}</p>
            </div>
            {icon}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-surface dark:bg-gray-950 transition-colors duration-200 font-sans">
            {/* Header */}
            <header className="px-5 py-4 pt-11 flex items-center justify-between sticky top-0 z-20 bg-surface/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-outline-variant/10 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-surface-variant/40 hover:bg-surface-variant/60 dark:bg-gray-800 flex items-center justify-center text-on-surface dark:text-gray-200 transition-colors">
                        <MdArrowBack size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-on-surface dark:text-white leading-tight truncate max-w-[200px]">{basic.name}</h1>
                        <span className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-widest">#{basic.patient_uid || basic.patient_id}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-6 no-scrollbar">
                
                {/* Hero Profile Card */}
                <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 text-center shadow-sm border border-outline-variant/10 dark:border-gray-800 relative overflow-hidden">
                     {/* Decorative Gradients */}
                     <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl"></div>
                     <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-secondary/10 blur-2xl"></div>

                     <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 rounded-[2rem] border-4 border-surface dark:border-gray-950 bg-surface-variant shadow-lg mb-4 overflow-hidden flex items-center justify-center relative">
                            {basic.photo ? (
                                <img src={`${ADMIN_URL}/${basic.photo}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : ( 
                                <span className="text-4xl font-bold text-outline/50">{basic.name.charAt(0)}</span>
                            )}
                            <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-white dark:border-gray-900 ${basic.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>
                        
                        <div className="flex gap-2 mb-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                basic.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                                {basic.status}
                            </span>
                             <span className="px-3 py-1 rounded-full bg-surface-variant/50 dark:bg-gray-800 text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">
                                {basic.gender}, {basic.age}y
                            </span>
                        </div>

                        <div className="flex gap-3 w-full max-w-xs">
                             <a href={`tel:${basic.phone}`} className="flex-1 py-3 rounded-2xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-sm shadow-primary/25">
                                 <MdPhone size={16} /> Call
                             </a>
                             <button className="flex-1 py-3 rounded-2xl bg-secondary-container dark:bg-gray-800 text-on-secondary-container dark:text-gray-200 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-80 transition-all active:scale-95">
                                 <MdEmail size={16} /> SMS
                             </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-surface-variant/30 dark:bg-gray-800 rounded-full">
                    <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Details" icon={<MdPerson size={16} />} />
                    <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} label="Timeline" icon={<MdTimeline size={16} />} />
                    <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} label="Billing" icon={<MdAccountBalanceWallet size={16} />} />
                </div>

                {/* TAB CONTENT */}
                <div className="animate-fade-in">
                    
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-5">
                            {/* Contact Information Card */}
                            <div className="bg-white dark:bg-gray-900 rounded-[24px] p-5 shadow-sm border border-outline-variant/10 dark:border-gray-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
                                <h3 className="text-sm font-bold text-on-surface dark:text-white mb-4 flex items-center gap-2 relative z-10">
                                    <div className="p-1.5 bg-primary/10 dark:bg-primary/20 rounded-lg">
                                        <MdPerson size={16} className="text-primary" />
                                    </div>
                                    Contact Information
                                </h3>
                                <div className="space-y-3 relative z-10">
                                    <div className="flex items-center gap-3 p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                                            <MdPerson size={18} className="text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Full Name</p>
                                            <p className="text-sm font-bold text-on-surface dark:text-white truncate">{basic.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700">
                                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                            <MdPhone size={18} className="text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Phone Number</p>
                                            <a href={`tel:${basic.phone}`} className="text-sm font-bold text-green-600 dark:text-green-400 hover:underline">{basic.phone}</a>
                                        </div>
                                    </div>

                                    {basic.email && (
                                        <div className="flex items-center gap-3 p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                                <MdEmail size={18} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Email</p>
                                                <p className="text-sm font-bold text-on-surface dark:text-white truncate">{basic.email}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                            <MdLocationOn size={18} className="text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Address</p>
                                            <p className="text-sm font-bold text-on-surface dark:text-white leading-tight">{basic.address}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Details Card */}
                            <div className="bg-white dark:bg-gray-900 rounded-[24px] p-5 shadow-sm border border-outline-variant/10 dark:border-gray-800">
                                <h3 className="text-sm font-bold text-on-surface dark:text-white mb-4 flex items-center gap-2">
                                    <div className="p-1.5 bg-secondary/10 dark:bg-secondary/20 rounded-lg">
                                        <MdEventNote size={16} className="text-secondary" />
                                    </div>
                                    Personal Details
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {basic.occupation && (
                                        <div className="p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <MdMedicalServices size={14} className="text-outline dark:text-gray-500" />
                                                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Occupation</p>
                                            </div>
                                            <p className="text-sm font-bold text-on-surface dark:text-white">{basic.occupation}</p>
                                        </div>
                                    )}

                                    {basic.created_at && (
                                        <div className="p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <MdEventNote size={14} className="text-outline dark:text-gray-500" />
                                                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Registered</p>
                                            </div>
                                            <p className="text-sm font-bold text-on-surface dark:text-white">{new Date(basic.created_at).toLocaleDateString('en-IN')}</p>
                                        </div>
                                    )}

                                    {basic.referral && (
                                        <div className="p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700 col-span-2">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <MdPerson size={14} className="text-outline dark:text-gray-500" />
                                                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Referred By</p>
                                            </div>
                                            <p className="text-sm font-bold text-on-surface dark:text-white">{basic.referral}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Medical Information Card */}
                            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 rounded-[24px] p-5 shadow-sm border border-primary/20 dark:border-primary/30">
                                <h3 className="text-sm font-bold text-on-surface dark:text-white mb-4 flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/20 dark:bg-primary/30 rounded-lg">
                                        <MdMedicalServices size={16} className="text-primary" />
                                    </div>
                                    Medical Information
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-900/60 rounded-2xl backdrop-blur-sm border border-white/50 dark:border-gray-800">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                                            <MdPerson size={18} className="text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Assigned Doctor</p>
                                            <p className="text-sm font-bold text-on-surface dark:text-white">{basic.assigned_doctor || 'Not Assigned'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-900/60 rounded-2xl backdrop-blur-sm border border-white/50 dark:border-gray-800">
                                        <div className="w-10 h-10 rounded-xl bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center shrink-0">
                                            <MdMonitorHeart size={18} className="text-secondary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Treatment Type</p>
                                            <p className="text-sm font-bold text-on-surface dark:text-white capitalize">{treatment.type}</p>
                                        </div>
                                    </div>

                                    {basic.chief_complaint && (
                                        <div className="p-4 bg-white/60 dark:bg-gray-900/60 rounded-2xl backdrop-blur-sm border border-white/50 dark:border-gray-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MdWarning size={14} className="text-amber-600 dark:text-amber-400" />
                                                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Chief Complaint</p>
                                            </div>
                                            <p className="text-sm font-bold text-on-surface dark:text-white leading-relaxed">{basic.chief_complaint}</p>
                                        </div>
                                    )}

                                    {basic.remarks && (
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/30">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MdEventNote size={14} className="text-amber-600 dark:text-amber-400" />
                                                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Remarks</p>
                                            </div>
                                            <p className="text-sm font-bold text-amber-900 dark:text-amber-200 leading-relaxed">{basic.remarks}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TIMELINE TAB */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-6">
                            {/* Plan Overview */}
                            <div className="bg-gradient-to-br from-primary to-primary-container rounded-[24px] p-6 text-on-primary-container shadow-lg relative overflow-hidden">
                                <div className="relative z-10 text-white">
                                   <div className="flex justify-between items-start">
                                       <div>
                                           <h3 className="opacity-80 text-xs font-bold uppercase tracking-wider mb-1">Active Treatment</h3>
                                           <p className="text-2xl font-black capitalize">{treatment.type}</p>
                                       </div>
                                       <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10">
                                           {treatment.days} Days Goal
                                       </div>
                                   </div>

                                   <div className="mt-8">
                                       <div className="flex justify-between text-xs font-bold opacity-90 mb-2">
                                           <span>Progress ({progressPercent}%)</span>
                                           <span>{attendance.total_present}/{treatment.days} Sessions</span>
                                       </div>
                                       <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                                           <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                                       </div>
                                   </div>

                                   <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10">
                                       <div>
                                           <p className="opacity-70 text-[10px] uppercase font-bold">Start Date</p>
                                           <p className="font-bold text-xs">{treatment.start_date || 'N/A'}</p>
                                       </div>
                                       <div className="text-right">
                                           <p className="opacity-70 text-[10px] uppercase font-bold">End Date</p>
                                           <p className="font-bold text-xs">{treatment.end_date || 'N/A'}</p>
                                       </div>
                                   </div>
                                </div>
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                            </div>

                            {/* Session History */}
                            <Section title="Session History" icon={<MdTimeline size={16} />}>
                                <div className="space-y-0 relative border-l-2 border-outline-variant/20 dark:border-gray-800 ml-2">
                                    {attendance.history.slice(0, 10).map((record, i) => (
                                        <div key={i} className="pl-6 pb-6 relative last:pb-0">
                                            <div className="absolute -left-[5px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-white dark:border-gray-900"></div>
                                            <div className="bg-surface-variant/30 dark:bg-gray-800 p-3 rounded-xl border border-outline-variant/10">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-on-surface dark:text-white">Session Completed</span>
                                                    <span className="text-[10px] font-bold text-outline">{record.attendance_date}</span>
                                                </div>
                                                <p className="text-xs text-outline dark:text-gray-400">{record.remarks || 'Regular session'}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {attendance.history.length === 0 && <p className="text-sm text-outline pl-6 italic">No sessions recorded.</p>}
                                </div>
                            </Section>
                        </div>
                    )}

                    {/* BILLING TAB */}
                    {activeTab === 'billing' && (
                        <div className="space-y-4">
                            {/* Total Due Card */}
                             <div className="bg-gray-900 dark:bg-black rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Dues</p>
                                            <p className="text-4xl font-black mt-1 text-error">₹{financials.due.toLocaleString()}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                            <MdAccountBalanceWallet size={24} className="text-white" />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setPayModalOpen(true)}
                                        className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors shadow-lg active:scale-95 transform duration-200"
                                    >
                                        Pay Dues Now
                                    </button>
                                </div>
                             </div>

                             <Section title="Financial Overview" icon={<MdReceiptLong size={16} />}>
                                 <div className="grid grid-cols-2 gap-3">
                                     <StatCard 
                                        label="Total Billed" 
                                        value={`₹${financials.total_billed.toLocaleString()}`} 
                                        colorClass="bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-300"
                                        icon={<MdReceiptLong size={16} />}
                                     />
                                     <StatCard 
                                        label="Amount Paid" 
                                        value={`₹${financials.paid.toLocaleString()}`} 
                                        colorClass="bg-green-50 border-green-100 text-green-700 dark:bg-green-900/10 dark:border-green-800 dark:text-green-300"
                                        icon={<MdCheckCircle size={16} />}
                                     />
                                 </div>
                             </Section>
                        </div>
                    )}
                </div>
            </div>

            {/* PAY DUES MODAL (Bottom Sheet) */}
            {isPayModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div 
                        className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden animate-slide-up-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-lg font-black text-on-surface dark:text-white">Pay Dues</h3>
                            <button onClick={() => setPayModalOpen(false)} className="text-outline hover:text-on-surface p-2">
                                <MdClose size={24} />
                            </button>
                        </div>
                        <form onSubmit={handlePayDues} className="p-6 space-y-5">
                             <div className="bg-error-container/30 dark:bg-red-900/20 p-4 rounded-2xl text-center border border-error-container/50">
                                 <p className="text-xs font-bold text-error uppercase mb-1">Outstanding Amount</p>
                                 <p className="text-3xl font-black text-error">₹{financials.due.toLocaleString()}</p>
                             </div>

                             <div>
                                 <label className="text-xs font-bold text-outline uppercase ml-1 block mb-1.5">Amount to Pay</label>
                                 <div className="relative">
                                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-outline">₹</span>
                                     <input 
                                        type="number" 
                                        required
                                        min="1"
                                        step="0.01"
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        className="w-full bg-surface-variant/40 dark:bg-gray-800 pl-8 pr-4 py-4 rounded-2xl font-black text-lg text-on-surface dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="0.00"
                                     />
                                 </div>
                             </div>

                             <div>
                                 <label className="text-xs font-bold text-outline uppercase ml-1 block mb-1.5">Payment Mode</label>
                                 <div className="grid grid-cols-3 gap-3">
                                     {['Cash', 'UPI', 'Card'].map(m => (
                                         <button 
                                            key={m}
                                            type="button"
                                            onClick={() => setPayMode(m.toLowerCase())}
                                            className={`py-3 rounded-2xl text-xs font-bold uppercase border transition-all duration-200
                                                ${payMode === m.toLowerCase() 
                                                    ? 'border-primary bg-primary/10 text-primary dark:text-primary-container' 
                                                    : 'border-outline-variant/30 bg-transparent text-outline hover:bg-surface-variant/50'}
                                            `}
                                         >
                                             {m}
                                         </button>
                                     ))}
                                 </div>
                             </div>

                             <button 
                                disabled={paymentProcessing}
                                type="submit" 
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-on-primary rounded-2xl font-bold uppercase tracking-wider shadow-lg shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
                             >
                                 {paymentProcessing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                 ) : (
                                    <>
                                        <MdPayment size={18} /> Confirm Payment
                                    </>
                                 )}
                             </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientProfileScreen;
