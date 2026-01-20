import { useState, useEffect, useMemo } from 'react';
import { 
  MdArrowBack, MdSearch, MdCheckCircle, MdSentimentSatisfied, 
  MdSentimentNeutral, MdSentimentDissatisfied, MdAccessTime, 
  MdMessage, MdArrowForward, MdExpandMore, MdTrendingUp
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// --- Type Definitions ---
type Patient = {
    patient_id: string | number;
    patient_name: string;
    phone_number: string;
    status: string;
};

type Feedback = {
    id: number;
    patient_name: string;
    staff_name: string;
    feedback_type: 'Good' | 'Average' | 'Bad';
    patient_status_snapshot: string;
    comments: string;
    created_at: string;
};

// --- Stats Card Component ---
const StatsCard = ({ icon: Icon, label, value, trend, color, delay = 0 }: any) => (
    <div 
        className={`bg-surface dark:bg-gray-900 rounded-[24px] p-4 shadow-sm border border-outline-variant/10 dark:border-gray-800 animate-slide-up`}
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl ${color}`}>
                <Icon size={18} className="text-white" />
            </div>
            {trend && (
                <div className="flex items-center gap-1 bg-surface-variant/50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    <MdTrendingUp size={10} className="text-green-500" />
                    <span className="text-[9px] font-bold text-outline dark:text-gray-400">{trend}</span>
                </div>
            )}
        </div>
        <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-black font-poppins text-on-surface dark:text-white">{value}</h3>
    </div>
);

export const FeedbackScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    // State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    
    // Form State
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const [feedbackType, setFeedbackType] = useState<string>('Good');
    const [status, setStatus] = useState<string>('active');
    const [comments, setComments] = useState('');

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
            const branchId = user?.branch_id || 1;
            const res = await fetch(`${baseUrl}/feedback.php?branch_id=${branchId}`);
            const json = await res.json();
            
            if (json.status === 'success') {
                setPatients(json.patients || []);
                setFeedbacks(json.feedbacks || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter Suggestions
    const filteredPatients = useMemo(() => {
        if (!searchTerm) return [];
        return patients.filter(p => 
            p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.phone_number.includes(searchTerm)
        ).slice(0, 5);
    }, [searchTerm, patients]);

    const handleSelectPatient = (p: Patient) => {
        setSelectedPatient(p);
        setSearchTerm(p.patient_name);
        setShowSuggestions(false);
        
        let mappedStatus = 'active';
        if (p.status === 'completed') mappedStatus = 'completed';
        if (p.status === 'inactive') mappedStatus = 'discontinued';
        setStatus(mappedStatus);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) {
            alert("Please select a valid patient");
            return;
        }

        setSubmitting(true);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
            const branchId = user?.branch_id || 1;
            
            const res = await fetch(`${baseUrl}/feedback.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    branch_id: branchId,
                    user_id: user?.id || 0,
                    patient_id: selectedPatient.patient_id,
                    feedback_type: feedbackType,
                    patient_status: status,
                    comments: comments
                })
            });
            const json = await res.json();
            
            if (json.status === 'success') {
                setComments('');
                setSearchTerm('');
                setSelectedPatient(null);
                setFeedbackType('Good');
                fetchData();
            } else {
                alert(json.message || "Failed to save");
            }
        } catch (err) {
            console.error(err);
            alert("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate stats
    const stats = {
        total: feedbacks.length,
        good: feedbacks.filter(f => f.feedback_type === 'Good').length,
        average: feedbacks.filter(f => f.feedback_type === 'Average').length,
        bad: feedbacks.filter(f => f.feedback_type === 'Bad').length,
    };



    return (
        <div className="flex flex-col h-full bg-surface dark:bg-black font-sans transition-colors relative">
            {/* Primary Gradient Mesh */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/30 to-transparent pointer-events-none z-0 dark:from-primary/10" />

            {/* Header */}
            <div className="bg-transparent backdrop-blur-xl sticky top-0 z-20 pt-[max(env(safe-area-inset-top),32px)] transition-colors border-b border-outline-variant/5">
                <div className="px-5 py-3 mb-2">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-surface-variant/40 text-on-surface dark:text-white transition-colors">
                            <MdArrowBack size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight">Feedback</h1>
                            <p className="text-xs font-medium text-outline/80 dark:text-gray-400">Patient Experience</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-5 no-scrollbar relative z-10">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <StatsCard 
                        icon={MdSentimentSatisfied}
                        label="Positive"
                        value={stats.good}
                        // trend="+15%"
                        color="bg-green-500"
                        delay={0}
                    />
                    <StatsCard 
                        icon={MdSentimentNeutral}
                        label="Neutral"
                        value={stats.average}
                        color="bg-amber-500"
                        delay={50}
                    />
                    <StatsCard 
                        icon={MdSentimentDissatisfied}
                        label="Negative"
                        value={stats.bad}
                        color="bg-red-500"
                        delay={100}
                    />
                </div>

                {/* Form Card */}
                <div className="bg-surface dark:bg-gray-900 rounded-[32px] p-6 shadow-lg border border-outline-variant/10 dark:border-gray-800 relative overflow-hidden animate-slide-up" style={{ animationDelay: '150ms' }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        
                        {/* Patient Search */}
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider ml-1">Patient Name</label>
                            <div className="relative">
                                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-outline dark:text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setShowSuggestions(true); setSelectedPatient(null); }}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Search patient..." 
                                    className="w-full bg-surface-variant/50 dark:bg-gray-800 border border-outline-variant/20 dark:border-gray-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-on-surface dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-outline/50"
                                />
                                {selectedPatient && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 animate-slide-up">
                                        <MdCheckCircle size={20} />
                                    </div>
                                )}
                            </div>
                            
                            {/* Suggestions Dropdown */}
                            {showSuggestions && searchTerm && !selectedPatient && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-surface dark:bg-gray-800 rounded-2xl shadow-xl border border-outline-variant/10 dark:border-gray-700 z-50 overflow-hidden animate-slide-up">
                                    {filteredPatients.length > 0 ? (
                                        filteredPatients.map(p => (
                                            <div 
                                                key={p.patient_id}
                                                onClick={() => handleSelectPatient(p)}
                                                className="px-4 py-3 hover:bg-surface-variant/50 dark:hover:bg-gray-700 cursor-pointer border-b border-outline-variant/10 dark:border-gray-700/50 last:border-0 flex justify-between items-center group transition-colors"
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-on-surface dark:text-white">{p.patient_name}</p>
                                                    <p className="text-xs text-outline dark:text-gray-400 font-mono">{p.phone_number}</p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MdArrowForward size={16} className="text-primary" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-xs text-outline dark:text-gray-400">No patients found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Rating Selection */}
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider ml-1">Experience</label>
                             <div className="grid grid-cols-3 gap-3">
                                 {[
                                     { val: 'Good', icon: MdSentimentSatisfied, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
                                     { val: 'Average', icon: MdSentimentNeutral, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
                                     { val: 'Bad', icon: MdSentimentDissatisfied, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
                                 ].map((opt) => (
                                     <button
                                         key={opt.val}
                                         type="button"
                                         onClick={() => setFeedbackType(opt.val)}
                                         className={`relative flex flex-col items-center justify-center p-4 h-24 rounded-2xl border-2 transition-all active:scale-95 ${
                                             feedbackType === opt.val 
                                             ? `${opt.bg} ${opt.border} shadow-lg scale-[1.02]` 
                                             : 'bg-surface-variant/30 dark:bg-gray-800/30 border-transparent opacity-60 hover:opacity-100'
                                         }`}
                                     >
                                         <opt.icon size={36} className={`mb-2 ${feedbackType === opt.val ? opt.color : 'text-outline dark:text-gray-500'}`} />
                                         <span className={`text-[10px] font-black uppercase ${feedbackType === opt.val ? 'text-on-surface dark:text-white' : 'text-outline dark:text-gray-500'}`}>{opt.val}</span>
                                     </button>
                                 ))}
                             </div>
                        </div>

                        {/* Status Dropdown */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider ml-1">Treatment Status</label>
                            <div className="relative">
                                <select 
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    className="w-full appearance-none bg-surface-variant/50 dark:bg-gray-800 border border-outline-variant/20 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-on-surface dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                >
                                    <option value="active">🟢 Ongoing (Active)</option>
                                    <option value="completed">🔵 Treatment Completed</option>
                                    <option value="discontinued">🔴 Discontinued / Stopped</option>
                                </select>
                                <MdExpandMore className="absolute right-4 top-1/2 -translate-y-1/2 text-outline dark:text-gray-400 pointer-events-none" size={20} />
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider ml-1">Comments</label>
                             <textarea 
                                 value={comments}
                                 onChange={e => setComments(e.target.value)}
                                 rows={3}
                                 placeholder="Add details..."
                                 className="w-full bg-surface-variant/50 dark:bg-gray-800 border border-outline-variant/20 dark:border-gray-700 rounded-2xl p-4 text-sm font-medium text-on-surface dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none placeholder:text-outline/50"
                             />
                        </div>

                        <button 
                            type="submit"
                            disabled={submitting || !selectedPatient}
                            className="w-full py-4 rounded-2xl bg-primary text-on-primary font-black uppercase tracking-widest text-sm shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div> : <MdCheckCircle size={20} />}
                            Save Feedback
                        </button>

                    </form>
                </div>

                {/* Recent List */}
                <div>
                     <div className="flex items-center justify-between px-2 mb-3">
                         <h3 className="text-sm font-bold font-poppins text-on-surface dark:text-white uppercase tracking-wider">Recent Activity</h3>
                         <span className="text-[10px] font-bold bg-surface-variant/50 dark:bg-gray-800 px-2.5 py-1 rounded-full text-outline dark:text-gray-400">{feedbacks.length} Entries</span>
                     </div>
                     
                     <div className="space-y-3">
                         {feedbacks.length === 0 && !loading && (
                             <div className="text-center py-16 opacity-50">
                                 <MdMessage size={48} className="mx-auto mb-3 text-outline dark:text-gray-600" />
                                 <p className="text-sm font-bold text-outline dark:text-gray-400">No feedback yet</p>
                             </div>
                         )}

                         {feedbacks.map((item, idx) => (
                             <div key={item.id} className="bg-surface dark:bg-gray-900 p-4 rounded-[24px] shadow-sm border border-outline-variant/10 dark:border-gray-800 flex flex-col gap-3 animate-slide-up" style={{ animationDelay: `${idx * 30}ms` }}>
                                 <div className="flex justify-between items-start">
                                     <div className="flex items-center gap-3 flex-1 min-w-0">
                                         <div className="w-12 h-12 rounded-2xl bg-surface-variant/50 dark:bg-gray-800 flex items-center justify-center text-base font-black text-primary shrink-0">
                                             {item.patient_name.charAt(0)}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                             <h4 className="text-sm font-bold text-on-surface dark:text-white truncate">{item.patient_name}</h4>
                                             <p className="text-[10px] text-outline dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                                 <MdAccessTime size={10} /> 
                                                 {new Date(item.created_at).toLocaleDateString('en-IN')} • {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                             </p>
                                         </div>
                                     </div>
                                     <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shrink-0 ${
                                         item.feedback_type === 'Good' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                         item.feedback_type === 'Bad' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                                         'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                     }`}>
                                         {item.feedback_type === 'Good' && <MdSentimentSatisfied size={12} />}
                                         {item.feedback_type === 'Average' && <MdSentimentNeutral size={12} />}
                                         {item.feedback_type === 'Bad' && <MdSentimentDissatisfied size={12} />}
                                         {item.feedback_type}
                                     </div>
                                 </div>
                                 
                                 {item.comments && (
                                     <div className="bg-surface-variant/30 dark:bg-gray-800/50 p-3 rounded-2xl">
                                         <p className="text-xs text-on-surface-variant dark:text-gray-300 font-medium italic leading-relaxed">"{item.comments}"</p>
                                     </div>
                                 )}

                                 <div className="flex justify-between items-center border-t border-outline-variant/10 dark:border-gray-800 pt-2.5">
                                     <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full ${
                                        item.patient_status_snapshot === 'active' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 
                                        item.patient_status_snapshot === 'completed' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
                                        'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' 
                                     }`}>
                                         {item.patient_status_snapshot}
                                     </span>
                                     <span className="text-[9px] font-bold text-outline/50 dark:text-gray-500 uppercase tracking-widest">By {item.staff_name || 'Staff'}</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackScreen;
