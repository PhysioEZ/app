import { useState, useEffect } from 'react';
import { 
  MdArrowBack, MdConfirmationNumber, MdAccessTime, MdCheckCircle, MdUpload, 
  MdReply, MdClose, MdRefresh, MdHelpOutline, MdMessage, MdDescription, 
  MdImage, MdTrendingUp
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// --- Issue Details Modal ---
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="bg-surface dark:bg-gray-900 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-outline-variant/10 dark:border-gray-800 animate-slide-up">
                {/* Header */}
                <div className="px-6 py-5 border-b border-outline-variant/10 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold font-poppins text-on-surface dark:text-white flex items-center gap-2">
                           Ticket Details <span className="text-primary font-mono text-base">#{issueId}</span>
                        </h3>
                        {details && (
                             <p className="text-[10px] uppercase font-bold text-outline dark:text-gray-400 mt-1">
                                 Reported on {new Date(details.issue.created_at).toLocaleDateString('en-IN')}
                             </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-surface-variant dark:bg-gray-800 hover:bg-surface-variant/80 transition-colors">
                        <MdClose size={20} className="text-on-surface dark:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
                    {loading ? (
                        <div className="flex justify-center p-10">
                            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                        </div>
                    ) : details ? (
                        <>
                            {/* Status Badges */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl p-3 border border-outline-variant/10 dark:border-gray-700">
                                    <p className="text-[10px] font-bold uppercase text-outline dark:text-gray-400 mb-2">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                        details.issue.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                        details.issue.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                        {details.issue.status === 'pending' && <MdAccessTime size={12} />}
                                        {details.issue.status === 'resolved' && <MdCheckCircle size={12} />}
                                        {details.issue.status.replace('_', ' ')}
                                    </span>
                                </div>
                                
                                <div className="bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl p-3 border border-outline-variant/10 dark:border-gray-700">
                                    <p className="text-[10px] font-bold uppercase text-outline dark:text-gray-400 mb-2">Release</p>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 uppercase">
                                        {details.issue.release_schedule?.replace('_', ' ') || 'Pending'}
                                    </span>
                                </div>

                                <div className="bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl p-3 border border-outline-variant/10 dark:border-gray-700">
                                    <p className="text-[10px] font-bold uppercase text-outline dark:text-gray-400 mb-2">Date</p>
                                    <p className="text-xs font-bold text-on-surface dark:text-white flex items-center gap-1.5">
                                        <MdAccessTime size={12} className="text-outline dark:text-gray-400" />
                                        {new Date(details.issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-surface-variant/30 dark:bg-gray-800/50 p-5 rounded-[24px] border border-outline-variant/10 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-outline dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MdDescription size={14} /> Description
                                </h4>
                                <div className="text-sm font-medium text-on-surface dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                    {details.issue.description}
                                </div>
                            </div>

                            {/* Attachments */}
                            {details.attachments && details.attachments.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-outline dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <MdImage size={14} /> Attachments
                                    </h4>
                                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                        {details.attachments.map((path: string, i: number) => {
                                            const imgUrl = path.startsWith('http') ? path : `https://prospine.in/admin/${path}`;
                                            return (
                                              <img 
                                                key={i} 
                                                src={imgUrl} 
                                                className="h-32 w-auto rounded-2xl border-2 border-outline-variant/20 dark:border-gray-700 shadow-md object-cover hover:scale-105 transition-transform cursor-pointer" 
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
                                <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-[24px] border border-green-200 dark:border-green-800/30">
                                    <h4 className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <MdReply size={14}/> Admin Response
                                    </h4>
                                    <div className="text-sm font-medium text-on-surface dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 p-4 rounded-2xl">
                                        {details.issue.admin_response}
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider bg-green-100 dark:bg-green-900/50 px-2.5 py-1 rounded-full">
                                            {details.issue.status === 'resolved' ? 'Resolved & Closed' : 'Update'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-10 opacity-50">
                            <MdHelpOutline size={48} className="mx-auto mb-3 text-outline dark:text-gray-600" />
                            <p className="text-sm font-bold text-outline dark:text-gray-400">Failed to load details.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Viewer */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                        onClick={() => setSelectedImage(null)}
                    >
                        <MdClose size={28} />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Full view" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </div>
    );
};

// --- Stats Card Component ---
const StatsCard = ({ icon: Icon, label, value, color, delay = 0 }: any) => (
    <div 
        className={`bg-surface dark:bg-gray-900 rounded-[24px] p-4 shadow-sm border border-outline-variant/10 dark:border-gray-800 animate-slide-up`}
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl ${color}`}>
                <Icon size={18} className="text-white" />
            </div>
        </div>
        <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-black font-poppins text-on-surface dark:text-white">{value}</h3>
    </div>
);

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
                            <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight">Support Center</h1>
                            <p className="text-xs font-medium text-outline/80 dark:text-gray-400">Help & Documentation</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-5 no-scrollbar relative z-10">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <StatsCard 
                        icon={MdConfirmationNumber}
                        label="Total Tickets"
                        value={stats.total}
                        color="bg-primary"
                        delay={0}
                    />
                    <StatsCard 
                        icon={MdRefresh}
                        label="In Progress"
                        value={stats.in_progress}
                        color="bg-blue-500"
                        delay={50}
                    />
                </div>

                {/* New Ticket Form */}
                <div className="bg-surface dark:bg-gray-900 rounded-[32px] p-6 shadow-lg border border-outline-variant/10 dark:border-gray-800 relative overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-xl">
                                <MdHelpOutline size={20} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold font-poppins text-on-surface dark:text-white">Need Help?</h2>
                                <p className="text-xs text-outline dark:text-gray-400 font-medium">Create a new support ticket</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <textarea 
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                className="w-full p-4 rounded-2xl bg-surface-variant/50 dark:bg-gray-800 border border-outline-variant/20 dark:border-gray-700 text-sm font-medium text-on-surface dark:text-white placeholder:text-outline/50 focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none"
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
                                    <div className="h-12 rounded-2xl bg-surface-variant/50 dark:bg-gray-800 border border-outline-variant/20 dark:border-gray-700 flex items-center justify-center gap-2 text-xs font-bold text-on-surface dark:text-white group-hover:bg-surface-variant/80 transition-all">
                                        <MdUpload size={16} />
                                        <span>{files && files.length > 0 ? `${files.length} attached` : 'Attach'}</span>
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="flex-1 h-12 bg-primary text-on-primary rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div> : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Recent Tickets List */}
                <div>
                     <div className="flex items-center justify-between px-2 mb-3">
                         <h3 className="text-sm font-bold font-poppins text-on-surface dark:text-white uppercase tracking-wider">Recent Tickets</h3>
                         <span className="text-[10px] font-bold bg-surface-variant/50 dark:bg-gray-800 px-2.5 py-1 rounded-full text-outline dark:text-gray-400">{issues.length} Items</span>
                     </div>
                     
                     <div className="space-y-3">
                        {loading ? (
                             <div className="text-center py-8">
                                 <div className="w-8 h-8 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                             </div>
                        ) : issues.length === 0 ? (
                             <div className="text-center py-16 opacity-50">
                                 <MdMessage size={48} className="mx-auto mb-3 text-outline dark:text-gray-600" />
                                 <p className="text-sm font-bold text-outline dark:text-gray-400">No tickets found</p>
                             </div>
                        ) : (
                            issues.map((issue, idx) => (
                                <div 
                                    key={issue.issue_id} 
                                    onClick={() => setSelectedIssueId(issue.issue_id)}
                                    className="bg-surface dark:bg-gray-900 p-4 rounded-[24px] shadow-sm border border-outline-variant/10 dark:border-gray-800 flex flex-col gap-3 active:scale-[0.98] transition-all cursor-pointer animate-slide-up"
                                    style={{ animationDelay: `${idx * 30}ms` }}
                                >
                                    <div className="flex justify-between items-start">
                                         <div className="flex items-center gap-3 flex-1 min-w-0">
                                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                                                 issue.status === 'resolved' ? 'bg-green-500' : 
                                                 issue.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500'
                                             }`}>
                                                 {issue.status === 'resolved' ? <MdCheckCircle size={20} /> : <MdConfirmationNumber size={20} />}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                 <div className="flex items-center gap-2 mb-1">
                                                     <span className="text-[10px] font-black uppercase text-outline dark:text-gray-400">#{issue.issue_id}</span>
                                                     {issue.admin_response && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                                                 </div>
                                                 <h4 className="text-sm font-bold text-on-surface dark:text-white leading-tight truncate">{issue.description}</h4>
                                             </div>
                                         </div>
                                         <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${
                                              issue.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                              issue.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                         }`}>
                                             {issue.status.replace('_', ' ')}
                                         </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center border-t border-outline-variant/10 dark:border-gray-800 pt-2.5">
                                        <div className="flex items-center gap-1.5 text-outline dark:text-gray-400">
                                            <MdAccessTime size={12} />
                                            <span className="text-[10px] font-bold">{new Date(issue.created_at).toLocaleDateString('en-IN')}</span>
                                        </div>
                                        {issue.admin_response && (
                                            <span className="flex items-center gap-1 text-[10px] font-black text-primary uppercase">
                                                <MdReply size={12} /> Response
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

export default SupportScreen;
