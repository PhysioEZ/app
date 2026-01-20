import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdSearch, 
    MdCheckCircle,
    MdPerson,
    MdTrendingUp,
    MdArrowForward,
    MdPayments,
    MdWarningAmber,
    MdPeople,
    MdAssignmentTurnedIn,
    MdCancel,
    MdRefresh
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface Patient {
    patient_id: number;
    patient_uid: string;
    patient_name: string;
    phone_number: string;
    age: number;
    gender: string;
    status: string;
    treatment_type: string;
    total_amount: number;
    due_amount: number;
}

interface Stats {
    total: number;
    active: number;
    completed: number;
    inactive: number;
    total_gross: number;
    total_due: number;
    total_collection: number;
}

const PatientsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'inactive'>('all');

    const fetchPatients = useCallback(async () => {
        try {
            setLoading(true);
            const empId = user?.employee_id || user?.id;
            // Note: Updated path to point to the correct API location found
            let url = `${API_URL}/patients.php?employee_id=${empId}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            
            const res = await fetch(url);
            const json = await res.json();
            if (json.status === 'success') {
                setPatients(json.data);
                setStats(json.stats);
            } else {
                setPatients([]);
                setStats(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, search]);

    useEffect(() => {
        if (user) {
            fetchPatients();
        }
    }, [user, fetchPatients]);

    const filteredPatients = useMemo(() => {
        if (statusFilter === 'all') return patients;
        return patients.filter(p => {
            const s = p.status?.toLowerCase();
            if (statusFilter === 'active') return ['active', 'ongoing', 'p', 'partially_paid'].includes(s);
            if (statusFilter === 'completed') return ['completed', 'discharged', 'f', 'fully_paid'].includes(s);
            if (statusFilter === 'inactive') return !['active', 'ongoing', 'p', 'partially_paid', 'completed', 'discharged', 'f', 'fully_paid'].includes(s);
            return true;
        });
    }, [patients, statusFilter]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-200 relative overflow-hidden font-sans">
            
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-teal-600/10 via-teal-600/5 to-transparent dark:from-teal-900/20 dark:via-teal-900/10 dark:to-transparent z-0" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header Toolbar */}
            <header className="px-6 py-4 pt-12 sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                            <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em]">Clinical Ledger</p>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Records</h1>
                    </div>
                    <button 
                        onClick={fetchPatients}
                        className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-gray-400 dark:text-zinc-500 border border-gray-100 dark:border-white/5 active:rotate-180 transition-transform duration-500"
                    >
                        <MdRefresh size={24} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        className="w-full bg-gray-50 dark:bg-zinc-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white outline-none border border-gray-100 dark:border-white/5 focus:border-teal-500/50 transition-all placeholder:text-gray-300 dark:placeholder:text-zinc-700 shadow-sm"
                        placeholder="Search by name, ID or phone..."
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { id: 'all', label: 'All Cases', icon: MdPeople },
                        { id: 'active', label: 'In-Treatment', icon: MdTrendingUp },
                        { id: 'completed', label: 'Recovered', icon: MdCheckCircle },
                        { id: 'inactive', label: 'Archived', icon: MdCancel }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                                statusFilter === tab.id 
                                ? 'bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-500/20' 
                                : 'bg-white dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 border-gray-100 dark:border-white/5'
                            }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
                <div className="p-6 pb-32 space-y-8">
                    
                    {/* High-Impact Stat Grid */}
                    {stats && !search && (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Revenue Card (Large) */}
                            <div className="col-span-2 p-6 rounded-[32px] bg-gradient-to-br from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-900 text-white shadow-2xl relative overflow-hidden group">
                                <div className="relative z-10 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-teal-100/60 uppercase tracking-[0.2em] mb-2 leading-none">Net Collected Revenue</p>
                                        <h2 className="text-4xl font-black tracking-tight">{formatCurrency(stats.total_collection)}</h2>
                                        <div className="flex items-center gap-2 mt-4">
                                            <div className="px-2 py-1 rounded-lg bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1.5">
                                                <MdTrendingUp size={12} className="text-emerald-300" />
                                                Stable Flow
                                            </div>
                                            <div className="px-2 py-1 rounded-lg bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10">
                                                Gross: {formatCurrency(stats.total_gross)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-teal-100">
                                        <MdPayments size={32} />
                                    </div>
                                </div>
                                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                            </div>

                            {/* Secondary Metrics */}
                            <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3">
                                    <MdWarningAmber size={20} />
                                </div>
                                <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Due Balance</p>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(stats.total_due)}</h3>
                            </div>

                            <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                                    <MdPeople size={20} />
                                </div>
                                <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Total Census</p>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.total} <span className="text-[10px] text-gray-400 font-bold ml-1">Files</span></h3>
                            </div>

                            <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                                    <MdTrendingUp size={20} />
                                </div>
                                <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Active Cases</p>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.active} <span className="text-[10px] text-gray-400 font-bold ml-1">Live</span></h3>
                            </div>

                            <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-500 flex items-center justify-center mb-3">
                                    <MdAssignmentTurnedIn size={20} />
                                </div>
                                <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Success Recovered</p>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.completed} <span className="text-[10px] text-gray-400 font-bold ml-1">Done</span></h3>
                            </div>
                        </div>
                    )}

                    {/* Patient Records List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h3 className="text-[11px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Patient Archives</h3>
                            <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase">{filteredPatients.length} Entries</span>
                        </div>

                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hydrating directory...</p>
                            </div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="py-24 text-center">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-900 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-gray-200 dark:text-zinc-800 border border-gray-100 dark:border-white/5 shadow-inner">
                                    <MdPerson size={40} />
                                </div>
                                <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.3em]">No case matches</p>
                            </div>
                        ) : (
                            filteredPatients.map((patient, idx) => {
                                const isDebit = patient.due_amount > 0;
                                const collection = (patient.total_amount || 0) - (patient.due_amount || 0);

                                return (
                                    <div 
                                        key={patient.patient_id} 
                                        onClick={() => navigate(`/admin/patients/${patient.patient_id}`)}
                                        className="bg-white dark:bg-zinc-900 p-5 rounded-[30px] shadow-sm border border-gray-100 dark:border-white/5 relative group overflow-hidden transition-all active:scale-[0.98] cursor-pointer animate-slide-up" 
                                        style={{ animationDelay: `${idx * 40}ms` }}
                                    >
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="w-16 h-16 rounded-[22px] bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 flex items-center justify-center text-teal-500 flex-shrink-0 group-hover:border-teal-500/30 transition-colors">
                                                <MdPerson size={32} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-0.5">
                                                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight truncate uppercase leading-none">{patient.patient_name}</h3>
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                                        ['active', 'ongoing', 'p', 'partially_paid'].includes(patient.status?.toLowerCase())
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500' 
                                                        : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'
                                                    }`}>
                                                        <MdCheckCircle size={18} />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{patient.patient_uid || `#${patient.patient_id}`} • {patient.phone_number}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-gray-50 dark:bg-zinc-800 text-[9px] font-black text-gray-500 uppercase tracking-tighter">{patient.age}Y</span>
                                                    <span className="px-2 py-0.5 rounded-md bg-gray-50 dark:bg-zinc-800 text-[9px] font-black text-gray-500 uppercase tracking-tighter">{patient.gender}</span>
                                                    <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-900/10 text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-tighter">{patient.treatment_type}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 p-4 rounded-[24px] bg-gray-50/50 dark:bg-zinc-800/40 border border-gray-100/50 dark:border-white/5">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Financial State</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">{formatCurrency(collection)}</span>
                                                </div>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Total: {formatCurrency(patient.total_amount)}</p>
                                            </div>
                                            <div className="flex flex-col items-end justify-center">
                                                <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 shadow-sm ${
                                                    isDebit 
                                                    ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-900/40' 
                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/40'
                                                }`}>
                                                    <div className="text-right">
                                                        <p className="text-[7px] font-black uppercase tracking-widest opacity-60 leading-none mb-0.5">{isDebit ? 'Due' : 'Cleared'}</p>
                                                        <p className="text-[11px] font-black leading-none tracking-tighter">{formatCurrency(patient.due_amount)}</p>
                                                    </div>
                                                    {isDebit ? <MdWarningAmber size={16} /> : <MdCheckCircle size={16} />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/10 flex justify-between items-center group-hover:translate-x-1 transition-transform">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">View Clinical Profile</span>
                                            </div>
                                            <MdArrowForward size={18} className="text-gray-300 dark:text-zinc-700" />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientsScreen;
