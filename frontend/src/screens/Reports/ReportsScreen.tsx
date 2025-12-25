import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, Filter, 
  FlaskConical, UserPlus, Users, MessageSquare,
  DollarSign, Activity, CheckCircle, Clock,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// --- Types ---
interface ReportTotals {
    [key: string]: number | string;
}

interface ReportItem {
    [key: string]: any;
}

// --- Components ---

const StatCard = ({ label, value, gradient, icon: Icon }: any) => (
    <div className={`relative overflow-hidden rounded-3xl p-6 ${gradient} text-white shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98]`}>
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-24 h-24 bg-black/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
                    <Icon size={18} className="text-white" />
                </div>
                {/* Simulated Trend Indicator */}
                <div className="flex items-center gap-1 text-[10px] font-bold bg-black/20 px-2 py-1 rounded-full text-white/90">
                    <TrendingUp size={10} />
                    <span>+2.4%</span>
                </div>
            </div>
            
            <div>
                <h2 className="text-3xl font-black tracking-tighter mb-1">{value}</h2>
                <p className="text-xs font-medium opacity-80 uppercase tracking-wide">{label}</p>
                <div className="mt-2 h-1 w-12 bg-white/30 rounded-full"></div>
            </div>
        </div>
    </div>
);

const FilterPill = ({ label, active, onClick, icon: Icon }: any) => (
    <button 
        onClick={onClick}
        className={`relative flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all duration-300 ${
            active 
            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl shadow-gray-200 dark:shadow-none translate-y-[-2px]' 
            : 'bg-white dark:bg-gray-800 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'
        }`}
    >
        <Icon size={16} className={active ? 'animate-pulse' : ''} />
        <span>{label}</span>
        {active && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-900 dark:bg-white rounded-full"></span>
        )}
    </button>
);

