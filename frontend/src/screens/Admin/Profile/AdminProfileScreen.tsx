import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdEdit,
    MdEmail,
    MdLocationOn,
    MdBadge,
    MdPhone,
    MdCalendarToday,
    MdShield,
    MdCheckCircle,
    MdVpnKey,
    MdBusiness,
    MdLightMode,
    MdDarkMode,
    MdArrowBack,
    MdClose,
    MdLockOutline
} from 'react-icons/md';
import { useTheme } from '../../../hooks/useTheme';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
const ADMIN_URL = 'https://prospine.in/admin';

interface ProfileData {
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  job_title: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  date_of_joining: string;
  email: string;
  role: string;
  is_active: number;
  photo_path: string;
  branch_name: string;
  city: string;
  address_line_1: string;
}

interface Branch {
    branch_id: number;
    branch_name: string;
}

const AdminProfileScreen: React.FC = () => {
    const { user } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);

    // Password Modal State
    const [showPassModal, setShowPassModal] = useState(false);
    const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });
    const [passLoading, setPassLoading] = useState(false);
    const [passError, setPassError] = useState('');

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const empId = (user as any).employee_id || user.id;
            const profileRes = await fetch(`${API_URL}/profile.php?employee_id=${empId}`);
            const profileJson = await profileRes.json();
            if (profileJson.status === 'success') {
                setProfile(profileJson.data);
            }

            const branchRes = await fetch(`${API_URL}/admin/my_branches.php?employee_id=${empId}`);
            const branchJson = await branchRes.json();
            if (branchJson.status === 'success') {
                setBranches(branchJson.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassError('');
        
        if (passData.new !== passData.confirm) {
            setPassError('New passwords do not match');
            return;
        }
        if (passData.new.length < 6) {
            setPassError('Password must be at least 6 characters');
            return;
        }

        setPassLoading(true);
        try {
            const res = await fetch(`${API_URL}/change_password.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: (user as any).employee_id || user?.id,
                    old_password: passData.old,
                    new_password: passData.new
                })
            });
            const json = await res.json();
            if (json.status === 'success') {
                alert('Password updated successfully');
                setShowPassModal(false);
                setPassData({ old: '', new: '', confirm: '' });
            } else {
                setPassError(json.message || 'Failed to update password');
            }
        } catch (err) {
            setPassError('Connection error. Please try again.');
        } finally {
            setPassLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-gray-950">
                <div className="w-6 h-6 border-2 border-gray-100 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Header Gradient Overlay */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/10 dark:to-transparent pointer-events-none z-0" />

            {/* Sticky Header */}
            <header className="px-6 py-6 pt-12 flex items-center justify-between z-30 relative">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-500 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                    >
                        <MdArrowBack size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">Profile Info</h1>
                    </div>
                </div>
                
                <button 
                    onClick={toggleTheme} 
                    className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                >
                    {theme === 'dark' ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
                </button>
            </header>

            <main className="flex-1 px-6 overflow-y-auto no-scrollbar pb-32 z-10 relative">
                
                {/* Profile Banner Section */}
                <section className="mt-4 mb-8">
                    <div className="bg-[#00796B] rounded-[40px] p-8 shadow-[0_12px_40px_rgba(0,121,107,0.15)] text-white relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[60px]" />
                        
                        <div className="relative z-10 flex flex-col items-center text-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-[32px] p-1 bg-white/20 backdrop-blur-md shadow-xl">
                                    <div className="w-full h-full rounded-[28px] bg-white overflow-hidden flex items-center justify-center">
                                        {profile.photo_path ? (
                                            <img src={`${ADMIN_URL}/${profile.photo_path}`} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl font-light text-teal-600 uppercase">{profile.full_name?.charAt(0)}</span>
                                        )}
                                    </div>
                                </div>
                                <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-teal-600 rounded-xl shadow-lg flex items-center justify-center border-4 border-teal-700">
                                    <MdEdit size={14} />
                                </button>
                            </div>

                            <div className="space-y-4 w-full">
                                <div>
                                    <h2 className="text-3xl font-light tracking-tight">{profile.full_name}</h2>
                                    <div className="mt-2 inline-flex items-center px-4 py-1 bg-white/10 rounded-full border border-white/5">
                                        <span className="text-[10px] font-medium uppercase tracking-[0.2em]">{profile.role}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-2">
                                    <div className="flex items-center justify-center gap-2 text-[11px] text-white/70 font-medium tracking-wide">
                                        <MdEmail size={14} />
                                        {profile.email}
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-[11px] text-white/70 font-medium tracking-wide">
                                        <MdLocationOn size={14} />
                                        {profile.city || 'Unknown Location'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Information Sections */}
                <div className="flex flex-col gap-6">
                    
                    {/* Basic Info Pill Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-[36px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400 flex items-center justify-center">
                                <MdBadge size={18} />
                            </div>
                            <h3 className="text-base font-light text-gray-900 dark:text-white tracking-tight">Professional Details</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <InfoRow label="Employee ID" value={profile.employee_id} icon={<MdBadge size={14} />} />
                            <InfoRow label="Phone Contact" value={profile.phone_number} icon={<MdPhone size={14} />} />
                            <InfoRow label="Resident Address" value={profile.address} icon={<MdLocationOn size={14} />} />
                            <InfoRow label="Joined Date" value={profile.date_of_joining} icon={<MdCalendarToday size={14} />} />
                        </div>
                    </div>

                    {/* Managed Branches Section */}
                    <div className="bg-white dark:bg-gray-900 rounded-[36px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-500 flex items-center justify-center">
                                    <MdBusiness size={18} />
                                </div>
                                <h3 className="text-base font-light text-gray-900 dark:text-white tracking-tight">Operations</h3>
                            </div>
                            <span className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">{branches.length} Assigned</span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {branches.length > 0 ? branches.map(branch => (
                                <div key={branch.branch_id} className="p-5 rounded-[24px] border border-gray-50 dark:border-gray-800 bg-[#f8fafc] dark:bg-gray-950/50 flex items-center justify-between group transition-all active:scale-[0.98]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-teal-500 shadow-sm border border-gray-100/50 dark:border-gray-700">
                                            <MdBusiness size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">{branch.branch_name}</h4>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Primary Center</p>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-medium text-gray-400">#{branch.branch_id}</div>
                                </div>
                            )) : (
                                <p className="text-xs text-center text-gray-400 py-4 font-light">No branches assigned to your account</p>
                            )}
                        </div>
                    </div>

                    {/* Security Pill Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-[36px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-400 flex items-center justify-center">
                                <MdShield size={18} />
                            </div>
                            <h3 className="text-base font-light text-gray-900 dark:text-white tracking-tight">Security & Privacy</h3>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-[20px] border border-emerald-100/50 dark:border-emerald-900/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <MdCheckCircle size={18} className="text-emerald-500" />
                                    <span className="text-[11px] font-medium text-emerald-600">Account Verified</span>
                                </div>
                                <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest px-2 py-0.5 bg-white dark:bg-emerald-900/30 rounded-full shadow-sm">Active</span>
                            </div>

                            <button 
                                onClick={() => setShowPassModal(true)}
                                className="w-full flex items-center justify-between p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 bg-[#f8fafc] dark:bg-gray-950/50 group active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-rose-400 shadow-sm border border-gray-100/50 dark:border-gray-700">
                                        <MdVpnKey size={18} />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Reset Credentials</h4>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Last changed 2mo ago</p>
                                    </div>
                                </div>
                                <MdArrowBack className="text-gray-300 rotate-180" size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="py-10 text-center">
                    <p className="text-[10px] font-medium text-gray-300 uppercase tracking-[0.4em]">Physio EZ • v3.0.0</p>
                </div>
            </main>

            {/* Password Reset Modal */}
            {showPassModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => !passLoading && setShowPassModal(false)} />
                    
                    <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl animate-scale-in border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h3 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">Change Password</h3>
                            <button onClick={() => setShowPassModal(false)} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-colors"><MdClose size={24} /></button>
                        </div>

                        <form onSubmit={handlePasswordChange} className="p-8 pt-4 space-y-6">
                            {passError && <p className="text-[11px] text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl border border-red-100 dark:border-red-900/30 font-medium text-center">{passError}</p>}
                            
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-2">Current Password</label>
                                    <div className="relative">
                                        <input 
                                            type="password"
                                            required
                                            value={passData.old}
                                            onChange={e => setPassData({...passData, old: e.target.value})}
                                            className="w-full h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl px-12 text-sm focus:ring-2 focus:ring-teal-500/20 border-none outline-none transition-all dark:text-white"
                                            placeholder="••••••••"
                                        />
                                        <MdLockOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-2">New Password</label>
                                    <div className="relative">
                                        <input 
                                            type="password"
                                            required
                                            value={passData.new}
                                            onChange={e => setPassData({...passData, new: e.target.value})}
                                            className="w-full h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl px-12 text-sm focus:ring-2 focus:ring-teal-500/20 border-none outline-none transition-all dark:text-white"
                                            placeholder="••••••••"
                                        />
                                        <MdLockOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-2">Confirm Password</label>
                                    <div className="relative">
                                        <input 
                                            type="password"
                                            required
                                            value={passData.confirm}
                                            onChange={e => setPassData({...passData, confirm: e.target.value})}
                                            className="w-full h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl px-12 text-sm focus:ring-2 focus:ring-teal-500/20 border-none outline-none transition-all dark:text-white"
                                            placeholder="••••••••"
                                        />
                                        <MdLockOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={passLoading}
                                className="w-full h-14 bg-[#00796B] text-white rounded-[24px] text-sm font-medium uppercase tracking-[0.2em] shadow-lg shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
                            >
                                {passLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'Update Security'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoRow = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest opacity-80">{label}</label>
        <div className="flex items-center gap-3">
            <div className="text-gray-300 dark:text-gray-600">{icon}</div>
            <span className="text-sm font-light text-gray-800 dark:text-white leading-tight">{value || 'Not Disclosed'}</span>
        </div>
    </div>
);

export default AdminProfileScreen;
