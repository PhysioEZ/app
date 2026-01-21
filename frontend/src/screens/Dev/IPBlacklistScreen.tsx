import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, MdBlock, MdRefresh, MdCheck, MdWarning, MdDelete, MdAdd
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface BlockedIP {
    ip_address: string;
    reason: string;
    blocked_by: string;
    blocked_at: string;
}

const IPBlacklistScreen: React.FC = () => {
    const navigate = useNavigate();
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newIP, setNewIP] = useState('');
    const [newReason, setNewReason] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadBlockedIPs();
    }, []);

    const loadBlockedIPs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/dev/ip_blacklist.php?action=list_blocked`);
            const data = await res.json();
            if (data.status === 'success') {
                setBlockedIPs(data.blocked_ips);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const blockIP = async () => {
        if (!newIP.trim()) {
            setMessage({ type: 'error', text: 'Please enter an IP address' });
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'block_ip');
            formData.append('ip', newIP.trim());
            formData.append('reason', newReason.trim() || 'Manually blocked');
            formData.append('blocked_by', 'admin');

            const res = await fetch(`${API_URL}/dev/ip_blacklist.php`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.status === 'success') {
                setMessage({ type: 'success', text: data.message });
                setNewIP('');
                setNewReason('');
                setShowAddForm(false);
                loadBlockedIPs();
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: `Error: ${error.message}` });
        }
    };

    const unblockIP = async (ip: string) => {
        if (!confirm(`Unblock IP ${ip}?`)) return;

        try {
            const formData = new FormData();
            formData.append('action', 'unblock_ip');
            formData.append('ip', ip);

            const res = await fetch(`${API_URL}/dev/ip_blacklist.php`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.status === 'success') {
                setMessage({ type: 'success', text: data.message });
                loadBlockedIPs();
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: `Error: ${error.message}` });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-rose-50 via-rose-50/50 to-transparent dark:from-rose-900/20 dark:to-transparent pointer-events-none z-0" />
            
            {/* Header */}
            <header className="px-6 py-6 pt-12 flex items-center justify-between z-30 relative">
                <div className="animate-fade-in">
                   <p className="text-[10px] font-medium text-gray-500/70 dark:text-gray-500 uppercase tracking-[0.2em] mb-0.5">
                     Security
                   </p>
                   <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
                     IP Blacklist
                   </h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={loadBlockedIPs}
                        className={`w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm ${loading ? 'animate-spin' : ''}`}
                    >
                        <MdRefresh size={18} />
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
                
                {/* Summary Card */}
                <section className="mb-6 animate-scale-in">
                    <div className="bg-white dark:bg-zinc-900/80 p-5 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                <MdBlock size={20} className="text-rose-600 dark:text-rose-400" />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Blocked IPs</p>
                        </div>
                        <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">{blockedIPs.length}</p>
                        <p className="text-[10px] text-gray-500 mt-1">Currently blacklisted</p>
                    </div>
                </section>

                {/* Add IP Button */}
                <section className="mb-6">
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="w-full py-4 rounded-[20px] bg-rose-600 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 active:scale-98 transition-all"
                    >
                        {showAddForm ? <><MdBlock size={18} /> Cancel</> : <><MdAdd size={18} /> Block New IP</>}
                    </button>
                </section>

                {/* Add IP Form */}
                {showAddForm && (
                    <section className="mb-6 animate-slide-up">
                        <div className="bg-white dark:bg-zinc-900/80 p-5 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Block IP Address</h3>
                            
                            <input
                                type="text"
                                value={newIP}
                                onChange={(e) => setNewIP(e.target.value)}
                                placeholder="192.168.1.1"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                            
                            <input
                                type="text"
                                value={newReason}
                                onChange={(e) => setNewReason(e.target.value)}
                                placeholder="Reason (optional)"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                            
                            <button
                                onClick={blockIP}
                                className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-sm uppercase tracking-wider active:scale-98 transition-all"
                            >
                                Block IP
                            </button>
                        </div>
                    </section>
                )}

                {/* Message */}
                {message && (
                    <div className={`mb-4 p-4 rounded-[20px] border ${
                        message.type === 'success' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
                    } flex items-center gap-3`}>
                        {message.type === 'success' ? <MdCheck size={18} /> : <MdWarning size={18} />}
                        <span className="text-sm font-bold">{message.text}</span>
                    </div>
                )}

                {/* Blocked IPs List */}
                <section className="space-y-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    {blockedIPs.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900/80 p-8 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm text-center">
                            <MdBlock size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No blocked IPs</p>
                        </div>
                    ) : (
                        blockedIPs.map((ip, i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900/80 p-4 rounded-[20px] border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white font-mono">{ip.ip_address}</h3>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{ip.reason}</p>
                                    </div>
                                    <button
                                        onClick={() => unblockIP(ip.ip_address)}
                                        className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <MdDelete size={14} /> Unblock
                                    </button>
                                </div>
                                
                                <div className="flex items-center gap-4 text-[10px] text-gray-500">
                                    <span>Blocked by: {ip.blocked_by}</span>
                                    <span>•</span>
                                    <span>{new Date(ip.blocked_at).toLocaleString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </main>
        </div>
    );
};

export default IPBlacklistScreen;
