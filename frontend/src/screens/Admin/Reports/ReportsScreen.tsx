import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdArrowBack, MdFilterList, MdRefresh, MdClose,
    MdAttachMoney, MdCheckCircle, MdPendingActions, 
    MdPerson, MdAccessTime, MdLocalPharmacy
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface ReportFilter {
    start_date: string;
    end_date: string;
    test_name?: string;
    referred_by?: string;
    status?: string;
    assigned_doctor?: string;
    treatment_type?: string;
}

const ReportsScreen: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    
    // Core State
    const [activeTab, setActiveTab] = useState<'tests' | 'registrations' | 'patients'>('tests');
    const [loading, setLoading] = useState(false);
    
    // Data Cache State
    const [testsData, setTestsData] = useState<{data: any[], totals: any} | null>(null);
    const [registrationsData, setRegistrationsData] = useState<{data: any[], totals: any} | null>(null);
    const [patientsData, setPatientsData] = useState<{data: any[], totals: any} | null>(null);

    // Filters State
    const [filterOptions, setFilterOptions] = useState<any>({});
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<ReportFilter>({
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    // Track if filters have changed to know when to invalidate cache
    const lastFetchedFilters = useRef<string>('');

    const fetchFilterOptions = useCallback(async () => {
        try {
            const branchId = user?.branch_id || 1;
            const res = await fetch(`${API_URL}/admin/reports.php?action=filter_options&branch_id=${branchId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setFilterOptions(json.data);
            }
        } catch (error) {
            console.error(error);
        }
    }, [user]);

    const fetchData = useCallback(async (forced = false) => {
        const currentFilterString = JSON.stringify(filters);
        const filtersChanged = lastFetchedFilters.current !== currentFilterString;

        // If not forced, filters haven't changed, and we have data, don't fetch
        if (!forced && !filtersChanged) {
             if (activeTab === 'tests' && testsData) return;
             if (activeTab === 'registrations' && registrationsData) return;
             if (activeTab === 'patients' && patientsData) return;
        }

        setLoading(true);
        try {
            const branchId = user?.branch_id || 1;
            const query = new URLSearchParams({
                action: activeTab,
                branch_id: branchId.toString(),
                ...filters as any
            });

            const res = await fetch(`${API_URL}/admin/reports.php?${query.toString()}`);
            const json = await res.json();
            
            if (json.status === 'success') {
                const payload = { data: json.data, totals: json.totals };
                
                 if (activeTab === 'tests') setTestsData(payload);
                 else if (activeTab === 'registrations') setRegistrationsData(payload);
                 else if (activeTab === 'patients') setPatientsData(payload);
                
                // If filters changed, it means we probably invalidated other tabs too, 
                // but for now we just update the current one's cache and update the ref.
                // A stricter approach would be to clear other caches if filters changed.
                if (filtersChanged) {
                     if (activeTab !== 'tests') setTestsData(null);
                     if (activeTab !== 'registrations') setRegistrationsData(null);
                     if (activeTab !== 'patients') setPatientsData(null);
                     
                     // Re-set the current one because we just cleared it above if we were generic
                     if (activeTab === 'tests') setTestsData(payload);
                     else if (activeTab === 'registrations') setRegistrationsData(payload);
                     else if (activeTab === 'patients') setPatientsData(payload);

                     lastFetchedFilters.current = currentFilterString;
                }
            }
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, filters, user, testsData, registrationsData, patientsData]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    // Effect to trigger fetch on tab switch or when forced (but logic inside prevents redundant fetches)
    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]); 

    // Helper to get current view data
    const currentData = activeTab === 'tests' ? testsData?.data : (activeTab === 'registrations' ? registrationsData?.data : patientsData?.data);
    const currentTotals = activeTab === 'tests' ? testsData?.totals : (activeTab === 'registrations' ? registrationsData?.totals : patientsData?.totals);

    const handleRefresh = () => {
        // Force fetch and effectively invalidate cache by passing forced=true
        // But our logic handles invalidation via filter check mostly. 
        // Let's just manually clear and fetch.
        setTestsData(null); 
        setRegistrationsData(null); 
        setPatientsData(null);
        // We need to wait for state update? No, fetchData will just run. 
        // Actually fetchData depends on state, so better to just call it with a flag or rely on the cleared state.
        // Simplest:
        lastFetchedFilters.current = ''; // Force mismatch
        fetchData(true);
        setShowFilters(false);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', maximumFractionDigits: 0
        }).format(val);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        }).format(date);
    };

    const handleDatePreset = (preset: 'today' | 'this_month' | 'last_month') => {
        const today = new Date();
        let start = '';
        let end = today.toISOString().split('T')[0];

        if (preset === 'today') {
            start = end;
        } else if (preset === 'this_month') {
            start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        } else if (preset === 'last_month') {
            start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
            end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
        }

        setFilters(prev => ({ ...prev, start_date: start, end_date: end }));
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-black font-sans transition-colors relative min-h-screen">
             <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/20 dark:to-transparent pointer-events-none z-0" />

             {/* Header */}
             <div className="px-5 py-4 pt-12 sticky top-0 z-20 bg-transparent">
                <div className="flex items-center gap-4 mb-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors active:scale-95"
                    >
                        <MdArrowBack size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">Financial Reports</h1>
                        <p className="text-[10px] font-bold text-gray-500/80 dark:text-gray-400 uppercase tracking-widest mt-1">Performance & Revenue</p>
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            showFilters
                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' 
                            : 'bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md text-gray-500 border border-white/50 dark:border-white/10'
                        }`}
                    >
                        <MdFilterList size={20} />
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 mb-4 animate-scale-in space-y-4 border border-white/20 dark:border-white/5 shadow-xl relative overflow-hidden">
                        
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filters</span>
                            <button onClick={() => setShowFilters(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                                <MdClose size={18} />
                            </button>
                        </div>

                        {/* Date Presets */}
                        <div className="flex gap-2 mb-2">
                             {['Today', 'This_Month', 'Last_Month'].map(preset => (
                                 <button
                                    key={preset}
                                    onClick={() => handleDatePreset(preset.toLowerCase() as any)}
                                    className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800 text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 transition-colors"
                                 >
                                     {preset.replace('_', ' ')}
                                 </button>
                             ))}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase ml-1 mb-1 block">From</label>
                                <input 
                                    type="date"
                                    value={filters.start_date}
                                    onChange={e => setFilters({...filters, start_date: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-black border-none rounded-xl px-3 py-3 text-[11px] font-bold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-teal-500/20"
                                />
                             </div>
                             <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase ml-1 mb-1 block">To</label>
                                <input 
                                    type="date"
                                    value={filters.end_date}
                                    onChange={e => setFilters({...filters, end_date: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-black border-none rounded-xl px-3 py-3 text-[11px] font-bold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-teal-500/20"
                                />
                             </div>
                        </div>

                        {activeTab === 'tests' && (
                             <div className="grid grid-cols-1 gap-3">
                                <select 
                                    value={filters.test_name || ''}
                                    onChange={e => setFilters({...filters, test_name: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-black border-none rounded-xl px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-teal-500/20 appearance-none"
                                >
                                    <option value="">All Tests</option>
                                    {filterOptions.test_names?.map((t: string) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                             </div>
                        )}

                        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-white/5">
                            <button 
                                onClick={handleRefresh}
                                className="px-6 py-2.5 text-[10px] font-bold uppercase text-white bg-teal-600 rounded-xl shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <MdRefresh size={14} /> Update Report
                            </button>
                        </div>
                    </div>
                )}
             </div>

             {/* Tab Toggle */}
             <div className="px-5 mb-6">
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md p-1 rounded-2xl flex border border-white/20 dark:border-white/5">
                    {['tests', 'registrations', 'patients'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab 
                                ? 'bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
             </div>

             {/* Stats Overview */}
             {!loading && currentTotals && (
                 <div className="px-5 mb-6 animate-slide-up">
                     <div className="grid grid-cols-3 gap-3">
                        {activeTab === 'tests' ? (
                            <>
                                <StatsCard label="Revenue" value={currentTotals.revenue} color="indigo" icon={MdAttachMoney} delay={0} />
                                <StatsCard label="Collected" value={currentTotals.collected} color="emerald" icon={MdCheckCircle} delay={50} />
                                <StatsCard label="Outstanding" value={currentTotals.outstanding} color="rose" icon={MdPendingActions} delay={100} />
                            </>
                        ) : activeTab === 'registrations' ? (
                            <>
                                <StatsCard label="Consulted" value={currentTotals.consulted_revenue} color="indigo" icon={MdPerson} delay={0} />
                                <StatsCard label="Pending" value={currentTotals.pending_revenue} color="amber" icon={MdAccessTime} delay={50} />
                                <StatsCard label="Closed" value={currentTotals.closed_revenue} color="emerald" icon={MdCheckCircle} delay={100} />
                            </>
                        ) : (
                            <>
                                <StatsCard label="Total Billed" value={currentTotals.revenue} color="indigo" icon={MdAttachMoney} delay={0} />
                                <StatsCard label="Collected" value={currentTotals.collected} color="emerald" icon={MdCheckCircle} delay={50} />
                                <StatsCard label="Due" value={currentTotals.outstanding} color="rose" icon={MdPendingActions} delay={100} />
                            </>
                        )}
                     </div>
                 </div>
             )}

             {/* Content List */}
             <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-4 no-scrollbar">
                {loading ? (
                     <div className="py-20 flex flex-col items-center opacity-50">
                        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Generating Report...</p>
                    </div>
                ) : !currentData || currentData.length === 0 ? (
                    <div className="py-20 text-center opacity-50">
                        <MdLocalPharmacy size={32} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No records found</p>
                    </div>
                ) : (
                    currentData.map((item, idx) => (
                        <div 
                            key={item.id}
                            className="bg-white dark:bg-zinc-900 p-5 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm animate-slide-up group"
                            style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-teal-600 font-bold text-sm">
                                        {(item.patient_name || 'U').charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{item.patient_name}</h4>
                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{formatDate(item.created_at)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-black text-gray-900 dark:text-white">
                                        {formatCurrency(
                                            activeTab === 'tests' ? item.total_amount : 
                                            activeTab === 'patients' ? item.calculated_billed :
                                            item.consultation_amount
                                        )}
                                    </span>
                                     <StatusBadge status={item.status || item.payment_status} />
                                </div>
                            </div>

                            <div className="pl-[52px]">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                                    {activeTab === 'tests' ? item.test_name : 
                                     activeTab === 'patients' ? (item.treatment_type || 'General Patient') :
                                     item.consultation_type}
                                </p>
                                {activeTab === 'tests' && item.due_amount > 0 && (
                                     <span className="inline-block px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-[10px] font-bold rounded uppercase tracking-wider">
                                         Due: {formatCurrency(item.due_amount)}
                                     </span>
                                )}
                                {activeTab === 'patients' && item.calculated_due > 0 && (
                                     <span className="inline-block px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-[10px] font-bold rounded uppercase tracking-wider">
                                         Due: {formatCurrency(item.calculated_due)}
                                     </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
             </div>
             
             <style>{`
                .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; transform: translateY(20px); }
                .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; transform: scale(0.95); }
                @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
                @keyframes scaleIn { to { opacity: 1; transform: scale(1); } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

const StatsCard = ({ label, value, color, icon: Icon, delay }: any) => {
    const colorClasses: any = {
        indigo: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20',
        emerald: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20',
        rose: 'bg-rose-50 text-rose-500 dark:bg-rose-900/20',
        amber: 'bg-amber-50 text-amber-500 dark:bg-amber-900/20'
    };

    return (
        <div 
            className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-[24px] border border-white/20 dark:border-white/5 shadow-sm animate-slide-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${colorClasses[color]}`}>
                <Icon size={16} />
            </div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
            </p>
        </div>
    )
}

const StatusBadge = ({ status }: { status: string }) => {
    let color = 'bg-gray-100 text-gray-500';
    const s = (status || '').toLowerCase();
    
    if (['paid', 'completed', 'closed', 'active'].includes(s)) color = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
    else if (['pending', 'consulted'].includes(s)) color = 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
    else if (['cancelled', 'discontinued'].includes(s)) color = 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';

    return (
        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${color}`}>
            {s}
        </span>
    );
};

export default ReportsScreen;
