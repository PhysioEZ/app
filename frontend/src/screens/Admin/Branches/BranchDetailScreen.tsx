import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    MdChevronLeft, MdBusiness, MdLocationOn, 
    MdPhone, MdMailOutline, 
    MdErrorOutline, MdEdit, MdClose
} from 'react-icons/md';
import { useAuthStore } from '../../../store/useAuthStore';

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

const BranchDetailScreen: React.FC = () => {
    const { branchId } = useParams<{ branchId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [branch, setBranch] = useState<Branch | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Budget Edit State
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [newBudget, setNewBudget] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchBranchDetail();
    }, [branchId]);

    const fetchBranchDetail = async () => {
        if (!user || !branchId) return;
        setLoading(true);
        try {
            const empId = (user as any).employee_id || user.id;
            const res = await fetch(`${API_URL}/admin/branches.php?action=fetch_branches&user_id=${empId}`);
            const json = await res.json();
            if (json.status === 'success') {
                const found = json.data.find((b: Branch) => b.branch_id === parseInt(branchId));
                setBranch(found || null);
                if (found) setNewBudget(found.current_budget?.toString() || '');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBudget = async () => {
        if (!user || !branch) return;
        setSubmitting(true);
        try {
            const empId = user?.employee_id || user?.id;
            const res = await fetch(`${API_URL}/admin/branches.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_budget',
                    user_id: empId,
                    branch_id: branch.branch_id,
                    daily_budget_amount: newBudget,
                    effective_from_date: new Date().toISOString().split('T')[0]
                })
            });
            const json = await res.json();
            if (json.status === 'success') {
                setIsBudgetModalOpen(false);
                fetchBranchDetail();
            }
        } catch (ex) {
            console.error(ex);
        } finally {
            setSubmitting(false);
        }
    };

    const getImageUrl = (path: string | null | undefined) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        let cleanPath = path;
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        if (cleanPath.startsWith('admin/')) return `https://prospine.in/${cleanPath}`;
        return `https://prospine.in/admin/${cleanPath}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-black gap-4 opacity-40">
                <div className="w-8 h-8 border-2 border-transparent border-t-teal-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Loading Branch...</p>
            </div>
        );
    }

    if (!branch) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-black p-10 text-center">
                <MdErrorOutline size={48} className="text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Not Found</h2>
                <button onClick={() => navigate('/admin/branches')} className="mt-6 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-sm">Go Back</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-200 font-sans relative overflow-hidden">
            
            {/* Simple Branded Header */}
            <header className="px-5 py-4 pt-[max(env(safe-area-inset-top),16px)] flex items-center gap-4 sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 transition-all">
                <button 
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-500 active:scale-90 transition-transform"
                >
                    <MdChevronLeft size={24} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-none italic">{branch.branch_name}</h1>
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${branch.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {branch.is_active ? 'Live' : 'Offline'}
                </div>
            </header>

            <main className="flex-1 p-5 space-y-6 overflow-y-auto no-scrollbar relative z-10 pb-32">
                
                {/* Compact Info Card */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-white/5 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-black flex items-center justify-center p-2 border border-gray-100 dark:border-white/5">
                        {branch.logo_primary_path ? (
                            <img src={getImageUrl(branch.logo_primary_path)} className="w-full h-full object-contain" alt="" />
                        ) : (
                            <MdBusiness className="text-gray-200" size={32} />
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-none">{branch.branch_name}</h2>
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1.5">{branch.clinic_name}</p>
                    </div>
                </div>

                {/* Budget Section (Now Editable) */}
                <div className="bg-gray-900 dark:bg-zinc-900 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Daily Budget</p>
                            <h3 className="text-3xl font-light italic tracking-tighter">
                                ₹{branch.current_budget ? Number(branch.current_budget).toLocaleString() : '---'}
                            </h3>
                        </div>
                        <button 
                            onClick={() => setIsBudgetModalOpen(true)}
                            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
                        >
                            <MdEdit size={20} />
                        </button>
                    </div>
                    <div className="h-px w-full bg-white/5 mb-4" />
                    <p className="text-[9px] font-medium text-white/30 italic">Daily cap for reception and small expenses.</p>
                </div>

                {/* Grid for Contact & Admin */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-[28px] border border-gray-100 dark:border-white/5">
                         <div className="flex items-center gap-3 mb-4 text-gray-400">
                            <MdPhone size={18} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Phone Details</span>
                         </div>
                         <p className="text-sm font-bold text-gray-900 dark:text-white">{branch.phone_primary}</p>
                         {branch.phone_secondary && <p className="text-xs text-gray-400 mt-1">{branch.phone_secondary} (Alt)</p>}
                         
                         <div className="my-4 h-px bg-gray-50 dark:bg-white/5" />
                         
                         <div className="flex items-center gap-3 mb-4 text-gray-400">
                            <MdMailOutline size={18} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Email</span>
                         </div>
                         <p className="text-sm font-bold text-gray-900 dark:text-white">{branch.email || 'N/A'}</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-[28px] border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3 mb-4 text-gray-400">
                            <MdLocationOn size={18} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Address</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic border-l-2 border-teal-500 pl-3">
                            {branch.address_line_1}
                            {branch.address_line_2 && <><br/>{branch.address_line_2}</>}
                            <br/>{branch.city}, {branch.state} - {branch.pincode}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-[28px] border border-gray-100 dark:border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center font-bold">
                                {branch.admin_first_name[0]}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{branch.admin_first_name} {branch.admin_last_name}</p>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Branch Admin</p>
                            </div>
                         </div>
                    </div>
                </div>

            </main>

            {/* Budget Popup */}
            {isBudgetModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-black w-full sm:max-w-xs rounded-[32px] p-8 shadow-2xl animate-slide-up border border-gray-100 dark:border-white/5">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white italic">Update Budget</h3>
                            <button onClick={() => setIsBudgetModalOpen(false)} className="text-gray-400"><MdClose size={24}/></button>
                         </div>
                         <div className="mb-8">
                            <input 
                                className="w-full bg-gray-50 dark:bg-zinc-900 border-none rounded-2xl py-4 text-center text-3xl font-light italic text-gray-900 dark:text-white outline-none" 
                                type="number" 
                                value={newBudget} 
                                onChange={e => setNewBudget(e.target.value)}
                                autoFocus
                            />
                            <p className="text-[10px] text-center font-black text-gray-400 uppercase tracking-widest mt-2">Enter Amount (₹)</p>
                         </div>
                         <button 
                            onClick={handleSaveBudget} 
                            disabled={submitting}
                            className="w-full h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl disabled:opacity-30 active:scale-95 transition-all"
                         >
                            {submitting ? 'Saving...' : 'Confirm'}
                         </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchDetailScreen;
