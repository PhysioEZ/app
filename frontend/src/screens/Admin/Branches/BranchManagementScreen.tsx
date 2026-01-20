import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { 
    MdBusiness, MdSearch, MdLocationOn, MdPhone, 
    MdAccountBalanceWallet, MdAdd, MdClose,
    MdTrendingUp, MdEdit, MdSave, MdChevronLeft
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface Branch {
    branch_id: number;
    branch_name: string;
    clinic_name: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    pincode: string;
    phone_primary: string;
    phone_secondary: string;
    email: string;
    logo_primary_path: string;
    logo_secondary_path: string;
    is_active: number;
    current_budget: number | null;
    admin_employee_id: number;
    admin_first_name: string;
    admin_last_name: string;
    created_at: string;
}

const BranchManagementScreen: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Partial<Branch> | null>(null);
    const [branchFormData, setBranchFormData] = useState<Partial<Branch>>({});
    const [budgetData, setBudgetData] = useState({ amount: '', date: new Date().toISOString().split('T')[0] });
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const getImageUrl = (path: string | null | undefined) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        let cleanPath = path;
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        if (cleanPath.startsWith('admin/')) return `https://prospine.in/${cleanPath}`;
        return `https://prospine.in/admin/${cleanPath}`;
    };

    const fetchBranches = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const empId = user?.employee_id || user?.id;
            const res = await fetch(`${API_URL}/admin/branches.php?action=fetch_branches&user_id=${empId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setBranches(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const toggleBranchStatus = async (branchId: number, currentStatus: number) => {
        if (!user) return;
        const newStatus = currentStatus === 1 ? 0 : 1;
        setBranches(prev => prev.map(b => b.branch_id === branchId ? { ...b, is_active: newStatus } : b));
        try {
            const res = await fetch(`${API_URL}/admin/branches.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_status', branch_id: branchId, is_active: newStatus })
            });
            const json = await res.json();
            if (json.status !== 'success') fetchBranches();
        } catch (ex) {
            console.error(ex);
            fetchBranches();
        }
    };

    const handleSaveBudget = async () => {
        if (!user || !selectedBranch) return;
        setSubmitting(true);
        try {
            const empId = user?.employee_id || user?.id;
            const res = await fetch(`${API_URL}/admin/branches.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_budget',
                    user_id: empId,
                    branch_id: selectedBranch.branch_id,
                    daily_budget_amount: budgetData.amount,
                    effective_from_date: budgetData.date
                })
            });
            const json = await res.json();
            if (json.status === 'success') {
                setIsBudgetModalOpen(false);
                fetchBranches();
            }
        } catch (ex) {
            console.error(ex);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveBranch = async () => {
        if (!user) return;
        setSubmitting(true);
        try {
            const empId = user?.employee_id || user?.id;
            const res = await fetch(`${API_URL}/admin/branches.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...branchFormData,
                    action: 'save_branch',
                    user_id: empId,
                })
            });
            const json = await res.json();
            if (json.status === 'success') {
                setIsBranchModalOpen(false);
                fetchBranches();
            } else {
                alert(json.message);
            }
        } catch (ex) {
            console.error(ex);
        } finally {
            setSubmitting(false);
        }
    };

    const openBranchModal = (branch?: Branch) => {
        if (branch) {
            setBranchFormData(branch);
        } else {
            setBranchFormData({ is_active: 1 });
        }
        setIsBranchModalOpen(true);
    };

    const filteredBranches = useMemo(() => {
        if (!searchTerm) return branches;
        const low = searchTerm.toLowerCase();
        return branches.filter(b => 
            (b.branch_name || '').toLowerCase().includes(low) || 
            (b.clinic_name || '').toLowerCase().includes(low) ||
            (b.city || '').toLowerCase().includes(low) ||
            (b.phone_primary || '').toLowerCase().includes(low)
        );
    }, [branches, searchTerm]);

    const stats = useMemo(() => ({
        total: branches.length,
        active: branches.filter(b => b.is_active === 1).length,
        inactive: branches.filter(b => b.is_active === 0).length
    }), [branches]);

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
                            <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">Branch Grid</h1>
                            <p className="text-[10px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] mt-2">Clinic Locations</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => openBranchModal()}
                        className="w-12 h-12 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center shadow-xl active:scale-90 transition-all"
                    >
                        <MdAdd size={28} />
                    </button>
                </div>

                <div className="relative">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        className="w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-gray-300"
                        placeholder="Search locations..."
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
                <div className="p-6 pb-40 space-y-8">
                    
                    {/* Distribution Stats */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-zinc-900 dark:to-zinc-950 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Operational Grid</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-5xl font-light text-white tracking-tighter italic leading-none">{stats.total}</h3>
                                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-1">Stations</span>
                                </div>
                            </div>
                            <div className="flex gap-6 pb-2">
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest mb-1">Live</p>
                                    <p className="text-xl font-medium text-emerald-400 leading-none">{stats.active}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-rose-400/60 uppercase tracking-widest mb-1">Down</p>
                                    <p className="text-xl font-medium text-rose-400 leading-none">{stats.inactive}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Branch List */}
                    <div className="space-y-4">
                        {loading && branches.length === 0 ? (
                            <div className="py-24 flex flex-col items-center justify-center gap-4 opacity-40">
                                <div className="w-8 h-8 border-2 border-transparent border-t-teal-500 rounded-full animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Loading nodes...</p>
                            </div>
                        ) : filteredBranches.map((branch, idx) => (
                            <div 
                                key={branch.branch_id} 
                                onClick={() => navigate(`/admin/branches/${branch.branch_id}`)}
                                className={`bg-white dark:bg-zinc-900/40 p-6 rounded-[36px] shadow-sm border border-white dark:border-white/5 transition-all duration-500 animate-slide-up group relative overflow-hidden cursor-pointer active:scale-[0.98] ${!branch.is_active ? 'opacity-60 saturate-0' : ''}`} 
                                style={{ animationDelay: `${idx * 40}ms` }}
                            >
                                <div className="flex items-start gap-6 relative z-10">
                                    <div 
                                        className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 dark:border-white/5 shadow-inner"
                                    >
                                        {branch.logo_primary_path ? (
                                            <img src={getImageUrl(branch.logo_primary_path)} className="w-full h-full object-contain p-2" alt="" />
                                        ) : (
                                            <MdBusiness className="text-gray-200 dark:text-zinc-800" size={32} />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate uppercase leading-none">{branch.branch_name}</h3>
                                                <p className="text-[9px] font-black text-teal-600/70 uppercase tracking-widest mt-1">{branch.clinic_name}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openBranchModal(branch); }}
                                                className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 flex items-center justify-center active:scale-90 transition-all border border-gray-100 dark:border-white/5"
                                            >
                                                <MdEdit size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <div className="bg-gray-50 dark:bg-zinc-950/50 p-4 rounded-3xl border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-gray-400 mb-1.5 font-black uppercase tracking-[0.2em] text-[8px]">
                                            <MdLocationOn size={12} /> Deployment
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 truncate uppercase mt-0.5">{branch.city}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-zinc-950/50 p-4 rounded-3xl border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-gray-400 mb-1.5 font-black uppercase tracking-[0.2em] text-[8px]">
                                            <MdPhone size={12} /> Direct Line
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 truncate mt-0.5">{branch.phone_primary}</p>
                                    </div>
                                </div>

                                <div className="mt-4 p-5 rounded-[28px] bg-teal-500/5 border border-teal-500/10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-white dark:bg-zinc-900 text-gray-400 flex items-center justify-center border border-gray-100 dark:border-white/5">
                                            <MdAccountBalanceWallet size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Daily Cap</p>
                                            <p className="text-xl font-light text-gray-900 dark:text-white tracking-tighter italic">
                                                {branch.current_budget ? `₹${Number(branch.current_budget).toLocaleString()}` : '∞'}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedBranch(branch); setBudgetData({ ...budgetData, amount: branch.current_budget?.toString() || '' }); setIsBudgetModalOpen(true); }}
                                        className="w-11 h-11 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center shadow-lg active:scale-90 transition-all"
                                    >
                                        <MdTrendingUp size={20} />
                                    </button>
                                </div>

                                <div className="mt-4 flex justify-between items-center px-1">
                                     <div className="flex items-center gap-2">
                                         <div className={`w-1.5 h-1.5 rounded-full ${branch.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                         <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                                             Lead: {branch.admin_first_name}
                                         </p>
                                     </div>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); toggleBranchStatus(branch.branch_id, branch.is_active); }}
                                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${branch.is_active ? 'text-rose-500 border-rose-500/10' : 'text-emerald-500 border-emerald-500/10'}`}
                                     >
                                         {branch.is_active ? 'Suspend' : 'Activate'}
                                     </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Budget Modal */}
            {isBudgetModalOpen && selectedBranch && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-black w-full sm:max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-slide-up border border-white dark:border-white/5">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight italic">Budget Config</h2>
                                    <p className="text-[9px] font-black text-teal-600/70 uppercase tracking-[0.2em] mt-2">{selectedBranch.branch_name}</p>
                                </div>
                                <button onClick={() => setIsBudgetModalOpen(false)} className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-gray-400 active:scale-90 transition-transform"><MdClose size={24}/></button>
                            </div>
                            
                            <div className="text-center mb-12">
                                <input 
                                    autoFocus 
                                    className="w-full bg-transparent text-7xl font-light text-gray-900 dark:text-white outline-none text-center tracking-tighter italic" 
                                    value={budgetData.amount} 
                                    onChange={e => setBudgetData({ ...budgetData, amount: e.target.value })} 
                                    placeholder="00"
                                />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Daily Limit (₹)</p>
                            </div>

                            <button 
                                onClick={handleSaveBudget}
                                disabled={submitting}
                                className="w-full h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-20"
                            >
                                {submitting ? <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Confirm Limit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Branch Modal */}
            {isBranchModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-black w-full sm:max-w-xl h-[85vh] sm:h-auto rounded-[48px] shadow-2xl overflow-hidden animate-slide-up border border-white dark:border-white/5 flex flex-col">
                        <header className="p-10 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight italic">{branchFormData.branch_id ? 'Edit Station' : 'New Station'}</h2>
                                <p className="text-[9px] font-black text-teal-600/70 uppercase tracking-[0.2em] mt-2">Infrastructure Asset</p>
                            </div>
                            <button onClick={() => setIsBranchModalOpen(false)} className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-gray-400 active:scale-90 transition-transform"><MdClose size={24}/></button>
                        </header>
                        
                        <div className="flex-1 overflow-y-auto px-10 pb-10 no-scrollbar space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">Branch Details</label>
                                    <input 
                                        className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-teal-500/30 transition-all placeholder:text-gray-300"
                                        placeholder="Branch Name (e.g. Manipal)"
                                        value={branchFormData.branch_name || ''} 
                                        onChange={e => setBranchFormData({...branchFormData, branch_name: e.target.value})}
                                    />
                                    <input 
                                        className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-teal-500/30 transition-all placeholder:text-gray-300"
                                        placeholder="Clinic Name (e.g. Prospine Care)"
                                        value={branchFormData.clinic_name || ''} 
                                        onChange={e => setBranchFormData({...branchFormData, clinic_name: e.target.value})}
                                    />
                                    <input 
                                        className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-teal-500/30 transition-all placeholder:text-gray-300"
                                        placeholder="Primary Phone"
                                        value={branchFormData.phone_primary || ''} 
                                        onChange={e => setBranchFormData({...branchFormData, phone_primary: e.target.value})}
                                    />
                                    <input 
                                        className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-teal-500/30 transition-all placeholder:text-gray-300"
                                        placeholder="Email Address"
                                        value={branchFormData.email || ''} 
                                        onChange={e => setBranchFormData({...branchFormData, email: e.target.value})}
                                    />
                                </div>
                                
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">Deployment Site</label>
                                    <input 
                                        className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-teal-500/30 transition-all placeholder:text-gray-300"
                                        placeholder="Address Line 1"
                                        value={branchFormData.address_line_1 || ''} 
                                        onChange={e => setBranchFormData({...branchFormData, address_line_1: e.target.value})}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input 
                                            className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-teal-500/30 transition-all placeholder:text-gray-300"
                                            placeholder="City"
                                            value={branchFormData.city || ''} 
                                            onChange={e => setBranchFormData({...branchFormData, city: e.target.value})}
                                        />
                                        <input 
                                            className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-teal-500/30 transition-all placeholder:text-gray-300"
                                            placeholder="Pincode"
                                            value={branchFormData.pincode || ''} 
                                            onChange={e => setBranchFormData({...branchFormData, pincode: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleSaveBranch}
                                disabled={submitting}
                                className="w-full h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-20"
                            >
                                {submitting ? <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" /> : (
                                    <>
                                        <MdSave size={20} />
                                        Finalize Asset
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchManagementScreen;