export const ReportsScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    // State
    const [activeTab, setActiveTab] = useState<'tests' | 'registration' | 'patients' | 'inquiry'>('tests');
    const [loading, setLoading] = useState(false);
    
    // Dates
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Data
    const [data, setData] = useState<ReportItem[]>([]);
    const [totals, setTotals] = useState<ReportTotals | null>(null);

    // Fetch Data
    const fetchReport = async () => {
        setLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
            const branchId = user?.branch_id || 1;
            
            const params = new URLSearchParams({
                branch_id: branchId.toString(),
                type: activeTab,
                start_date: startDate,
                end_date: endDate
            });

            const res = await fetch(`${baseUrl}/reports.php?${params.toString()}`);
            const json = await res.json();
            
            if (json.status === 'success') {
                setData(json.data);
                setTotals(json.totals);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [activeTab, startDate, endDate]);

    const formatCurrency = (n: any) => {
        const num = Number(n);
        return isNaN(num) ? '₹0' : `₹${num.toLocaleString('en-IN')}`;
    };

    // --- Graph Processors ---
    
    const getTrendData = () => {
        if (!data.length) return [];
        const groups: Record<string, number> = {};
        
        // Init with 0 for items in range? For now, just group existing
        data.forEach(item => {
            const date = item.assigned_test_date || item.appointment_date || item.start_date || item.created_at;
            if (!date) return;
            const key = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            groups[key] = (groups[key] || 0) + 1;
        });

        return Object.entries(groups).map(([label, value]) => ({ label, value }));
    };

    const getDistributionData = () => {
        if (!data.length) return [];
        const groups: Record<string, number> = {};
        
        data.forEach(item => {
            let key = activeTab === 'tests' ? item.test_name : 
                        activeTab === 'patients' ? item.treatment_type : 
                        activeTab === 'inquiry' ? item.referralSource : item.gender;
            
            if (!key) return;
            
            // Normalize to handle case sensitivity (e.g. EEG vs eeg)
            key = key.toString().trim().toUpperCase();

            groups[key] = (groups[key] || 0) + 1;
        });

        // Top 5
        const sorted = Object.entries(groups)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
            
        const total = sorted.reduce((sum, [, val]) => sum + val, 0);
        return sorted.map(([label, value], idx) => ({ 
            label, 
            value, 
            percent: Math.round((value / total) * 100),
            color: [
                'bg-violet-500', 'bg-pink-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500'
            ][idx % 5]
        }));
    };

    // --- Components ---

    const TrendChart = () => {
        const trend = getTrendData();
        if (!trend.length) return null;
        
        const max = Math.max(...trend.map(t => t.value));
        
        return (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp size={16} className="text-violet-500" />
                        Patient Trends
                    </h3>
                    <div className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500">
                        Daily Count
                    </div>
                </div>
                
                <div className="flex items-end justify-between h-32 gap-2">
                    {trend.map((t, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="relative w-full flex justify-center">
                                <div 
                                    className="w-full max-w-[12px] bg-indigo-100 dark:bg-gray-700 rounded-full overflow-hidden relative"
                                    style={{ height: '100px' }}
                                >
                                    <div 
                                        className="absolute bottom-0 w-full bg-violet-500 rounded-full group-hover:bg-violet-400 transition-all duration-500"
                                        style={{ height: `${(t.value / max) * 100}%` }}
                                    ></div>
                                </div>
                                {/* Tooltip */}
                                <div className="absolute -top-8 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {t.value}
                                </div>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 rotate-0 truncate w-full text-center">
                                {t.label.split(' ')[0]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const DistributionChart = () => {
        const dist = getDistributionData();
        if (!dist.length) return null;

        // Create conic gradient string
        let currentDeg = 0;
        const gradientParts = dist.map(d => {
            const deg = (d.percent / 100) * 360;
            const start = currentDeg;
            const end = currentDeg + deg;
            currentDeg = end;
            // Map tailwind class to hex for CSS
            const colorMap: any = {
                'bg-violet-500': '#8b5cf6', 'bg-pink-500': '#ec4899', 
                'bg-sky-500': '#0ea5e9', 'bg-emerald-500': '#10b981', 'bg-amber-500': '#f59e0b'
            };
            return `${colorMap[d.color] || '#ccc'} ${start}deg ${end}deg`;
        });
        const gradient = `conic-gradient(${gradientParts.join(', ')})`;

        return (
             <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FlaskConical size={16} className="text-pink-500" />
                        Most Popular
                    </h3>
                </div>

                <div className="flex items-center gap-8">
                    {/* Doughnut */}
                    <div className="relative w-28 h-28 shrink-0">
                         <div 
                            className="w-full h-full rounded-full"
                            style={{ background: gradient }}
                         ></div>
                         <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-inner">
                             <span className="text-xs font-black text-gray-300">TOP 5</span>
                         </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-3">
                        {dist.map((d, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${d.color}`}></div>
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 truncate max-w-[100px]">{d.label}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{d.percent}%</span>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        );
    };

    const renderStats = () => {
        if (loading) return null;

        const Graphs = () => (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-in slide-in-from-bottom-6 duration-700">
                  <TrendChart />
                  <DistributionChart />
             </div>
        );

        switch(activeTab) {
            case 'tests':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard 
                                label="Total Revenue" 
                                value={formatCurrency(totals?.total_sum)} 
                                gradient="bg-gradient-to-br from-violet-600 to-indigo-600" 
                                icon={DollarSign}
                            />
                            <StatCard 
                                label="Collected" 
                                value={formatCurrency(totals?.paid_sum)} 
                                gradient="bg-gradient-to-br from-emerald-500 to-teal-600" 
                                icon={CheckCircle}
                            />
                            <StatCard 
                                label="Outstanding" 
                                value={formatCurrency(totals?.due_sum)} 
                                gradient="bg-gradient-to-br from-rose-500 to-orange-500" 
                                icon={Clock}
                            />
                        </div>
                        <Graphs />
                    </>
                );
            case 'registration':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard 
                                label="Consultation Rev" 
                                value={formatCurrency(totals?.consulted_sum)} 
                                gradient="bg-gradient-to-br from-blue-600 to-cyan-500" 
                                icon={UserPlus}
                            />
                            <StatCard 
                                label="Pending Rev" 
                                value={formatCurrency(totals?.pending_sum)} 
                                gradient="bg-gradient-to-br from-amber-500 to-orange-500" 
                                icon={Clock}
                            />
                            <StatCard 
                                label="Closed Cases" 
                                value={formatCurrency(totals?.closed_sum)} 
                                gradient="bg-gradient-to-br from-slate-600 to-slate-800" 
                                icon={CheckCircle}
                            />
                        </div>
                        <Graphs />
                    </>
                );
            case 'patients':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard 
                                label="Billed Amount" 
                                value={formatCurrency(totals?.total_sum)} 
                                gradient="bg-gradient-to-br from-fuchsia-600 to-pink-600" 
                                icon={DollarSign}
                            />
                            <StatCard 
                                label="Received" 
                                value={formatCurrency(totals?.paid_sum)} 
                                gradient="bg-gradient-to-br from-emerald-500 to-teal-600" 
                                icon={CheckCircle}
                            />
                            <StatCard 
                                label="Dues" 
                                value={formatCurrency(totals?.due_sum)} 
                                gradient="bg-gradient-to-br from-rose-500 to-red-600" 
                                icon={Clock}
                            />
                        </div>
                        <Graphs />
                    </>
                );
            case 'inquiry':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard 
                                label="Total Leads" 
                                value={totals?.total_inquiries || 0} 
                                gradient="bg-gradient-to-br from-violet-600 to-purple-600" 
                                icon={MessageSquare}
                            />
                            <StatCard 
                                label="Converted" 
                                value={totals?.registered_count || 0} 
                                gradient="bg-gradient-to-br from-emerald-500 to-teal-600" 
                                icon={UserPlus}
                            />
                            <StatCard 
                                label="Pending Action" 
                                value={totals?.new_count || 0} 
                                gradient="bg-gradient-to-br from-amber-500 to-orange-500" 
                                icon={Clock}
                            />
                        </div>
                        <Graphs />
                    </>
                );
        }
    };

    const renderList = () => {
        if (!data.length) return (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Filter size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-bold text-gray-400">No records found</p>
            </div>
        );

        return data.map((item, idx) => (
            <div key={idx} className="group bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-3 hover:shadow-md transition-all active:scale-[0.99]">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-inner ${
                            idx % 2 === 0 ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-500' : 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 text-indigo-500'
                        }`}>
                            {(item.patient_name || item.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                {item.patient_name || item.name || 'Unknown'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {activeTab === 'tests' ? item.test_name : 
                                     activeTab === 'patients' ? item.treatment_type : 
                                     activeTab === 'inquiry' ? item.referralSource : item.gender}
                                </span>
                                {item.status && (
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                        (item.status === 'completed' || item.status === 'registered' || item.status === 'consulted') ? 'bg-emerald-100 text-emerald-600' : 
                                        (item.status === 'pending' || item.status === 'new') ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {item.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-right">
                         <p className="text-sm font-black text-gray-900 dark:text-white">
                             {activeTab === 'inquiry' ? '' : formatCurrency(item.total_amount || item.consultation_amount)}
                         </p>
                         <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                             {new Date(item.assigned_test_date || item.appointment_date || item.start_date || item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                         </p>
                    </div>
                </div>

                {/* Footer Info */}
                {(item.test_done_by || item.chief_complain || item.assigned_doctor) && (
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50 flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                        <Activity size={10} className="text-gray-300" />
                        <span className="truncate max-w-[200px]">
                            {item.test_done_by || item.chief_complain || item.assigned_doctor}
                        </span>
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900 transition-colors">
            {/* Glass Header */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-5 py-4 pt-[var(--safe-area-inset-top,32px)] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
                    </button>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Reports</h1>
                    <div className="w-8"></div> {/* Spacer */}
                </div>

                {/* Date Filter & Title */}
                <div className="flex flex-col gap-4">
                     <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                          <div className="flex-1 relative group">
                              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                              <input 
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 dark:text-white rounded-xl pl-9 pr-2 py-2 text-xs font-bold shadow-sm border-none focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                              />
                          </div>
                          <span className="text-gray-400">
                              <ArrowLeft size={12} className="rotate-180" />
                          </span>
                          <div className="flex-1 relative group">
                              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                              <input 
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 dark:text-white rounded-xl pl-9 pr-2 py-2 text-xs font-bold shadow-sm border-none focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                              />
                          </div>
                     </div>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="px-5 py-4 overflow-x-auto no-scrollbar flex gap-3 sticky top-[140px] z-10 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 pb-4">
                 <FilterPill active={activeTab === 'tests'} label="Tests" onClick={() => setActiveTab('tests')} icon={FlaskConical} />
                 <FilterPill active={activeTab === 'registration'} label="Registration" onClick={() => setActiveTab('registration')} icon={UserPlus} />
                 <FilterPill active={activeTab === 'patients'} label="Patients" onClick={() => setActiveTab('patients')} icon={Users} />
                 <FilterPill active={activeTab === 'inquiry'} label="Inquiry" onClick={() => setActiveTab('inquiry')} icon={MessageSquare} />
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto px-5 pb-24 space-y-6 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                    {renderStats()}
                </div>

                {/* Activity List Title */}
                <div className="flex items-center justify-between mt-2">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Activity size={14} className="text-violet-500" />
                        Detailed Records
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                        {data.length} Entries
                    </span>
                </div>

                {/* List */}
                <div className="space-y-1 animate-in slide-in-from-bottom-8 duration-700 delay-100">
                    {renderList()}
                </div>

                {loading && (
                    <div className="absolute inset-x-0 bottom-10 flex justify-center">
                         <div className="bg-gray-900/80 dark:bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-white dark:text-gray-900 text-xs font-bold shadow-xl flex items-center gap-2">
                             <div className="w-3 h-3 border-2 border-white/50 dark:border-gray-900/50 border-t-white dark:border-t-gray-900 rounded-full animate-spin"></div>
                             Updating...
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};
