import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdSearch, MdChevronRight, MdChevronLeft, MdPeople, 
    MdHistory, MdCheckCircle, MdAccessTime, 
    MdAdd, MdClose, MdPrint, MdWarning, MdPublic
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface Partner {
    partner_id: number;
    name: string;
    phone: string;
    total_patients: number;
    total_revenue: number;
    pending_commission: number;
}

interface Transaction {
    id: number;
    type: 'registration' | 'test';
    date: string;
    patient_name: string;
    service_name: string;
    revenue: number;
    commission: number;
    status: 'pending' | 'paid';
}

const ReferralManagementScreen: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Partner Details (Drill Down)
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [txLoading, setTxLoading] = useState(false);

    // Modals
    const [showInvoice, setShowInvoice] = useState(false);
    const [showGlobalRates, setShowGlobalRates] = useState(false);
    const [showAddPartner, setShowAddPartner] = useState(false);
    
    // Form States
    const [testTypes, setTestTypes] = useState<string[]>([]);
    const [globalForm, setGlobalForm] = useState<{reg: string, tests: Record<string, string>}>({ reg: '', tests: {} });
    const [newPartner, setNewPartner] = useState({ name: '', phone: '' });
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState<{type: 'success'|'error', message: string} | null>(null);
    const [isFabOpen, setIsFabOpen] = useState(false);

    // Initial Data Fetch
    const fetchPartners = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const empId = (user as any).employee_id || user.id;
            const res = await fetch(`${API_URL}/admin/referrals.php?action=fetch_partners&user_id=${empId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setPartners(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPartners();
    }, [fetchPartners]);

    // Fetch transactions for detailed view
    const fetchTransactions = async (partner: Partner) => {
        if (!user) return;
        setTxLoading(true);
        setSelectedPartner(partner);
        const empId = (user as any).employee_id || user.id;
        try {
            const res = await fetch(`${API_URL}/admin/referrals.php?action=fetch_transactions&partner_id=${partner.partner_id}&user_id=${empId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setTransactions(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setTxLoading(false);
        }
    };

    // Toggle Paid/Pending
    const toggleStatus = async (txId: number, type: string) => {
        const tx = transactions.find(t => t.id === txId);
        if (!tx) return;
        const newStatus = tx.status === 'pending' ? 'paid' : 'pending';
        
        // Optimistic UI Update
        const updatedTxs = transactions.map(t => t.id === txId ? { ...t, status: newStatus as 'paid' | 'pending' } : t);
        setTransactions(updatedTxs);

        try {
            await fetch(`${API_URL}/admin/referrals.php?action=update_status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id: txId, status: newStatus })
            });
            fetchPartners(); // Sync totals in bg
        } catch (e) {
            console.error(e);
            setTransactions(transactions); // Revert on failure
        }
    };

    // Global Rates Handling
    const openGlobalRates = async () => {
        setShowGlobalRates(true);
        try {
            const res = await fetch(`${API_URL}/admin/referrals.php?action=fetch_test_types`);
            const json = await res.json();
            if (json.status === 'success') setTestTypes(json.data);
        } catch (e) { console.error(e); }
    };

    const handleGlobalUpdate = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/admin/referrals.php?action=update_global_rates`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ rate_registration: globalForm.reg, rates: globalForm.tests })
            });
            const json = await res.json();
            if (json.status === 'success') {
                setShowGlobalRates(false);
                setGlobalForm({ reg: '', tests: {} });
                fetchPartners();
                notify('success', 'Global rates updated');
            }
        } catch (e) { notify('error', 'Update failed'); }
        finally { setSubmitting(false); }
    };

    // Add Partner
    const handleAddPartner = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/admin/referrals.php?action=add_partner`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(newPartner)
            });
            const json = await res.json();
            if (json.status === 'success') {
                setShowAddPartner(false);
                setNewPartner({ name: '', phone: '' });
                fetchPartners();
                notify('success', 'Partner added');
            } else {
                notify('error', json.message);
            }
        } catch (e) { notify('error', 'Network error'); }
        finally { setSubmitting(false); }
    };

    const notify = (type: 'success' | 'error', msg: string) => {
        setNotification({ type, message: msg });
        setTimeout(() => setNotification(null), 3000);
    };

    const filteredPartners = useMemo(() => {
        if (!searchTerm) return partners;
        const low = searchTerm.toLowerCase();
        return partners.filter(p => p.name.toLowerCase().includes(low) || p.phone.includes(low));
    }, [partners, searchTerm]);

    const stats = useMemo(() => ({
        revenue: partners.reduce((s, p) => s + p.total_revenue, 0),
        payable: partners.reduce((s, p) => s + p.pending_commission, 0),
        count: partners.length
    }), [partners]);

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-200 relative overflow-hidden font-sans">
            
            {/* Branded Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/10 dark:to-transparent pointer-events-none z-0" />

            {/* Header */}
            <header className="px-6 py-6 pt-12 flex flex-col gap-6 z-40 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => selectedPartner ? setSelectedPartner(null) : navigate('/admin/menu')} 
                            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900/50 shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
                        >
                            <MdChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">
                                {selectedPartner ? selectedPartner.name : 'Referrals'}
                            </h1>
                            <p className="text-[10px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] mt-2">
                                {selectedPartner ? 'Partner History' : 'Directory & Analytics'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {selectedPartner && (
                            <button onClick={() => setShowInvoice(true)} className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all">
                                <MdPrint size={16} /> Bill
                            </button>
                        )}
                    </div>
                </div>

                {!selectedPartner && (
                    <div className="relative">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            className="w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-gray-300"
                            placeholder="Find partner..."
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 p-5 space-y-6">
                
                {!selectedPartner ? (
                    <>
                        {/* Compact Summary */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-3xl border border-white dark:border-white/5 shadow-sm text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Revenue</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white italic">₹{stats.revenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-3xl border border-white dark:border-white/5 shadow-sm text-center">
                                <p className="text-[8px] font-black text-rose-500 uppercase mb-1">Payable</p>
                                <p className="text-sm font-bold text-rose-500 italic">₹{stats.payable.toLocaleString()}</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-3xl border border-white dark:border-white/5 shadow-sm text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Partners</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white italic">{stats.count}</p>
                            </div>
                        </div>

                        {/* Partner Feed */}
                        <div className="space-y-4 pb-40">
                            {loading ? (
                                <div className="py-20 text-center opacity-40 italic text-[10px] font-black uppercase tracking-widest">Finding partners...</div>
                            ) : filteredPartners.map(partner => (
                                <div 
                                    key={partner.partner_id} 
                                    onClick={() => fetchTransactions(partner)}
                                    className="bg-white dark:bg-zinc-900/50 p-6 rounded-[36px] border border-white dark:border-white/5 shadow-sm active:scale-[0.98] transition-all flex flex-col gap-6 group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4 min-w-0">
                                            <div className="w-14 h-14 rounded-[20px] bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center font-bold text-xl border border-teal-100 dark:border-teal-900/30 shadow-inner shrink-0">
                                                {partner.name[0]}
                                            </div>
                                            <div className="min-w-0 pt-1">
                                                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight uppercase truncate">{partner.name}</h3>
                                                <p className="text-[10px] font-medium text-gray-400 mt-1">{partner.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1.5">Pending</p>
                                            <p className="text-xl font-black text-rose-500 tracking-tighter leading-none">₹{partner.pending_commission.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                                        <div className="flex gap-6">
                                            <div className="text-left">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Patients</p>
                                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{partner.total_patients}</p>
                                            </div>
                                            <div className="text-left border-l border-gray-100 dark:border-white/5 pl-6">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Rev</p>
                                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">₹{partner.total_revenue.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-gray-300 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                                            <MdChevronRight size={24} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    /* Transaction List */
                    <div className="space-y-4 pb-32">
                        {txLoading ? (
                            <div className="py-20 text-center opacity-40 italic text-[10px] font-black uppercase tracking-widest">Syncing history...</div>
                        ) : transactions.map(tx => (
                            <div key={`${tx.type}-${tx.id}`} className="bg-white dark:bg-zinc-900/50 p-5 rounded-[28px] border border-white dark:border-white/5 flex items-center justify-between shadow-sm">
                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'registration' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                        {tx.type === 'registration' ? <MdPeople size={24} /> : <MdHistory size={24} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight uppercase truncate">{tx.patient_name}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{tx.service_name}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Comm</p>
                                        <p className="text-sm font-black text-rose-500 leading-none italic">₹{tx.commission}</p>
                                    </div>
                                    <button 
                                        onClick={() => toggleStatus(tx.id, tx.type)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all border ${tx.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}
                                    >
                                        {tx.status === 'paid' ? <MdCheckCircle size={20} /> : <MdAccessTime size={20} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Global Rates Modal */}
            {showGlobalRates && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-black w-full sm:max-w-md h-[80vh] sm:h-auto rounded-[48px] shadow-2xl overflow-hidden animate-slide-up border border-white dark:border-white/5 flex flex-col">
                        <header className="p-10 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-light italic text-gray-900 dark:text-white">Global Rates</h3>
                                <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mt-2">Update all partners</p>
                            </div>
                            <button onClick={() => setShowGlobalRates(false)} className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-900 text-gray-400 flex items-center justify-center"><MdClose size={24}/></button>
                        </header>
                        <div className="flex-1 overflow-y-auto px-10 pb-10 no-scrollbar space-y-6">
                            <div className="p-4 bg-teal-50 dark:bg-teal-900/10 rounded-2xl border border-teal-100 dark:border-teal-900/20">
                                <p className="text-[10px] text-teal-700 dark:text-teal-400 font-bold leading-relaxed italic">Warning: This applies to all future & pending records across the entire network.</p>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Registration (Fixed ₹)</label>
                                <input 
                                    className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-xl font-light italic text-gray-900 dark:text-white outline-none"
                                    placeholder="00" value={globalForm.reg} onChange={e => setGlobalForm({...globalForm, reg: e.target.value})}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Test Rates (Fixed ₹)</label>
                                {testTypes.map(type => (
                                    <div key={type} className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-900/30 p-4 rounded-3xl border border-gray-100 dark:border-white/5">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase flex-1 truncate">{type}</span>
                                        <input 
                                            className="w-24 bg-transparent border-none text-right font-bold text-gray-900 dark:text-white outline-none"
                                            placeholder="0" value={globalForm.tests[type] || ''} onChange={e => setGlobalForm({...globalForm, tests: {...globalForm.tests, [type]: e.target.value}})}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleGlobalUpdate} disabled={submitting} className="w-full h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[28px] font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 disabled:opacity-30">
                                {submitting ? 'Applying...' : 'Update Network'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Partner Modal */}
            {showAddPartner && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-black w-full sm:max-w-xs rounded-[48px] p-8 shadow-2xl overflow-hidden animate-slide-up border border-white dark:border-white/5">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold italic text-gray-900 dark:text-white leading-none">New Partner</h3>
                            <button onClick={() => setShowAddPartner(false)} className="text-gray-400"><MdClose size={24}/></button>
                        </div>
                        <div className="space-y-4 mb-10">
                            <input 
                                className="w-full bg-gray-50 dark:bg-zinc-900 border-none rounded-2xl py-4 px-6 text-sm font-bold uppercase text-gray-900 dark:text-white outline-none placeholder:text-gray-300"
                                placeholder="Full Name" value={newPartner.name} onChange={e => setNewPartner({...newPartner, name: e.target.value})}
                            />
                            <input 
                                className="w-full bg-gray-50 dark:bg-zinc-900 border-none rounded-2xl py-4 px-6 text-sm font-bold text-gray-900 dark:text-white outline-none placeholder:text-gray-300"
                                placeholder="Phone Number" value={newPartner.phone} onChange={e => setNewPartner({...newPartner, phone: e.target.value})}
                            />
                        </div>
                        <button onClick={handleAddPartner} disabled={submitting} className="w-full h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-30">
                            {submitting ? 'Creating...' : 'Finalize'}
                        </button>
                    </div>
                </div>
            )}

            {/* Invoice (Hidden in UI, used for printing) */}
            {showInvoice && selectedPartner && (
                <div className="fixed inset-0 z-[200] bg-white text-black p-10 overflow-y-auto no-scrollbar print-view">
                    <div className="max-w-3xl mx-auto space-y-10">
                        <div className="flex justify-between items-start border-b-2 border-black pb-8">
                            <div>
                                <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">PROSPINE</h1>
                                <p className="text-xs font-bold uppercase tracking-widest mt-2">Referral Statement</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-gray-400">Bill To:</p>
                                <p className="text-xl font-bold uppercase">{selectedPartner.name}</p>
                                <p className="text-xs font-bold">{selectedPartner.phone}</p>
                            </div>
                        </div>
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-black">
                                <tr>
                                    <th className="py-3 uppercase font-black">Date</th>
                                    <th className="py-3 uppercase font-black">Patient / Service</th>
                                    <th className="py-3 uppercase font-black text-right">Commission</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.filter(t => t.status === 'pending').map((tx, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="py-3">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="py-3">
                                            <p className="font-bold uppercase">{tx.patient_name}</p>
                                            <p className="text-[10px] text-gray-400">{tx.service_name}</p>
                                        </td>
                                        <td className="py-3 text-right font-bold italic">₹{tx.commission}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2} className="py-8 text-right font-black uppercase text-xs">Total Amount Payable</td>
                                    <td className="py-8 text-right text-3xl font-light italic tracking-tighter">
                                        ₹{transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + Number(t.commission), 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                        <div className="flex gap-4 no-print mt-10">
                            <button onClick={() => window.print()} className="flex-1 h-14 bg-black text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><MdPrint size={20}/> Print Statement</button>
                            <button onClick={() => setShowInvoice(false)} className="flex-1 h-14 bg-gray-100 text-black rounded-2xl font-bold uppercase text-[10px] tracking-widest">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Menu */}
            {!selectedPartner && (
                <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3">
                    {isFabOpen && (
                        <div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-4 duration-300">
                            <button 
                                onClick={() => { setShowGlobalRates(true); setIsFabOpen(false); openGlobalRates(); }}
                                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 active:scale-95 transition-all"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">Global Rates</span>
                                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center">
                                    <MdPublic size={18} />
                                </div>
                            </button>
                            <button 
                                onClick={() => { setShowAddPartner(true); setIsFabOpen(false); }}
                                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 active:scale-95 transition-all"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Add Partner</span>
                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white flex items-center justify-center">
                                    <MdAdd size={18} />
                                </div>
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsFabOpen(!isFabOpen)}
                        className={`w-14 h-14 rounded-[24px] shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${isFabOpen ? 'bg-rose-500 text-white rotate-45' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'}`}
                    >
                        <MdAdd size={32} />
                    </button>
                </div>
            )}

            {/* Notification */}
            {notification && (
                <div className={`fixed bottom-6 left-6 right-6 z-[200] p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up ${
                    notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                    {notification.type === 'success' ? <MdCheckCircle size={24} /> : <MdWarning size={24} />}
                    <p className="text-[11px] font-black uppercase tracking-widest">{notification.message}</p>
                </div>
            )}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                @media print {
                    .no-print { display: none !important; }
                    body * { visibility: hidden; }
                    .print-view, .print-view * { visibility: visible; }
                    .print-view { position: fixed; left: 0; top: 0; width: 100%; height: 100%; padding: 20mm; margin: 0; z-index: 9999; }
                }
            `}</style>
        </div>
    );
};

export default ReferralManagementScreen;
