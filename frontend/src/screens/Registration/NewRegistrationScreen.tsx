import * as React from 'react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Camera, User, Phone, MapPin, 
    IndianRupee, AlertCircle, Upload, CheckCircle, Mail, FileText, Calendar, Clock
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

const NewRegistrationScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [timeSlots, setTimeSlots] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({
        referrers: [],
        paymentMethods: [],
        chiefComplaints: [],
        referralSources: [],
        consultationTypes: [],
        testTypes: [],
        limbTypes: [],
        staffMembers: []
    });
    
    // Fetch Settings on Mount
    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const branchId = user?.branch_id || 1;
                const res = await fetch(`${API_URL}/fetch_form_settings.php?branch_id=${branchId}`);
                const json = await res.json();
                if (json.status === 'success') {
                    setSettings(json.data);
                }
            } catch (err) {
                console.error("Failed to load form settings", err);
            }
        };
        fetchSettings();
    }, [user?.branch_id]);



    const [formData, setFormData] = useState({
        patient_name: '',
        phone: '',
        age: '',
        gender: '', // male, female, other
        address: '',
        email: '',
        occupation: '',
        chief_complaint: '',
        chief_complaint_other: '', // For manual entry if 'Other'
        referralSource: '',
        referred_by: '',
        consultation_type: '',
        appointment_date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
        appointment_time: '',
        consultation_amount: '', 
        payment_method: '',
        remarks: ''
    });

    // Fetch Time Slots
    React.useEffect(() => {
        const fetchSlots = async () => {
             try {
                const branchId = user?.branch_id || 1;
                const date = formData.appointment_date;
                const res = await fetch(`${API_URL}/fetch_available_slots.php?branch_id=${branchId}&date=${date}`);
                const json = await res.json();
                if (json.status === 'success') {
                    setTimeSlots(json.slots);
                }
            } catch (err) {
                console.error("Failed to load time slots", err);
            }
        };
        fetchSlots();
    }, [formData.appointment_date, user?.branch_id]);
    
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAlert(null);

        // Basic Validation
        if (!formData.patient_name || !formData.phone || !formData.age || !formData.gender || !formData.consultation_amount || !formData.payment_method) {
            setAlert({ type: 'error', message: 'Please fill all required fields (*)' });
            setLoading(false);
            window.scrollTo(0,0);
            return;
        }

        try {
            // Check if manual complaint
            const finalComplaint = formData.chief_complaint === 'other' || formData.chief_complaint === 'Other' 
                ? formData.chief_complaint_other 
                : formData.chief_complaint;

            const payload = {
                ...formData,
                chief_complaint: finalComplaint,
                branch_id: user?.branch_id || 1,
                employee_id: user?.id || 1,
                patient_photo_data: photoPreview // Base64 string
            };

            const res = await fetch(`${API_URL}/create_registration.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.status === 'success') {
                setAlert({ type: 'success', message: 'Registration Successful!' });
                setTimeout(() => {
                    navigate('/registration'); // Go back to list
                }, 1500);
            } else {
                setAlert({ type: 'error', message: json.message || 'Registration failed' });
                window.scrollTo(0,0);
            }
        } catch (err) {
            console.error(err);
            setAlert({ type: 'error', message: 'Network error occurred' });
            window.scrollTo(0,0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Header */}
            <header className="px-4 py-3 pt-[var(--safe-area-inset-top,32px)] flex items-center justify-between sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <ChevronLeft size={24} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">New Registration</h1>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
                
                {/* Alert Banner */}
                {alert && (
                   <div className={`p-4 rounded-xl flex items-center gap-3 ${alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                       {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                       <p className="text-sm font-bold">{alert.message}</p>
                   </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Photo Upload */}
                    <div className="flex justify-center">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-md flex items-center justify-center relative overflow-hidden cursor-pointer group active:scale-95 transition-all"
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-gray-400 group-hover:text-teal-500 transition-colors">
                                    <Camera size={32} />
                                    <span className="text-[10px] font-bold uppercase mt-1">Add Photo</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={24} className="text-white" />
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handlePhotoSelect}
                        />
                    </div>

                    {/* Section: Basic Details */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Patient Details</h3>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                             <Input 
                                icon={<User size={18} />} 
                                label="Full Name *" 
                                name="patient_name" 
                                value={formData.patient_name} 
                                onChange={handleChange}
                                placeholder="e.g. Rahul Kumar" 
                             />
                             <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    icon={<Phone size={18} />} 
                                    label="Phone *" 
                                    name="phone" 
                                    type="tel"
                                    value={formData.phone} 
                                    onChange={handleChange}
                                    placeholder="98765..." 
                                />
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Age *</label>
                                    <input 
                                        type="number" // Changed to text to match dashboard e.g. "25 years", but number is safer for database age column if int
                                        // Dashboard uses text input "25 years, 3 months". Let's stick to simple number for mobile efficiency or text if backend accepts string.
                                        // create_registration.php takes 'age'.
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        placeholder="Age"
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl font-medium border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white"
                                    />
                                </div>
                             </div>

                             <Input 
                                icon={<Mail size={18} />} 
                                label="Email" 
                                name="email" 
                                type="email"
                                value={formData.email} 
                                onChange={handleChange}
                                placeholder="name@example.com" 
                             />
                             
                             <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Gender *</label>
                                <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl">
                                    {['Male', 'Female', 'Other'].map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                                                formData.gender === g 
                                                ? 'bg-white dark:bg-gray-700 text-teal-600 shadow-sm' 
                                                : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                             </div>

                             <Input 
                                icon={<MapPin size={18} />} 
                                label="Address" 
                                name="address" 
                                value={formData.address} 
                                onChange={handleChange}
                                placeholder="Local Area / City" 
                             />
                            
                             <Input 
                                icon={<User size={18} />} 
                                label="Occupation" 
                                name="occupation" 
                                value={formData.occupation} 
                                onChange={handleChange}
                                placeholder="e.g. Student" 
                             />
                        </div>
                    </div>

                    {/* Section: Medical & Referral */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Medical & Referral</h3>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                             
                             {/* Chief Complaint Dropdown */}
                             <div className="space-y-1.5">
                                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Chief Complaint * (Dynamic)</label>
                                 <select
                                     name="chief_complaint"
                                     value={formData.chief_complaint}
                                     onChange={handleChange}
                                     className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl font-medium border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                 >
                                    <option value="">Select Condition</option>
                                    {settings.chiefComplaints.map((c: any) => (
                                        <option key={c.complaint_code} value={c.complaint_code}>{c.complaint_name}</option>
                                    ))}
                                    <option value="other">Other</option>
                                 </select>
                                 {(formData.chief_complaint === 'other' || formData.chief_complaint === 'Other') && (
                                     <input 
                                        type="text" 
                                        name="chief_complaint_other" 
                                        placeholder="Specify Condition" 
                                        value={formData.chief_complaint_other}
                                        onChange={handleChange}
                                        className="w-full p-3 mt-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl font-medium border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                     />
                                 )}
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Type *</label>
                                    <select
                                        name="consultation_type"
                                        value={formData.consultation_type}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl font-medium border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                    >
                                        <option value="">Select Type</option>
                                        {settings.consultationTypes.map((t: any) => (
                                            <option key={t.consultation_code} value={t.consultation_code}>{t.consultation_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Source</label>
                                    <select
                                        name="referralSource"
                                        value={formData.referralSource}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl font-medium border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                    >
                                        <option value="">Select Source</option>
                                        {settings.referralSources.map((s: any) => (
                                            <option key={s.source_code} value={s.source_code}>{s.source_name}</option>
                                        ))}
                                    </select>
                                </div>
                             </div>

                             <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Referred By</label>
                                <input 
                                    list="referrers-list" 
                                    name="referred_by"
                                    value={formData.referred_by} 
                                    onChange={handleChange}
                                    placeholder="Type or select a doctor" 
                                    className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl font-medium border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white placeholder:text-gray-400"
                                />
                                <datalist id="referrers-list">
                                    {settings.referrers.map((ref: string) => (
                                        <option key={ref} value={ref} />
                                    ))}
                                </datalist>
                             </div>
                        </div>
                    </div>

                    {/* Section: Appointment */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Appointment</h3>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                             <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    icon={<Calendar size={18} />} 
                                    label="Date *" 
                                    name="appointment_date" 
                                    type="date"
                                    value={formData.appointment_date} 
                                    onChange={handleChange}
                                />
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Time Slot *</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                            <Clock size={18} />
                                        </div>
                                        <select
                                            name="appointment_time"
                                            value={formData.appointment_time}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl font-medium border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        >
                                            <option value="">Select Time</option>
                                            {timeSlots.map((slot: any) => (
                                                <option key={slot.time} value={slot.time} disabled={slot.is_booked}>
                                                    {slot.label} {slot.is_booked ? '(Booked)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Section: Payment */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Payment</h3>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                             <Input 
                                icon={<IndianRupee size={18} />} 
                                label="Amount *" 
                                name="consultation_amount" 
                                type="number"
                                value={formData.consultation_amount} 
                                onChange={handleChange}
                                placeholder="Enter Amount" 
                             />
                             
                             <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Payment Method *</label>
                                <div className="grid grid-cols-2 gap-2">
                                     {settings.paymentMethods.length > 0 ? settings.paymentMethods.map((m: any) => (
                                         <button
                                            key={m.method_code}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, payment_method: m.method_code }))}
                                            className={`py-2 px-3 rounded-lg text-xs font-bold uppercase border transition-all ${
                                                formData.payment_method === m.method_code 
                                                ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' 
                                                : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100 dark:bg-gray-900/30'
                                            }`}
                                         >
                                             {m.method_name}
                                         </button>
                                     )) : (
                                         <p className="col-span-2 text-xs text-gray-400">Loading methods...</p>
                                     )}
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Section: Remarks */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <Input 
                            icon={<FileText size={18} />} 
                            label="Remarks / Notes" 
                            name="remarks" 
                            value={formData.remarks} 
                            onChange={handleChange}
                            placeholder="Any additional notes..." 
                        />
                    </div>
                
                    {/* Submit Button */}
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-teal-500/30 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98] transition-all"
                    >
                        {loading ? 'Creating Registration...' : 'Register Patient'}
                    </button>

                </form>
            </div>
        </div>
    );
};

const Input = ({ label, icon, className = '', ...props }: any) => (
    <div className={`space-y-1.5 ${className}`}>
        <label className="text-xs font-bold text-gray-500 uppercase ml-1">{label}</label>
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                {icon}
            </div>
            <input 
                {...props}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl font-medium border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white placeholder:text-gray-400"
            />
        </div>
    </div>
);

export default NewRegistrationScreen;
