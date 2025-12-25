import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, User, Phone, Mail, MapPin, 
    Stethoscope, Activity, FileText, Calendar, 
    CheckCircle, Clock, AlertCircle, 
    TrendingUp, Wallet, IndianRupee 
} from 'lucide-react';
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
        <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!patient) return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 items-center justify-center">
            <p className="text-gray-500">Patient not found</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-teal-600 font-bold">Go Back</button>
        </div>
    );

    const { basic, financials, treatment, attendance } = patient;
    const progressPercent = treatment.days > 0 ? Math.min(100, Math.round((attendance.total_present / treatment.days) * 100)) : 0;
    
    // Components helpers
    const TabButton = ({ active, onClick, label, icon }: any) => (
        <button 
            onClick={onClick} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wide rounded-xl transition-all duration-300
            ${active ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm scale-[1.02]' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}`}
        >
            {icon} {label}
        </button>
    );

    const Section = ({ title, icon, children }: any) => (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-[11px] font-black text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="text-teal-500">{icon}</span>
                {title}
            </h3>
            <div className="mt-2 text-sm">{children}</div>
        </div>
    );

    const InfoItem = ({ icon, label, value, className = '' }: any) => (
        <div className={`p-3 bg-gray-50 dark:bg-gray-700/30 rounded-2xl ${className}`}>
            <div className="flex items-center gap-2 mb-1.5">
                <div className="text-gray-400 dark:text-gray-500">{icon}</div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{label}</p>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white break-words leading-tight pl-1">{value || 'N/A'}</p>
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
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900 transition-colors duration-200">
            {/* Header */}
            <header className="px-6 py-4 pt-11 flex items-center justify-between sticky top-0 z-20 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 dark:text-white leading-tight truncate max-w-[150px]">{basic.name}</h1>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{basic.patient_uid || basic.patient_id}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6 no-scrollbar">
                
                {/* Hero Profile Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-1 shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-teal-500 to-emerald-600"></div>
                     <div className="relative pt-12 px-5 pb-5 flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 shadow-md mb-3 overflow-hidden">
                            {basic.photo ? (
                                <img src={`${ADMIN_URL}/${basic.photo}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : ( 
                                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
                                    {basic.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-4 border-2 ${
                            basic.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                            {basic.status}
                        </div>
                        <div className="flex gap-3 w-full">
                             <a href={`tel:${basic.phone}`} className="flex-1 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors hover:bg-teal-50 hover:text-teal-600">
                                 <Phone size={14} /> Call
                             </a>
                             <button className="flex-1 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors hover:bg-blue-50 hover:text-blue-600">
                                 <Mail size={14} /> SMS
                             </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800 rounded-2xl">
                    <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Profile" icon={<User size={14} />} />
                    <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} label="Timeline" icon={<Activity size={14} />} />
                    <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} label="Billing" icon={<Wallet size={14} />} />
                </div>

                {/* TAB CONTENT */}
                <div className="animate-in slide-in-from-bottom-5 fade-in duration-300">
                    
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-4">
                            <Section title="Basic Details" icon={<User size={14} />}>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoItem icon={<User size={14} />} label="Full Name" value={basic.name} className="col-span-2" />
                                    <InfoItem icon={<Clock size={14} />} label="Age" value={`${basic.age} Years`} />
                                    <InfoItem icon={<User size={14} />} label="Gender" value={basic.gender} />
                                    <InfoItem icon={<Phone size={14} />} label="Phone" value={basic.phone} className="col-span-2" />
                                    <InfoItem icon={<MapPin size={14} />} label="Address" value={basic.address} className="col-span-2" />
                                </div>
                            </Section>

                            <Section title="Medical Context" icon={<Stethoscope size={14} />}>
                                <div className="space-y-3">
                                    <InfoItem icon={<Stethoscope size={14} />} label="Assigned Doctor" value={basic.assigned_doctor || 'Not Assigned'} />
                                    <div className="grid grid-cols-2 gap-4">
                                         <InfoItem icon={<Activity size={14} />} label="Type" value={treatment.type} />
                                         <InfoItem icon={<AlertCircle size={14} />} label="Complaint" value={basic.chief_complaint || 'N/A'} />
                                    </div>
                                </div>
                            </Section>
                        </div>
                    )}

                    {/* TIMELINE TAB */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-6">
                            {/* Plan Overview */}
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                   <div className="flex justify-between items-start">
                                       <div>
                                           <h3 className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Active Treatment</h3>
                                           <p className="text-2xl font-black capitalize">{treatment.type}</p>
                                       </div>
                                       <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10">
                                           {treatment.days} Days Goal
                                       </div>
                                   </div>

                                   <div className="mt-8">
                                       <div className="flex justify-between text-xs font-bold text-indigo-100 mb-2">
                                           <span>Progress ({progressPercent}%)</span>
                                           <span>{attendance.total_present}/{treatment.days} Sessions</span>
                                       </div>
                                       <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                                           <div className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                                       </div>
                                   </div>

                                   <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10">
                                       <div>
                                           <p className="text-indigo-200 text-[10px] uppercase font-bold">Start Date</p>
                                           <p className="font-bold text-xs">{treatment.start_date || 'N/A'}</p>
                                       </div>
                                       <div className="text-right">
                                           <p className="text-indigo-200 text-[10px] uppercase font-bold">End Date</p>
                                           <p className="font-bold text-xs">{treatment.end_date || 'N/A'}</p>
                                       </div>
                                   </div>
                                </div>
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                            </div>

                            {/* Session History */}
                            <Section title="Session History" icon={<Calendar size={14} />}>
                                <div className="space-y-0 relative border-l-2 border-gray-100 dark:border-gray-700 ml-2">
                                    {attendance.history.slice(0, 10).map((record, i) => (
                                        <div key={i} className="pl-6 pb-6 relative last:pb-0">
                                            <div className="absolute -left-[5px] top-1.5 w-3 h-3 rounded-full bg-teal-500 border-2 border-white dark:border-gray-800"></div>
                                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">Session Completed</span>
                                                    <span className="text-[10px] font-bold text-gray-400">{record.attendance_date}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{record.remarks || 'Regular session'}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {attendance.history.length === 0 && <p className="text-sm text-gray-400 pl-6 italic">No sessions recorded.</p>}
                                </div>
                            </Section>
                        </div>
                    )}

                    {/* BILLING TAB */}
                    {activeTab === 'billing' && (
                        <div className="space-y-4">
                            {/* Total Due Card */}
                             <div className="bg-gradient-to-tr from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Dues</p>
                                            <p className="text-4xl font-black mt-1 text-red-400">₹{financials.due.toLocaleString()}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                            <Wallet size={24} className="text-white" />
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

                             <Section title="Financial Overview" icon={<TrendingUp size={14} />}>
                                 <div className="grid grid-cols-2 gap-3">
                                     <StatCard 
                                        label="Total Billed" 
                                        value={`₹${financials.total_billed.toLocaleString()}`} 
                                        colorClass="bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                                        icon={<FileText size={16} />}
                                     />
                                     <StatCard 
                                        label="Amount Paid" 
                                        value={`₹${financials.paid.toLocaleString()}`} 
                                        colorClass="bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                                        icon={<CheckCircle size={16} />}
                                     />
                                 </div>
                             </Section>
                        </div>
                    )}
                </div>
            </div>

            {/* PAY DUES MODAL */}
            {isPayModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300 mb-20 sm:mb-0">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Pay Dues</h3>
                            <button onClick={() => setPayModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold">✕</div>
                            </button>
                        </div>
                        <form onSubmit={handlePayDues} className="p-6 space-y-4">
                             <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl text-center">
                                 <p className="text-xs font-bold text-red-500 uppercase">Outstanding Amount</p>
                                 <p className="text-2xl font-black text-red-600 dark:text-red-400">₹{financials.due.toLocaleString()}</p>
                             </div>

                             <div>
                                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Amount to Pay</label>
                                 <div className="relative mt-1">
                                     <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                     <input 
                                        type="number" 
                                        required
                                        min="1"
                                        step="0.01"
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        className="w-full bg-gray-100 dark:bg-gray-700 pl-9 pr-4 py-3 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                        placeholder="0.00"
                                     />
                                 </div>
                             </div>

                             <div>
                                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Payment Mode</label>
                                 <div className="grid grid-cols-3 gap-2 mt-1">
                                     {['Cash', 'UPI', 'Card'].map(m => (
                                         <button 
                                            key={m}
                                            type="button"
                                            onClick={() => setPayMode(m.toLowerCase())}
                                            className={`py-2 rounded-xl text-xs font-bold uppercase border-2 transition-all
                                                ${payMode === m.toLowerCase() 
                                                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' 
                                                    : 'border-transparent bg-gray-100 dark:bg-gray-700 text-gray-500'}
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
                                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-teal-500/30 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                             >
                                 {paymentProcessing ? 'Processing...' : 'Confirm Payment'}
                             </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientProfileScreen;
