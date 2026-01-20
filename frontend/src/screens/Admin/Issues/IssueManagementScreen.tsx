import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdSearch, MdFilterList, MdMessage, MdCheckCircle, 
    MdPendingActions, MdError, MdClose, MdChevronLeft, MdSend, MdAdd,
    MdPerson, MdBusiness
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

const ADMIN_URL = 'https://prospine.in/admin';

interface Issue {
    issue_id: number;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    release_schedule?: 'immediate' | 'nightly' | 'next_release';
    release_date?: string;
    created_at: string;
    admin_response?: string;
    branch_name: string;
    reported_by_name: string;
    attachments?: string[];
}

const IssueManagementScreen: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeveloper, setIsDeveloper] = useState(false);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
    const [search, setSearch] = useState('');

    // Modal States
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    
    // Form States
    const [reportDescription, setReportDescription] = useState('');
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit States (Developer)
    const [editStatus, setEditStatus] = useState<string>('');
    const [editResponse, setEditResponse] = useState<string>('');
    const [editSchedule, setEditSchedule] = useState<string>('');

    const fetchIssues = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const empId = user.employee_id || user.id;
            let url = `${API_URL}/admin/issues.php?action=fetch_issues&user_id=${empId}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;

            const res = await fetch(url);
            const json = await res.json();
            
            if (json.status === 'success') {
                setIssues(json.data);
                setIsDeveloper(json.is_developer);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, statusFilter, search]);

    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    const handleReportIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportDescription.trim()) return;
        setIsSubmitting(true);
        try {
            const empId = user?.employee_id || user?.id;
            const formData = new FormData();
            formData.append('action', 'report_issue');
            formData.append('user_id', String(empId));
            formData.append('description', reportDescription);
            
            selectedImages.forEach(img => {
                formData.append('images[]', img);
            });

            const res = await fetch(`${API_URL}/admin/issues.php`, {
                method: 'POST',
                body: formData
            });
            const json = await res.json();
            if (json.status === 'success') {
                setShowReportModal(false);
                setReportDescription('');
                setSelectedImages([]);
                fetchIssues();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedImages(Array.from(e.target.files));
        }
    };

    const handleUpdateIssue = async () => {
        if (!selectedIssue || !user) return;
        setIsSubmitting(true);
        try {
            const empId = user.employee_id || user.id;
            const res = await fetch(`${API_URL}/admin/issues.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_issue',
                    issue_id: selectedIssue.issue_id,
                    user_id: empId,
                    status: editStatus,
                    admin_response: editResponse,
                    release_schedule: editSchedule
                })
            });
            const json = await res.json();
            if (json.status === 'success') {
                setSelectedIssue(null);
                fetchIssues();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (issue: Issue) => {
        setSelectedIssue(issue);
        setEditStatus(issue.status);
        setEditResponse(issue.admin_response || '');
        setEditSchedule(issue.release_schedule || 'next_release');
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', icon: <MdCheckCircle /> };
            case 'in_progress': return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: <MdPendingActions /> };
            default: return { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', icon: <MdError /> };
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-200 relative overflow-hidden font-sans">
            
            {/* Branded Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#fff1f2] via-[#fff1f2]/50 to-transparent dark:from-rose-900/10 dark:to-transparent pointer-events-none z-0" />

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
                            <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">Issue Tracker</h1>
                            <p className="text-[10px] font-medium text-rose-500 uppercase tracking-[0.2em] mt-2">Support & Feedback</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            className="w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/10 transition-all placeholder:text-gray-300"
                            placeholder="Find issue..."
                            value={search} 
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setStatusFilter(prev => prev === 'all' ? 'pending' : prev === 'pending' ? 'in_progress' : prev === 'in_progress' ? 'completed' : 'all')}
                        className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 active:scale-90 transition-all relative"
                    >
                        <MdFilterList size={20} />
                        {statusFilter !== 'all' && <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar p-5 pb-32 space-y-4 relative z-10">
                {loading ? (
                    <div className="py-20 text-center opacity-40 italic text-[10px] font-black uppercase tracking-widest">Scanning system...</div>
                ) : issues.length === 0 ? (
                    <div className="py-20 text-center opacity-40 italic text-[10px] font-black uppercase tracking-widest">No reports found</div>
                ) : (
                    issues.map(issue => {
                        const style = getStatusStyle(issue.status);
                        return (
                            <div 
                                key={issue.issue_id}
                                onClick={() => isDeveloper ? openEditModal(issue) : setSelectedIssue(issue)}
                                className="bg-white dark:bg-zinc-900/50 p-6 rounded-[32px] border border-white dark:border-white/5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${style.bg} ${style.text} border-current/10`}>
                                        {style.icon}
                                        {issue.status.replace('_', ' ')}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-300">#{issue.issue_id}</span>
                                </div>
                                
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 leading-relaxed uppercase">
                                    {issue.description}
                                </h3>

                                {issue.attachments && issue.attachments.length > 0 && (
                                    <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
                                        {issue.attachments.map((path, i) => (
                                            <div key={i} className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 bg-gray-50">
                                                <img 
                                                    src={`${ADMIN_URL}/${path}`} 
                                                    alt="Bug" 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {issue.admin_response && (
                                    <div className="bg-rose-500/5 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-500/10 mb-4 flex gap-3">
                                        <div className="shrink-0 pt-1 text-rose-500">
                                            <MdMessage size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Resolution</p>
                                            <p className="text-[11px] font-medium text-gray-700 dark:text-zinc-300 leading-relaxed italic">{issue.admin_response}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1.5 opacity-50">
                                            <MdPerson size={12} className="text-rose-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{issue.reported_by_name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-50">
                                            <MdBusiness size={12} className="text-gray-400" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{issue.branch_name}</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-gray-300 tracking-widest">{new Date(issue.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </main>

            {/* FAB Button */}
            {!isDeveloper && (
                <button 
                    onClick={() => setShowReportModal(true)}
                    className="fixed bottom-24 right-6 w-14 h-14 rounded-[24px] bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-2xl flex items-center justify-center active:scale-95 transition-all z-50 animate-in fade-in slide-in-from-bottom-6 duration-500"
                >
                    <MdAdd size={32} />
                </button>
            )}

            {/* Developer/Action Modal */}
            {selectedIssue && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-black w-full sm:max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-slide-up border border-white dark:border-white/5 flex flex-col">
                        <header className="p-10 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-light italic text-gray-900 dark:text-white">
                                    {isDeveloper ? 'Manage Issue' : 'Review Report'}
                                </h3>
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-2 px-2 py-1 bg-rose-500/10 rounded inline-block">
                                    REF #{selectedIssue.issue_id}
                                </p>
                            </div>
                            <button onClick={() => setSelectedIssue(null)} className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-900 text-gray-400 flex items-center justify-center active:scale-90 transition-all">
                                <MdClose size={24}/>
                            </button>
                        </header>
                        
                        <div className="flex-1 overflow-y-auto px-10 pb-10 no-scrollbar space-y-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Description</label>
                                <div className="p-6 bg-gray-50 dark:bg-zinc-900/50 rounded-3xl border border-gray-100 dark:border-white/5 italic text-sm text-gray-700 dark:text-zinc-300 leading-relaxed uppercase">
                                     {selectedIssue.description}
                                 </div>
                             </div>

                             {selectedIssue.attachments && selectedIssue.attachments.length > 0 && (
                                 <div className="space-y-3">
                                     <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Evidence</label>
                                     <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                         {selectedIssue.attachments.map((path, i) => (
                                             <div key={i} className="shrink-0 w-32 h-32 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm">
                                                 <img src={`${ADMIN_URL}/${path}`} className="w-full h-full object-cover" />
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}

                             {isDeveloper ? (
                                 <div className="space-y-6 animate-in fade-in duration-500">
                                     <div className="grid grid-cols-2 gap-4">
                                         <div className="space-y-3">
                                             <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Update Status</label>
                                             <select 
                                                 value={editStatus}
                                                 onChange={e => setEditStatus(e.target.value)}
                                                 className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-[10px] font-black uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/10 transition-all"
                                             >
                                                 <option value="pending">Pending</option>
                                                 <option value="in_progress">In Progress</option>
                                                 <option value="completed">Completed</option>
                                             </select>
                                         </div>
                                         <div className="space-y-3">
                                             <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Schedule</label>
                                             <select 
                                                 value={editSchedule}
                                                 onChange={e => setEditSchedule(e.target.value)}
                                                 className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-[10px] font-black uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/10 transition-all"
                                             >
                                                 <option value="immediate">Immediate</option>
                                                 <option value="nightly">Nightly Build</option>
                                                 <option value="next_release">Next Release</option>
                                             </select>
                                         </div>
                                     </div>

                                     <div className="space-y-3">
                                         <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Resolution Notes</label>
                                         <textarea 
                                             rows={4}
                                             className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-3xl py-4 px-6 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/10 transition-all resize-none italic"
                                             placeholder="Explain the fix..."
                                             value={editResponse}
                                             onChange={e => setEditResponse(e.target.value)}
                                         />
                                     </div>

                                     <button 
                                         onClick={handleUpdateIssue}
                                         disabled={isSubmitting}
                                         className="w-full h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[28px] font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 disabled:opacity-30 transition-all"
                                     >
                                         {isSubmitting ? 'Syncing...' : 'Sync Updates'}
                                     </button>
                                 </div>
                             ) : selectedIssue.admin_response && (
                                 <div className="space-y-3">
                                     <label className="text-[9px] font-black text-rose-500 uppercase ml-2">Developer Feedback</label>
                                     <div className="p-6 bg-rose-500/5 dark:bg-rose-500/10 rounded-3xl border border-rose-500/10 text-sm text-gray-700 dark:text-zinc-300 italic">
                                         {selectedIssue.admin_response}
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {/* Report Issue Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-black w-full sm:max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-slide-up border border-white dark:border-white/5 flex flex-col max-h-[90vh]">
                        <header className="p-10 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-light italic text-gray-900 dark:text-white">Report Issue</h3>
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-2">Help us improve the system</p>
                            </div>
                            <button onClick={() => setShowReportModal(false)} className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-900 text-gray-400 flex items-center justify-center active:scale-90 transition-all">
                                <MdClose size={24}/>
                            </button>
                        </header>
                        
                        <form onSubmit={handleReportIssue} className="flex-1 overflow-y-auto px-10 pb-10 no-scrollbar space-y-6">
                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Describe what happened</label>
                                <textarea 
                                    required
                                    autoFocus
                                    rows={4}
                                    className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-[32px] py-6 px-8 text-lg font-light italic text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/10 transition-all resize-none"
                                    placeholder="The system says..."
                                    value={reportDescription}
                                    onChange={e => setReportDescription(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Add Proof (Optional)</label>
                                <div className="flex flex-wrap gap-2">
                                    <label className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 cursor-pointer hover:border-rose-500/30 transition-colors active:scale-95">
                                        <MdAdd size={24} />
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                    {selectedImages.map((file, i) => (
                                        <div key={i} className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 relative group">
                                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                            <button 
                                                type="button"
                                                onClick={() => setSelectedImages(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MdClose size={16} className="text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                disabled={isSubmitting || !reportDescription.trim()}
                                className="w-full h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[28px] font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 disabled:opacity-30 transition-all mt-4 flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? 'Sending...' : <><MdSend size={18} /> Submit Report</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .animate-fade-in { animation: fadeIn 0.2s ease-out; }
                .animate-slide-up { animation: slideUp 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default IssueManagementScreen;
