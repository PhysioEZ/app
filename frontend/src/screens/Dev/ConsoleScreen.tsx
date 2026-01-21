import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, MdPlayArrow, MdWarning, MdCheck, MdDelete, MdLightMode, MdDarkMode
} from 'react-icons/md';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../hooks';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

const ConsoleScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    type Category = 'Quick' | 'Patients' | 'Registration' | 'Tests' | 'Dev' | 'Finance';
    const [category, setCategory] = useState<Category>('Quick');

    // Categorized Presets - Based on Live DB Analysis
    const allPresets: Record<Category, { label: string, sql: string, color: string }[]> = {
        'Quick': [
            { label: 'Today Activity', sql: "SELECT 'Attendance' as type, COUNT(*) as count FROM attendance WHERE attendance_date = CURDATE() UNION SELECT 'Payments', COUNT(*) FROM payments WHERE payment_date = CURDATE() UNION SELECT 'Registrations', COUNT(*) FROM registration WHERE DATE(created_at) = CURDATE()", color: 'bg-purple-500' },
            { label: 'Pending Approvals', sql: "SELECT * FROM attendance WHERE status = 'pending' ORDER BY approval_request_at DESC LIMIT 20", color: 'bg-amber-500' },
            { label: 'Recent Audit', sql: "SELECT log_id, log_timestamp, username, action_type, target_table FROM audit_log ORDER BY log_id DESC LIMIT 30", color: 'bg-blue-500' },
            { label: 'Active Staff', sql: "SELECT employee_id, first_name, last_name, email, role_id FROM employees WHERE is_active = 1", color: 'bg-emerald-500' }
        ],
        'Registration': [
            { label: 'Pending Consults', sql: "SELECT registration_id, patient_name, phone_number, appointment_date, consultation_type FROM registration WHERE status = 'Pending' ORDER BY appointment_date ASC", color: 'bg-orange-500' },
            { label: 'Today Reg', sql: "SELECT registration_id, patient_name, phone_number, consultation_amount, payment_method, created_at FROM registration WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC", color: 'bg-green-500' },
            { label: 'Pending Commission', sql: "SELECT registration_id, patient_name, commission_amount, referral_partner_id FROM registration WHERE commission_status = 'pending' AND commission_amount > 0", color: 'bg-rose-500' },
            { label: 'Staff Performance', sql: "SELECT e.first_name, e.last_name, COUNT(r.registration_id) as total_regs, SUM(r.consultation_amount) as revenue FROM registration r JOIN employees e ON r.created_by_employee_id = e.employee_id WHERE DATE(r.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY e.employee_id ORDER BY total_regs DESC", color: 'bg-indigo-500' }
        ],
        'Patients': [
            { label: 'Active Treatments', sql: "SELECT p.patient_id, pm.full_name, p.treatment_type, p.treatment_days, p.due_amount, p.start_date FROM patients p JOIN patient_master pm ON p.master_patient_id = pm.master_patient_id WHERE p.status = 'active'", color: 'bg-emerald-500' },
            { label: 'Today Attendance', sql: "SELECT a.attendance_id, pm.full_name, a.attendance_date, a.status, e.first_name as marked_by FROM attendance a JOIN patients p ON a.patient_id = p.patient_id JOIN patient_master pm ON p.master_patient_id = pm.master_patient_id LEFT JOIN employees e ON a.marked_by_employee_id = e.employee_id WHERE a.attendance_date = CURDATE()", color: 'bg-cyan-500' },
            { label: 'High Dues', sql: "SELECT p.patient_id, pm.full_name, pm.phone_number, p.due_amount, p.treatment_type FROM patients p JOIN patient_master pm ON p.master_patient_id = pm.master_patient_id WHERE p.due_amount > 500 ORDER BY p.due_amount DESC", color: 'bg-rose-500' },
            { label: 'Attendance Stats', sql: "SELECT pm.full_name, COUNT(a.attendance_id) as total_visits, MAX(a.attendance_date) as last_visit FROM attendance a JOIN patients p ON a.patient_id = p.patient_id JOIN patient_master pm ON p.master_patient_id = pm.master_patient_id WHERE a.status = 'present' GROUP BY p.patient_id ORDER BY total_visits DESC LIMIT 20", color: 'bg-purple-500' }
        ],
        'Tests': [
            { label: 'Pending Tests', sql: "SELECT test_id, test_uid, patient_name, test_name, assigned_test_date, test_done_by FROM tests WHERE test_status = 'pending' ORDER BY assigned_test_date ASC", color: 'bg-yellow-500' },
            { label: 'Today Tests', sql: "SELECT test_id, test_uid, patient_name, test_name, total_amount, payment_status FROM tests WHERE DATE(created_at) = CURDATE()", color: 'bg-green-500' },
            { label: 'Test Revenue', sql: "SELECT test_name, COUNT(*) as count, SUM(total_amount) as revenue FROM tests WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY test_name ORDER BY revenue DESC", color: 'bg-blue-500' },
            { label: 'Pending Payments', sql: "SELECT t.test_id, t.patient_name, t.test_name, t.total_amount, t.advance_amount, t.due_amount FROM tests t WHERE t.payment_status IN ('pending', 'partial') ORDER BY t.created_at DESC", color: 'bg-rose-500' }
        ],
        'Finance': [
             { label: 'Daily Collection', sql: "SELECT DATE(payment_date) as day, COUNT(*) as transactions, SUM(amount) as total FROM payments WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY day ORDER BY day DESC", color: 'bg-emerald-500' },
             { label: 'Today Payments', sql: "SELECT p.payment_id, pm.full_name, p.amount, p.mode, e.first_name as processed_by FROM payments p JOIN patients pat ON p.patient_id = pat.patient_id JOIN patient_master pm ON pat.master_patient_id = pm.master_patient_id LEFT JOIN employees e ON p.processed_by_employee_id = e.employee_id WHERE p.payment_date = CURDATE() ORDER BY p.created_at DESC", color: 'bg-blue-500' },
             { label: 'Payment Methods', sql: "SELECT mode, COUNT(*) as count, SUM(amount) as total FROM payments WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY mode ORDER BY total DESC", color: 'bg-indigo-500' },
             { label: 'Expenses Today', sql: "SELECT expense_id, expense_for, amount, description, paid_to, created_at FROM expenses WHERE DATE(expense_date) = CURDATE() ORDER BY created_at DESC", color: 'bg-amber-500' }
        ],
        'Dev': [
            { label: 'System Issues', sql: "SELECT issue_id, description, status, release_schedule, reported_by, created_at FROM system_issues ORDER BY created_at DESC LIMIT 20", color: 'bg-rose-500' },
            { label: 'Push Tokens', sql: "SELECT platform, COUNT(*) as users, MAX(last_updated) as last_active FROM user_device_tokens GROUP BY platform", color: 'bg-cyan-500' },
            { label: 'Recent Logins', sql: "SELECT username, action_type, log_timestamp, ip_address FROM audit_log WHERE action_type LIKE '%login%' ORDER BY log_timestamp DESC LIMIT 20", color: 'bg-purple-500' },
            { label: 'DB Activity', sql: "SELECT target_table, action_type, COUNT(*) as operations FROM audit_log WHERE log_timestamp >= DATE_SUB(NOW(), INTERVAL 1 DAY) GROUP BY target_table, action_type ORDER BY operations DESC", color: 'bg-pink-500' },
            { label: 'Notifications', sql: "SELECT notification_id, employee_id, message, created_at FROM notifications ORDER BY created_at DESC LIMIT 20", color: 'bg-indigo-500' },
            { label: 'Chat Messages', sql: "SELECT message_id, sender_employee_id, receiver_employee_id, message_text, created_at FROM chat_messages ORDER BY created_at DESC LIMIT 20", color: 'bg-blue-500' }
        ]
    };

    const runQuery = async (forceConfirm = false) => {
        if (!query.trim()) return;
        setLoading(true);
        setMessage(null);
        setError(null);
        setShowConfirm(false);
        setResults([]);

        try {
            const res = await fetch(`${API_URL}/dev/sql_console.php`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                },
                body: JSON.stringify({ 
                    action: 'query', 
                    query: query,
                    confirmed: forceConfirm,
                    employee_id: user?.employee_id || '1'
                })
            });
            const data = await res.json();

            if (data.status === 'warning') {
                setShowConfirm(true);
                setMessage(data.message);
            } else if (data.status === 'success') {
                setResults(data.rows);
                setMessage(data.message);
            } else {
                setError(data.message);
            }
        } catch (err: any) {
            setError(err.message || 'Network Error');
        } finally {
            setLoading(false);
        }
    };

    const selectPreset = (sql: string) => {
        setQuery(sql);
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/20 dark:to-transparent pointer-events-none z-0" />
            
            {/* Header */}
            <header className="px-6 py-6 pt-12 flex items-center justify-between z-30 relative">
                <div className="animate-fade-in">
                   <p className="text-[10px] font-medium text-gray-500/70 dark:text-gray-500 uppercase tracking-[0.2em] mb-0.5">
                     SQL Console
                   </p>
                   <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
                     Query Editor
                   </h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleTheme} 
                        className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                    >
                        {theme === 'dark' ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
                    </button>
                    
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                    >
                        <MdArrowBack size={18} />
                    </button>
                </div>
            </header>

            <main className="flex-1 px-6 overflow-y-auto z-10 no-scrollbar pb-32 relative">
                
                {/* Query Editor Card */}
                <section className="mb-8 animate-scale-in">
                    <div className="bg-indigo-600 dark:bg-indigo-900 rounded-[36px] p-8 shadow-[0_12px_40px_rgba(79,70,229,0.3)] text-white relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[60px]" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                    <MdPlayArrow size={18} className="text-white" />
                                </div>
                                <span className="text-[10px] font-medium text-white/70 uppercase tracking-[0.2em]">Execute Query</span>
                            </div>
                            
                            <textarea 
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="SELECT * FROM users LIMIT 10;"
                                className="w-full h-32 bg-white/10 backdrop-blur-sm p-4 rounded-[20px] border border-white/20 font-mono text-sm leading-relaxed text-white focus:outline-none focus:ring-2 focus:ring-white/30 resize-none placeholder-white/40"
                                spellCheck={false}
                            />
                            
                            <div className="flex items-center gap-3 mt-4">
                                <button 
                                    onClick={() => runQuery(false)}
                                    disabled={loading || !query.trim()}
                                    className="px-6 py-3 rounded-[20px] bg-white text-indigo-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Executing...' : <><MdPlayArrow size={16} /> Run Query</>}
                                </button>
                                
                                <button 
                                    onClick={() => { setQuery(''); setResults([]); setMessage(null); setError(null); }}
                                    className="px-6 py-3 rounded-[20px] bg-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/20 transition-all active:scale-95"
                                >
                                    <MdDelete size={16} /> Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Material 3 Style Query Chips */}
                <section className="mb-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Quick Queries</h3>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                    </div>
                    
                    {/* Category Filter Chips */}
                    <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-2">
                        {(Object.keys(allPresets) as Category[]).map((cat) => (
                            <button 
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                    category === cat 
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-600 dark:border-indigo-500' 
                                    : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Query Suggestion Chips */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {allPresets[category].map((p, i) => (
                            <button 
                                key={i}
                                onClick={() => selectPreset(p.sql)}
                                className="px-4 py-2.5 rounded-full bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 text-xs font-medium whitespace-nowrap border-2 border-gray-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <span>{p.label}</span>
                                <MdPlayArrow size={14} className="opacity-50" />
                            </button>
                        ))}
                    </div>
                </section>

                {/* Results Section */}
                <section className="mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    
                    {/* Confirmation Modal */}
                    {showConfirm && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] shadow-2xl border border-gray-100 dark:border-white/5 w-full max-w-sm text-center">
                                <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-500 mx-auto flex items-center justify-center mb-4">
                                    <MdWarning size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Destructive Query</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                                    This operation will modify database records.<br/>
                                    <span className="font-mono text-rose-500 mt-2 block break-all text-[10px] bg-rose-50 dark:bg-rose-900/10 p-3 rounded-[16px] border border-rose-100 dark:border-rose-900/30">{query}</span>
                                </p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowConfirm(false)}
                                        className="flex-1 py-3 rounded-[20px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => runQuery(true)}
                                        className="flex-1 py-3 rounded-[20px] bg-rose-600 text-white font-bold text-xs uppercase shadow-lg shadow-rose-500/30 hover:bg-rose-500 transition-colors"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-white dark:bg-zinc-900/80 p-5 rounded-[24px] border border-rose-200 dark:border-rose-900/40 shadow-sm mb-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 shrink-0">
                                    <MdWarning size={16} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-1">Query Error</h4>
                                    <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">{error}</pre>
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && !error && results.length === 0 && message && (
                        <div className="bg-white dark:bg-zinc-900/80 p-5 rounded-[24px] border border-gray-200 dark:border-zinc-800 shadow-sm mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 shrink-0">
                                    <MdCheck size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400">No Data Found</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Query executed successfully but returned 0 rows</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {results.length > 0 && (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {/* Total Rows Card */}
                                <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-[20px] border border-gray-100 dark:border-white/5 shadow-sm">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Records</p>
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{results.length}</p>
                                </div>

                                {/* Dynamic Metric Cards based on data */}
                                {(() => {
                                    const keys = Object.keys(results[0]);
                                    const numericKeys = keys.filter(key => 
                                        results.some(row => typeof row[key] === 'number' || !isNaN(parseFloat(row[key])))
                                    );
                                    
                                    // Find sum/count columns
                                    const sumKey = numericKeys.find(k => 
                                        k.toLowerCase().includes('total') || 
                                        k.toLowerCase().includes('amount') || 
                                        k.toLowerCase().includes('revenue') ||
                                        k.toLowerCase().includes('count')
                                    );
                                    
                                    if (sumKey) {
                                        const sum = results.reduce((acc, row) => {
                                            const val = parseFloat(row[sumKey]);
                                            return acc + (isNaN(val) ? 0 : val);
                                        }, 0);
                                        
                                        const isCurrency = sumKey.toLowerCase().includes('amount') || 
                                                          sumKey.toLowerCase().includes('revenue') ||
                                                          sumKey.toLowerCase().includes('total');
                                        
                                        return (
                                            <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-[20px] border border-gray-100 dark:border-white/5 shadow-sm">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                    {sumKey.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                                    {isCurrency ? `₹${sum.toFixed(2)}` : sum.toFixed(0)}
                                                </p>
                                            </div>
                                        );
                                    }
                                    
                                    // Show unique count for status/type columns
                                    const statusKey = keys.find(k => 
                                        k.toLowerCase().includes('status') || 
                                        k.toLowerCase().includes('type')
                                    );
                                    
                                    if (statusKey) {
                                        const uniqueValues = [...new Set(results.map(r => r[statusKey]))].length;
                                        return (
                                            <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-[20px] border border-gray-100 dark:border-white/5 shadow-sm">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                    Unique {statusKey.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{uniqueValues}</p>
                                            </div>
                                        );
                                    }
                                    
                                    return null;
                                })()}
                            </div>

                            {/* Detailed Table */}
                            <div className="bg-white dark:bg-zinc-900/80 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                                <div className="px-5 py-3 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Detailed Results</h3>
                                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full">{results.length} Rows</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 dark:bg-zinc-800/30">
                                            <tr>
                                                {Object.keys(results[0]).map((key) => (
                                                    <th key={key} className="p-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5 whitespace-nowrap uppercase tracking-wider">
                                                        {key}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                            {results.map((row, i) => (
                                                <tr key={i} className="hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors">
                                                    {Object.values(row).map((val: any, j) => (
                                                        <td key={j} className="p-3 text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-nowrap max-w-[200px] truncate">
                                                            {val === null ? <span className="text-gray-400 dark:text-gray-600 italic">null</span> : String(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
};

export default ConsoleScreen;
