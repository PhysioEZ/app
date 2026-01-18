import { useState, useEffect } from 'react';
import { 
  MdArrowBack, MdCalendarToday, MdScience, MdPersonAdd, MdPeople, MdMessage,
  MdAttachMoney, MdShowChart, MdCheckCircle, MdAccessTime, MdTrendingUp,
  MdExpandMore, MdRefresh, MdFileDownload, MdInsights,
  MdDonutSmall, MdTimeline, MdWarning
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// --- Types ---
interface ReportTotals {
    [key: string]: number | string;
}

interface ReportItem {
    [key: string]: any;
}

// --- Consolidated Metrics Card Component ---
const ConsolidatedMetricsCard = ({ metrics, gradient, delay = 0 }: any) => (
    <div 
        className={`relative overflow-hidden rounded-[32px] p-6 text-white shadow-xl transition-all animate-slide-up ${gradient}`}
        style={{ animationDelay: `${delay}ms` }}
    >
        {/* Animated Background Orbs */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 bg-black/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold font-poppins">Financial Overview</h2>
                <MdShowChart size={20} className="opacity-80" />
            </div>
            
            {/* Metrics - Vertical Stack */}
            <div className="space-y-4">
                {metrics.map((metric: any, idx: number) => {
                    const Icon = metric.icon;
                    return (
                        <div key={idx} className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                                    <Icon size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider mb-1">{metric.label}</p>
                                    <h3 className="text-xl font-black font-poppins tracking-tight">{metric.value}</h3>
                                </div>
                            </div>
                            {metric.trend && (
                                <div className="flex items-center gap-1 bg-black/20 px-2.5 py-1 rounded-full">
                                    <MdTrendingUp size={12} className={metric.trend.startsWith('+') ? 'text-green-300' : 'text-red-300'} />
                                    <span className="text-xs font-bold">{metric.trend}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
);

// --- Interactive Chart Card ---
const ChartCard = ({ title, icon: Icon, children, delay = 0 }: any) => (
    <div 
        className="bg-surface dark:bg-gray-900 rounded-[32px] p-6 shadow-lg border border-outline-variant/10 dark:border-gray-800 hover:shadow-xl transition-all duration-300 animate-slide-up"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-xl">
                    <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-bold text-on-surface dark:text-white text-base">{title}</h3>
            </div>
            <button className="p-2 hover:bg-surface-variant/50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <MdExpandMore size={20} className="text-outline dark:text-gray-400" />
            </button>
        </div>
        {children}
    </div>
);

export const ReportsScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    // State
    const [activeTab, setActiveTab] = useState<'tests' | 'registration' | 'patients' | 'inquiry'>('tests');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
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
    const fetchReport = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        
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
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [activeTab, startDate, endDate]);

    const formatCurrency = (n: any) => {
        const num = Number(n);
        return isNaN(num) ? '₹0' : `₹${num.toLocaleString('en-IN')}`;
    };

    // --- Graph Data Processors ---
    const getTrendData = () => {
        console.log('getTrendData called, data length:', data.length);
        if (!data.length) {
            console.log('No data available for trend chart');
            return [];
        }
        
        // Group by date
        const groups: Record<string, { date: Date; count: number; label: string }> = {};
        
        data.forEach((item, index) => {
            // Try multiple date fields based on report type
            const dateStr = item.assigned_test_date || item.appointment_date || item.start_date || item.created_at;
            
            if (!dateStr) {
                console.log(`Item ${index} has no date field:`, Object.keys(item));
                return;
            }
            
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    console.log(`Invalid date for item ${index}:`, dateStr);
                    return;
                }
                
                const key = date.toISOString().split('T')[0]; // YYYY-MM-DD format for grouping
                const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                
                if (!groups[key]) {
                    groups[key] = { date, count: 0, label };
                }
                groups[key].count++;
            } catch (e) {
                console.error('Date parsing error for item', index, ':', e, dateStr);
            }
        });

        // Sort by date and take last 10 days
        const result = Object.values(groups)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(-10)
            .map(({ label, count }) => ({ label, value: count }));
        
        console.log('Trend data result:', result);
        return result;
    };

    const getDistributionData = () => {
        if (!data.length) return [];
        const groups: Record<string, number> = {};
        
        data.forEach(item => {
            let key = activeTab === 'tests' ? item.test_name : 
                        activeTab === 'patients' ? item.treatment_type : 
                        activeTab === 'inquiry' ? item.referralSource : item.gender;
            
            if (!key) return;
            key = key.toString().trim().toUpperCase();
            groups[key] = (groups[key] || 0) + 1;
        });

        const sorted = Object.entries(groups)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6);
            
        const total = sorted.reduce((sum, [, val]) => sum + val, 0);
        return sorted.map(([label, value], idx) => ({ 
            label, 
            value, 
            percent: Math.round((value / total) * 100),
            color: [
                'bg-violet-500', 'bg-pink-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'
            ][idx % 6]
        }));
    };

    // --- Chart Components ---
    const TrendChart = () => {
        const trend = getTrendData();
        if (!trend.length) return <div className="text-center py-8 text-outline dark:text-gray-500 text-sm">No trend data available</div>;
        
        const max = Math.max(...trend.map(t => t.value), 1); // Ensure max is at least 1
        
        // Extract month name from the first date
        const firstDate = data.find(item => 
            item.assigned_test_date || item.appointment_date || item.start_date || item.created_at
        );
        const monthName = firstDate 
            ? new Date(
                firstDate.assigned_test_date || 
                firstDate.appointment_date || 
                firstDate.start_date || 
                firstDate.created_at
            ).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
            : '';
        
        return (
            <div className="space-y-4">
                {/* Month Header */}
                {monthName && (
                    <div className="text-xs font-bold text-outline dark:text-gray-400 uppercase tracking-wider px-2">
                        {monthName}
                    </div>
                )}
                
                {/* Chart Container with Horizontal Scroll - Added pt-8 for tooltip space */}
                <div className="overflow-x-auto no-scrollbar pt-8">
                    <div className="h-48 flex items-end justify-start gap-2 px-2 min-w-full" style={{ minWidth: `${trend.length * 40}px` }}>
                        {trend.map((t, i) => {
                            const heightPercent = (t.value / max) * 100;
                            const heightPx = Math.max((heightPercent / 100) * 160, 8); // Min 8px height
                            // Extract just the day number from the label
                            const dayNumber = t.label.split(' ')[0]; // "7 Jan" -> "7"
                            
                            return (
                                <div key={i} className="flex flex-col items-center gap-2 group relative" style={{ minWidth: '32px' }}>
                                    {/* Bar Container */}
                                    <div className="w-full flex items-end justify-center" style={{ height: '160px' }}>
                                        <div 
                                            className="w-full max-w-[16px] bg-gradient-to-t from-primary to-primary/60 rounded-t-xl transition-all duration-700 ease-out hover:from-primary/80 hover:to-primary/40 cursor-pointer shadow-lg hover:shadow-primary/30 relative overflow-hidden"
                                            style={{ 
                                                height: `${heightPx}px`,
                                                minHeight: '8px'
                                            }}
                                        >
                                            {/* Shimmer effect */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent animate-shimmer"></div>
                                        </div>
                                    </div>
                                    
                                    {/* Tooltip - Fixed positioning */}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-20 pointer-events-none">
                                        {t.value} {t.value === 1 ? 'record' : 'records'}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 dark:bg-white rotate-45"></div>
                                    </div>
                                    
                                    {/* Label - Only Day Number */}
                                    <span className="text-[10px] font-bold text-outline dark:text-gray-500 text-center uppercase tracking-wide">
                                        {dayNumber}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-outline-variant/10 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-xs font-bold text-outline dark:text-gray-400">Daily Activity</span>
                    </div>
                </div>
            </div>
        );
    };

    // --- Distribution Chart Component ---
    const DistributionChart = () => {
        const dist = getDistributionData();
        if (!dist.length) return <div className="text-center py-8 text-outline dark:text-gray-500 text-sm">No distribution data</div>;

        return (
            <div className="space-y-4">
                {dist.map((d, i) => (
                    <div key={i} className="group animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-3 h-3 rounded-full ${d.color} shadow-lg`}></div>
                                <span className="text-sm font-bold text-on-surface dark:text-white truncate">{d.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-outline dark:text-gray-400">{d.value}</span>
                                <span className="text-sm font-black text-on-surface dark:text-white min-w-[45px] text-right">{d.percent}%</span>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 bg-surface-variant/30 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${d.color} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
                                style={{ width: `${d.percent}%`, animationDelay: `${i * 100}ms` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // --- Tab Configuration ---
    const tabs = [
        { id: 'tests', label: 'Lab Tests', icon: MdScience },
        { id: 'registration', label: 'Registration', icon: MdPersonAdd },
        { id: 'patients', label: 'Patients', icon: MdPeople },
        { id: 'inquiry', label: 'Inquiries', icon: MdMessage },
    ];

    // --- Render Consolidated Metrics ---
    const renderMetrics = () => {
        const metricsConfig = {
            tests: {
                gradient: 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600',
                metrics: [
                    { label: 'Total Revenue', value: formatCurrency(totals?.total_sum), icon: MdAttachMoney, trend: '+12%' },
                    { label: 'Collected', value: formatCurrency(totals?.paid_sum), icon: MdCheckCircle, trend: '+8%' },
                    { label: 'Outstanding', value: formatCurrency(totals?.due_sum), icon: MdAccessTime, trend: '-3%' },
                ]
            },
            registration: {
                gradient: 'bg-gradient-to-br from-blue-600 via-cyan-500 to-sky-600',
                metrics: [
                    { label: 'Consultation', value: formatCurrency(totals?.consulted_sum), icon: MdPersonAdd, trend: '+15%' },
                    { label: 'Pending', value: formatCurrency(totals?.pending_sum), icon: MdAccessTime, trend: '+5%' },
                    { label: 'Closed', value: formatCurrency(totals?.closed_sum), icon: MdCheckCircle, trend: '+2%' },
                ]
            },
            patients: {
                gradient: 'bg-gradient-to-br from-fuchsia-600 via-pink-600 to-rose-600',
                metrics: [
                    { label: 'Billed', value: formatCurrency(totals?.total_sum), icon: MdAttachMoney, trend: '+18%' },
                    { label: 'Received', value: formatCurrency(totals?.paid_sum), icon: MdCheckCircle, trend: '+10%' },
                    { label: 'Dues', value: formatCurrency(totals?.due_sum), icon: MdWarning, trend: '-5%' },
                ]
            },
            inquiry: {
                gradient: 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600',
                metrics: [
                    { label: 'Total Leads', value: totals?.total_inquiries || 0, icon: MdMessage, trend: '+20%' },
                    { label: 'Converted', value: totals?.registered_count || 0, icon: MdPersonAdd, trend: '+14%' },
                    { label: 'Pending', value: totals?.new_count || 0, icon: MdAccessTime, trend: '+6%' },
                ]
            },
        };

        const config = metricsConfig[activeTab];
        return <ConsolidatedMetricsCard {...config} delay={0} />;
    };

    return (
        <div className="flex flex-col h-full bg-surface dark:bg-black font-sans transition-colors relative overflow-hidden">
            
            {/* Animated Background Mesh */}
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/20 via-primary/10 to-transparent pointer-events-none z-0 dark:from-primary/10 dark:via-primary/5"></div>
            <div className="absolute top-20 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-tertiary/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

            {/* Header */}
            <div className="bg-transparent backdrop-blur-xl sticky top-0 z-30 pt-[max(env(safe-area-inset-top),32px)] transition-colors">
                <div className="px-5 py-4">
                    {/* Top Row */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/')} className="p-2.5 -ml-2 rounded-full hover:bg-surface-variant/40 dark:hover:bg-gray-800/50 text-on-surface dark:text-white transition-all active:scale-95">
                                <MdArrowBack size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight flex items-center gap-2">
                                    <MdInsights size={28} className="text-primary" />
                                    Analytics
                                </h1>
                                <p className="text-xs font-medium text-outline/80 dark:text-gray-400">Business Intelligence</p>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => fetchReport(true)}
                                disabled={refreshing}
                                className="p-2.5 rounded-xl bg-surface-variant/40 dark:bg-gray-800/50 hover:bg-surface-variant dark:hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <MdRefresh size={20} className={`text-on-surface dark:text-white ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <button className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 transition-all active:scale-95">
                                <MdFileDownload size={20} className="text-primary" />
                            </button>
                        </div>
                    </div>

                    {/* Date Range Picker */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-surface-variant/40 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/10 dark:border-gray-700/50 transition-all hover:border-primary/30">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-outline dark:text-gray-500 uppercase tracking-wider mb-2">
                                <MdCalendarToday size={12} /> Start Date
                            </label>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                className="bg-transparent w-full text-sm font-bold text-on-surface dark:text-white outline-none"
                            />
                        </div>
                        <div className="bg-surface-variant/40 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/10 dark:border-gray-700/50 transition-all hover:border-primary/30">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-outline dark:text-gray-500 uppercase tracking-wider mb-2">
                                <MdCalendarToday size={12} /> End Date
                            </label>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                className="bg-transparent w-full text-sm font-bold text-on-surface dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* Tab Pills */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                        flex items-center gap-2.5 px-5 py-3 rounded-full border-2 transition-all duration-300 whitespace-nowrap font-bold text-sm
                                        ${isActive 
                                            ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/30 scale-105' 
                                            : 'bg-surface dark:bg-gray-900 border-outline-variant/30 dark:border-gray-800 text-on-surface-variant dark:text-gray-400 hover:bg-surface-variant/50 dark:hover:bg-gray-800/50 hover:border-primary/30'}
                                    `}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-28 space-y-6 pt-4 no-scrollbar relative z-10">
                
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-bold text-outline dark:text-gray-400">Loading analytics...</p>
                    </div>
                ) : (
                    <>
                        {/* Consolidated Metrics */}
                        <div>
                            {renderMetrics()}
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ChartCard title="Activity Trend" icon={MdTimeline} delay={100}>
                                <TrendChart />
                            </ChartCard>
                            <ChartCard title="Distribution" icon={MdDonutSmall} delay={200}>
                                <DistributionChart />
                            </ChartCard>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportsScreen;
