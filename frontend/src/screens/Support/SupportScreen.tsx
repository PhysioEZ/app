import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Ticket, Clock, CheckCircle, Upload, Reply, X, Activity, 
  HelpCircle, MessageCircle, FileText, Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// --- Components ---

const IssueDetailsModal = ({ issueId, onClose }: { issueId: number; onClose: () => void }) => {
    const { user } = useAuthStore();
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
                const branchId = user?.branch_id || 1;
                const res = await fetch(`${baseUrl}/support.php?id=${issueId}&branch_id=${branchId}`);
                const json = await res.json();
                if (json.status === 'success') {
                    setDetails(json.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (issueId) fetchDetails();
    }, [issueId]);

    if (!issueId) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 scale-100 animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                           Ticket Details <span className="text-indigo-500 font-mono text-base">#{issueId}</span>
                        </h3>
                        {details && (
                             <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">
                                 Reported on {new Date(details.issue.created_at).toLocaleDateString()}
                             </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-white dark:bg-gray-700 text-gray-500 shadow-sm hover:scale-105 transition-transform">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white/50 dark:bg-gray-900/50">
                    {loading ? (
                        <div className="flex justify-center p-10"><Activity className="animate-spin text-indigo-500" size={32} /></div>
                    ) : details ? (
                        <>
                            {/* Meta Badges */}
                            <div className="flex flex-wrap gap-3">
                                {/* STATUS */}
                                <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 flex-1 min-w-[120px] shadow-sm border border-gray-100 dark:border-gray-600">
                                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-wider">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide ${
                                        details.issue.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                        details.issue.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {details.issue.status === 'pending' && <Clock size={12} />}
                                        {details.issue.status === 'resolved' && <CheckCircle size={12} />}
                                        {details.issue.status.replace('_', ' ')}
                                    </span>
                                </div>
                                
                                {/* RELEASE SCHEDULE */}
                                <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 flex-1 min-w-[120px] shadow-sm border border-gray-100 dark:border-gray-600">
                                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-wider">Release</p>
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                                        {details.issue.release_schedule?.replace('_', ' ') || 'Pending'}
                                    </span>
                                </div>

                                {/* DATE */}
                                <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 flex-1 min-w-[120px] shadow-sm border border-gray-100 dark:border-gray-600">
                                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-wider">Date</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <Clock size={14} className="text-gray-400" />
                                        {new Date(details.issue.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FileText size={14} /> Description
                                </h4>
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                    {details.issue.description}
                                </div>
                            </div>

                            {/* Attachments */}
                            {details.attachments && details.attachments.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                                        <ImageIcon size={14} /> Attachments
                                    </h4>
                                    <div className="flex gap-3 overflow-x-auto pb-4 px-1">
                                        {details.attachments.map((path: string, i: number) => {
                                            const imgUrl = path.startsWith('http') ? path : `https://prospine.in/admin/${path}`;
                                            return (
                                              <img 
                                                key={i} 
                                                src={imgUrl} 
                                                className="h-32 w-auto rounded-2xl border-2 border-white dark:border-gray-700 shadow-md object-cover hover:scale-105 transition-transform cursor-pointer" 
                                                alt={`Attachment ${i}`}
                                                onClick={() => setSelectedImage(imgUrl)}
                                              />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                             {/* Admin Response */}
                             {details.issue.admin_response && (
                                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 p-5 rounded-3xl border border-teal-100 dark:border-teal-800/30">
                                    <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Reply size={14}/> Admin Response
                                    </h4>
                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 p-4 rounded-2xl border border-white/50 backdrop-blur-sm">
                                        {details.issue.admin_response}
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider bg-teal-100 dark:bg-teal-900/50 px-2 py-1 rounded-lg">
                                            {details.issue.status === 'resolved' ? 'Resolved & Closed' : 'Update'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-10 opacity-50">
                            <HelpCircle size={48} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-sm font-bold text-gray-400">Failed to load details.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Viewer Overlay */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                    }}
                >
                    <button 
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:rotate-90"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={28} />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Full view" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg animate-in zoom-in-50 duration-300 shadow-2xl"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </div>
    );
};

export const SupportScreen = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    // State
    const [stats, setStats] = useState({ total: 0, in_progress: 0, pending: 0, completed: 0 });
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

    // Form
    const [desc, setDesc] = useState('');
    const [files, setFiles] = useState<FileList | null>(null);

    const fetchSupport = async () => {
        setLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
            const branchId = user?.branch_id || 1;
            const res = await fetch(`${baseUrl}/support.php?branch_id=${branchId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setStats(json.stats);
                setIssues(json.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSupport();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!desc.trim()) return;

        setSubmitting(true);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
            const branchId = user?.branch_id || 1;
            
            const formData = new FormData();
            formData.append('branch_id', branchId.toString());
            formData.append('user_id', (user?.id || 0).toString());
            formData.append('description', desc);
            if (files) {
                for (let i = 0; i < files.length; i++) {
                    formData.append('images[]', files[i]);
                }
            }

            const res = await fetch(`${baseUrl}/support.php`, {
                method: 'POST',
                body: formData
            });
            const json = await res.json();

            if (json.status === 'success') {
                setDesc('');
                setFiles(null);
                fetchSupport();
            } else {
                alert("Error: " + json.message);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to submit ticket.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900">
             {/* Header */}
             <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-5 py-4 pt-[var(--safe-area-inset-top,32px)] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
                    </button>
                    <div>
                         <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Support Center</h1>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Help & Documentation</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-6">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110"></div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider relative z-10">Total Tickets</p>
                         <div className="flex items-end justify-between mt-2 relative z-10">
                             <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</span>
                             <div className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-xl"><Ticket size={18} /></div>
                         </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110"></div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider relative z-10">In Progress</p>
                         <div className="flex items-end justify-between mt-2 relative z-10">
                             <span className="text-2xl font-black text-blue-500">{stats.in_progress}</span>
                             <div className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl"><Activity size={18} /></div>
                         </div>
                    </div>
                </div>

                {/* New Ticket Form */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 blur-3xl rounded-full"></div>
                    
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                <HelpCircle size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight">Need Help?</h2>
                                <p className="text-xs text-indigo-100 font-medium">Create a new support ticket</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <textarea 
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                className="w-full p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium text-white placeholder:text-indigo-200 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all resize-none shadow-inner"
                                placeholder="Describe your issue or feature request..."
                                rows={3}
                                required
                            />
                            <div className="flex gap-3">
                                <div className="flex-1 relative group">
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => setFiles(e.target.files)}
                                    />
                                    <div className="h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center gap-2 text-xs font-bold text-white group-hover:bg-white/20 transition-all">
                                        <Upload size={16} />
                                        <span>{files && files.length > 0 ? `${files.length} attached` : 'Attach'}</span>
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="flex-1 h-12 bg-white text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Activity className="animate-spin" size={16} /> : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Recent Tickets List */}
                <div>
                     <div className="flex items-center justify-between px-2 mb-4">
                         <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Recent Tickets</h3>
                         <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-gray-500">{issues.length} Items</span>
                     </div>
                     
                     <div className="space-y-4">
                        {loading ? (
                             <div className="text-center py-8 text-xs font-bold text-gray-300">Loading...</div>
                        ) : issues.length === 0 ? (
                             <div className="text-center py-10 opacity-50">
                                 <MessageCircle size={32} className="mx-auto mb-2 text-gray-300" />
                                 <p className="text-xs font-bold text-gray-400">No tickets found</p>
                             </div>
                        ) : (
                            issues.map((issue) => (
                                <div 
                                    key={issue.issue_id} 
                                    onClick={() => setSelectedIssueId(issue.issue_id)}
                                    className="bg-white dark:bg-gray-800 p-5 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3 active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                         <div className="flex items-center gap-3">
                                             <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                                                 issue.status === 'resolved' ? 'bg-emerald-500 shadow-emerald-500/30' : 
                                                 issue.status === 'pending' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-blue-500 shadow-blue-500/30'
                                             }`}>
                                                 {issue.status === 'resolved' ? <CheckCircle size={20} /> : <Ticket size={20} />}
                                             </div>
                                             <div>
                                                 <div className="flex items-center gap-2">
                                                     <span className="text-[10px] font-black uppercase text-gray-400">#{issue.issue_id}</span>
                                                     {issue.admin_response && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                                                 </div>
                                                 <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mt-0.5 line-clamp-1">{issue.description}</h4>
                                             </div>
                                         </div>
                                         <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                                              issue.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 
                                              issue.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                         }`}>
                                             {issue.status.replace('_', ' ')}
                                         </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center border-t border-gray-50 dark:border-gray-700/50 pt-3 mt-1">
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <Clock size={12} />
                                            <span className="text-[10px] font-bold">{new Date(issue.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {issue.admin_response && (
                                            <span className="flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase">
                                                <Reply size={12} /> Response
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                     </div>
                </div>
            </div>

            {selectedIssueId && (
                <IssueDetailsModal issueId={selectedIssueId} onClose={() => setSelectedIssueId(null)} />
            )}
        </div>
    );
};
