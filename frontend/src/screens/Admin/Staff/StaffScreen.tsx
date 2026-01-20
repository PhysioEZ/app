import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdPeople, 
    MdAdd, 
    MdSearch, 
    MdFilterList, 
    MdEmail, 
    MdPhone, 
    MdWork, 
    MdLocationOn, 
    MdVerified, 
    MdErrorOutline,
    MdClose,
    MdSave,
    MdShield,
    MdBusiness,
    MdLock,
    MdArrowForward,
    MdTrendingUp,
    MdChevronLeft
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface Employee {
    employee_id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    role_id: number;
    role_name: string;
    branch_id: number;
    branch_name: string;
    is_active: number;
    job_title?: string;
    address?: string;
    date_of_joining?: string;
}

interface StaffFormData {
    employee_id?: number | null;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    role_id: string;
    branch_id: string;
    job_title: string;
    address: string;
    password?: string;
    is_active: number;
}

const initialForm: StaffFormData = {
    first_name: '', last_name: '', email: '', phone_number: '', 
    role_id: '', branch_id: '', job_title: '', address: '', 
    password: '', is_active: 1
};

const StaffScreen: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [staff, setStaff] = useState<Employee[]>([]);
    const [filteredStaff, setFilteredStaff] = useState<Employee[]>([]);
    const [roles, setRoles] = useState<{role_id: number, role_name: string}[]>([]);
    const [branches, setBranches] = useState<{branch_id: number, branch_name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState<StaffFormData>(initialForm);

    const fetchStaff = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const empId = user.employee_id || user.id;
            const res = await fetch(`${API_URL}/admin/staff.php?action=fetch_staff&user_id=${empId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setStaff(json.data);
                setRoles(json.roles);
                setBranches(json.branches);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    useEffect(() => {
        let res = staff;
        if (search) {
            const low = search.toLowerCase();
            res = res.filter(s => 
                `${s.first_name} ${s.last_name}`.toLowerCase().includes(low) || 
                s.email.toLowerCase().includes(low)
            );
        }
        if (filterRole) res = res.filter(s => s.role_id.toString() === filterRole);
        if (filterBranch) res = res.filter(s => s.branch_id?.toString() === filterBranch);
        setFilteredStaff(res);
    }, [staff, search, filterRole, filterBranch]);

    const handleAdd = () => {
        setFormData(initialForm);
        setShowModal(true);
    };

    const handleEdit = (emp: Employee) => {
        setFormData({
            employee_id: emp.employee_id,
            first_name: emp.first_name,
            last_name: emp.last_name,
            email: emp.email,
            phone_number: emp.phone_number || '',
            role_id: emp.role_id.toString(),
            branch_id: emp.branch_id?.toString() || '',
            job_title: emp.job_title || '',
            address: emp.address || '',
            password: '', 
            is_active: emp.is_active
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!user) return;
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.role_id) {
            alert('Core identity fields are required');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const empId = user.employee_id || user.id;
            const action = formData.employee_id ? 'update_staff' : 'create_staff';
            
            const res = await fetch(`${API_URL}/admin/staff.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    user_id: empId,
                    ...formData
                })
            });
            const json = await res.json();
            
            if (json.status === 'success') {
                setShowModal(false);
                fetchStaff();
            } else {
                alert(json.message);
            }
        } catch (e) {
            console.error(e);
            alert('Communication failure');
        } finally {
            setIsSubmitting(false);
        }
    };

    const branchStats = useMemo(() => {
        const stats: Record<string, number> = {};
        staff.forEach(emp => {
            const b = emp.branch_name || 'Global';
            stats[b] = (stats[b] || 0) + 1;
        });
        return stats;
    }, [staff]);

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-200 relative overflow-hidden font-sans">
            
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
                            <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">Staff Roster</h1>
                            <p className="text-[10px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] mt-2">Team & Permissions</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleAdd}
                        className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xl shadow-teal-500/20 active:scale-90 transition-all"
                    >
                        <MdAdd size={28} />
                    </button>
                </div>

                <div className="relative">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        className="w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-gray-400"
                        placeholder="Search team members..."
                        value={search} onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    <div className="relative shrink-0">
                        <select 
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-white/5 text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest appearance-none pr-8 outline-none focus:border-teal-500/30"
                            value={filterRole} 
                            onChange={e => setFilterRole(e.target.value)}
                        >
                            <option value="">ALL ROLES</option>
                            {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                        </select>
                        <MdFilterList className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" size={14} />
                    </div>
                    
                    <div className="relative shrink-0">
                        <select 
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-white/5 text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest appearance-none pr-8 outline-none focus:border-teal-500/30"
                            value={filterBranch} 
                            onChange={e => setFilterBranch(e.target.value)}
                        >
                            <option value="">ALL BRANCHES</option>
                            {branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
                        </select>
                        <MdFilterList className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" size={14} />
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-6 pt-8 pb-32 space-y-8">
                
                {/* Team Distribution Hero */}
                {!search && (
                    <div className="p-6 rounded-[32px] bg-gradient-to-br from-gray-900 to-gray-800 dark:from-zinc-900 dark:to-black text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <MdTrendingUp className="text-teal-500" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Force distribution</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(branchStats).map(([name, count]) => (
                                    <div key={name} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2">
                                        <span className="opacity-40">{name}</span>
                                        <span className="text-teal-400 text-[11px]">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Staff List Grid */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Polling roster...</p>
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="py-20 text-center">
                            <MdPeople size={48} className="mx-auto text-gray-200 dark:text-zinc-800 mb-4" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Zero matches found</p>
                        </div>
                    ) : (
                        filteredStaff.map((emp, idx) => (
                            <div 
                                key={emp.employee_id} 
                                onClick={() => handleEdit(emp)}
                                className="bg-white dark:bg-zinc-900 p-5 rounded-[28px] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col gap-4 active:scale-[0.98] transition-all cursor-pointer group animate-slide-up"
                                style={{ animationDelay: `${idx * 40}ms` }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black text-base border border-teal-100 dark:border-teal-900/20 uppercase shadow-sm">
                                            {emp.first_name[0]}{emp.last_name[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 dark:text-white text-[16px] leading-tight flex items-center gap-2">
                                                {emp.first_name} {emp.last_name}
                                                <MdArrowForward className="opacity-0 group-hover:opacity-40 group-hover:translate-x-1 transition-all" />
                                            </h4>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight mt-1 truncate max-w-[180px]">{emp.email}</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                                        emp.is_active 
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20' 
                                        : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-900/20'
                                    }`}>
                                        {emp.is_active ? <MdVerified size={20} /> : <MdErrorOutline size={20} />}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50 dark:border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Authority</span>
                                        <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 leading-none">{emp.role_name}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Location</span>
                                        <span className="text-[11px] font-black text-gray-900 dark:text-white leading-none">{emp.branch_name || 'Global'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Management Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col animate-in slide-in-from-bottom duration-500 font-sans">
                    <header className="px-8 pt-12 pb-6 flex justify-between items-center border-b border-gray-100 dark:border-white/5 shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${formData.employee_id ? 'bg-amber-500 animate-pulse' : 'bg-teal-500'}`} />
                                <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{formData.employee_id ? 'Internal Update' : 'New Enrollment'}</p>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {formData.employee_id ? 'Configure Staff' : 'Add Employee'}
                            </h3>
                        </div>
                        <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-900 dark:text-white active:scale-90 transition-all">
                            <MdClose size={24} />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[#f8fafc]/50 dark:bg-black">
                        <div className="max-w-md mx-auto space-y-8 pb-32">
                            
                            {/* Toggle Switch */}
                            {formData.employee_id && (
                                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-white/5 flex items-center justify-between shadow-sm">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Access Protocol</p>
                                        <p className="text-xs text-gray-400 font-medium">Toggle account availability</p>
                                    </div>
                                    <button 
                                        onClick={() => setFormData({...formData, is_active: formData.is_active ? 0 : 1})}
                                        className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border shadow-sm ${
                                            formData.is_active 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/30' 
                                            : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-900/30'
                                        }`}
                                    >
                                        {formData.is_active ? 'ENABLED' : 'DISABLED'}
                                    </button>
                                </div>
                            )}

                            {/* Form Sections */}
                            <div className="space-y-6">
                                <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] border-l-2 border-teal-500 pl-3">Personal Identity</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Legal First Name</label>
                                        <input 
                                            className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 px-5 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 focus:border-teal-500/50 shadow-sm"
                                            value={formData.first_name}
                                            onChange={e => setFormData({...formData, first_name: e.target.value})}
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Legal Surname</label>
                                        <input 
                                            className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 px-5 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 focus:border-teal-500/50 shadow-sm"
                                            value={formData.last_name}
                                            onChange={e => setFormData({...formData, last_name: e.target.value})}
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Clinical Email</label>
                                    <div className="relative group">
                                        <MdEmail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                                        <input 
                                            className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-14 pr-5 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 focus:border-teal-500/50 shadow-sm"
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                            type="email"
                                            placeholder="john.doe@prospine.in"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] border-l-2 border-indigo-500 pl-3">Organizational Role</p>
                                <div className="grid grid-cols-1 gap-4">
                                     <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">System Role</label>
                                        <div className="relative">
                                            <MdShield className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <select 
                                                className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-14 pr-10 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 appearance-none"
                                                value={formData.role_id}
                                                onChange={e => setFormData({...formData, role_id: e.target.value})}
                                            >
                                                <option value="">Select Access Level</option>
                                                {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                                            </select>
                                            <MdFilterList className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        </div>
                                    </div>

                                     <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Primary Station (Branch)</label>
                                        <div className="relative">
                                            <MdBusiness className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <select 
                                                className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-14 pr-10 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 appearance-none"
                                                value={formData.branch_id}
                                                onChange={e => setFormData({...formData, branch_id: e.target.value})}
                                            >
                                                <option value="">Global Operations</option>
                                                {branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
                                            </select>
                                            <MdBusiness className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] border-l-2 border-slate-300 pl-3">Security & Connectivity</p>
                                <div className="grid grid-cols-1 gap-4">
                                     <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Official Job Title</label>
                                        <div className="relative">
                                            <MdWork className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input 
                                                className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-14 pr-5 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 shadow-sm"
                                                value={formData.job_title}
                                                onChange={e => setFormData({...formData, job_title: e.target.value})}
                                                placeholder="e.g. Senior Physiotherapist"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Emergency Contact</label>
                                        <div className="relative">
                                            <MdPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input 
                                                className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-14 pr-5 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 shadow-sm"
                                                value={formData.phone_number}
                                                onChange={e => setFormData({...formData, phone_number: e.target.value})}
                                                placeholder="+91 00000 00000"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Residential Address</label>
                                        <div className="relative">
                                            <MdLocationOn className="absolute left-5 top-5 text-gray-400" size={18} />
                                            <textarea 
                                                className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-14 pr-5 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 shadow-sm min-h-[100px]"
                                                value={formData.address}
                                                onChange={e => setFormData({...formData, address: e.target.value})}
                                                placeholder="Enter full address..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-white/5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                            {formData.employee_id ? 'Reset Terminal Password' : 'Initial Access Password'}
                                        </label>
                                        <div className="relative">
                                            <MdLock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input 
                                                className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-4 pl-14 pr-5 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 shadow-sm"
                                                value={formData.password}
                                                onChange={e => setFormData({...formData, password: e.target.value})}
                                                type="password"
                                                placeholder={formData.employee_id ? "Blank to maintain current" : "Minimum 8 characters"}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Elite Footer Actions */}
                    <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl shrink-0 z-50">
                        <button 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full h-16 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-[24px] shadow-2xl shadow-teal-500/30 active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSubmitting ? 'PROCESSING...' : (
                                <>
                                    <MdSave size={20} />
                                    {formData.employee_id ? 'Validate & Save' : 'Enroll Staff member'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffScreen;
