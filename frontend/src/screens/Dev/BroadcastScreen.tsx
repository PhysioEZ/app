import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdSend, MdInfo, MdWarning, MdNotificationsActive, MdAutorenew } from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const BroadcastScreen: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('PhysioEZ Announcement');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = () => {
        setRefreshing(true);
        setTitle('PhysioEZ Announcement');
        setMessage('');
        setResult(null);
        setTimeout(() => setRefreshing(false), 800);
    };

    const handleSend = async () => {
        if (!message.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/send_push.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    broadcast: true,
                    title,
                    message
                })
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error(error);
            setResult({ status: 'error', message: 'Network request failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Direct Teal Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/20 dark:to-transparent pointer-events-none z-0" />

            {/* Header */}
            <header className="px-6 py-6 pt-12 flex flex-col gap-6 z-30 relative">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                    >
                        <MdArrowBack size={18} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">Broadcast Center</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Push Communications</p>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                    >
                        {refreshing ? <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /> : <MdAutorenew size={18} />}
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-6 z-10 space-y-4 pb-24 relative no-scrollbar">
                
                {/* Main Action Card */}
                <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/10">
                            <MdNotificationsActive size={22} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Push Alert</h3>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-0.5">Target: All registered devices</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {/* Quick Templates */}
                        <div className="space-y-2">
                             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Quick Templates</label>
                             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {[
                                    { 
                                        label: 'Clear', 
                                        icon: '🧹', 
                                        t: 'PhysioEZ Announcement', 
                                        m: "" 
                                    },
                                    { 
                                        label: 'Maintenance', 
                                        icon: '🛠️', 
                                        t: '⚠️ Scheduled Maintenance', 
                                        m: "We're performing some updates. The app will be unavailable for a short while. Thank you for your patience! 🛠️" 
                                    },
                                    { 
                                        label: 'Update', 
                                        icon: '🚀', 
                                        t: '🚀 New Update Available!', 
                                        m: "A new version of the app is ready. Please update to enjoy the latest features and bug fixes. 📲" 
                                    },
                                    { 
                                        label: 'Downtime', 
                                        icon: '🛑', 
                                        t: '🛑 Login Temporarily Disabled', 
                                        m: "We are currently updating the system. Logins are paused for approx. 30 mins. Please try again later. ⏳" 
                                    },
                                    { 
                                        label: 'Reminder', 
                                        icon: '📅', 
                                        t: '👋 Hello from PhysioEZ', 
                                        m: "Just a friendly reminder to check your scheduled appointments for today! Have a great day. 🌟" 
                                    },
                                    { 
                                        label: 'Issue Fix', 
                                        icon: '🐛', 
                                        t: '🔧 Issue Resolved', 
                                        m: "The reported issue regarding [Feature] has been fixed! Please restart your app. Thanks for the report! ✅" 
                                    },
                                    { 
                                        label: 'Welcome', 
                                        icon: '👋', 
                                        t: '🎉 Welcome Aboard!', 
                                        m: "Welcome to PhysioEZ! We're thrilled to have you. Explore your personalized dashboard and get started today! 🚀" 
                                    },
                                    { 
                                        label: 'Survey', 
                                        icon: '📝', 
                                        t: '📢 We Value Your Feedback', 
                                        m: "We'd love to hear your thoughts! Please take a moment to fill out our quick survey and help us improve. ✍️" 
                                    },
                                    { 
                                        label: 'Holiday', 
                                        icon: '🎉', 
                                        t: '🎊 Holiday Greetings!', 
                                        m: "Wishing you a joyous holiday season filled with health and happiness! From all of us at PhysioEZ. 🎁" 
                                    }
                                ].map((template, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setTitle(template.t);
                                            setMessage(template.m);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/10 rounded-full shrink-0 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors"
                                    >
                                        <span className="text-sm">{template.icon}</span>
                                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">{template.label}</span>
                                    </button>
                                ))}
                             </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                            <input 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Enter title..."
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-white/5 rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Content</label>
                            <textarea 
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="What would you like to say?"
                                className="w-full h-32 bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-white/5 rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSend}
                        disabled={loading || !message.trim()}
                        className="w-full bg-indigo-500 text-white rounded-[24px] py-4 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:shadow-none"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <MdSend size={18} />
                                <span>Fire Broadcast</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Result Feedback */}
                {result && (
                    <div className={`p-5 rounded-[28px] border animate-scale-in flex flex-col gap-2 ${
                        result.status === 'success' 
                        ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-900/20' 
                        : 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100/50 dark:border-rose-900/20'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${
                                result.status === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
                            }`}>
                                <MdInfo size={16} />
                            </div>
                            <div>
                                <h4 className={`text-sm font-bold uppercase tracking-tight ${
                                    result.status === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                }`}>
                                    {result.status === 'success' ? 'Sent Successfully' : 'Failed'}
                                </h4>
                                {result.count !== undefined && (
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mt-0.5">
                                        Reached {result.count} devices
                                    </p>
                                )}
                            </div>
                        </div>
                        {result.message && (
                             <p className={`text-xs font-medium ml-1 leading-relaxed ${
                                 result.status === 'success' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
                             }`}>
                                {result.message}
                            </p>
                        )}
                    </div>
                )}

                {/* Warning Card */}
                <div className="p-5 rounded-[28px] bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 font-mono">
                    <div className="flex items-center gap-2 mb-2 text-amber-500">
                        <MdWarning size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Protocol Warning</span>
                    </div>
                    <p className="text-[9px] leading-relaxed text-amber-700 dark:text-amber-300 uppercase tracking-tight font-bold opacity-70">
                        This endpoint targets ALL registered devices. Excessive broadcasts may result in FCM blocking your project token.
                    </p>
                </div>
            </main>

            <style>{`
                .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
};

export default BroadcastScreen;
