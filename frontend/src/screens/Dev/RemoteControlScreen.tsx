import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
    MdArrowBack, MdRefresh, MdPowerSettingsNew, 
    MdWarning, MdLock, MdLockOpen, MdOutput,
    MdSecurity, MdStorage, MdCloudQueue, MdTerminal
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

const RemoteControlScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [maintenanceMsg, setMaintenanceMsg] = useState('');

    const fetchStatus = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const empId = user.employee_id || (user as any).id;
            const res = await fetch(`${API_URL}/dev/remote_control.php?action=get_status&employee_id=${empId}`);
            const data = await res.json();
            
            // Fetch Git Info
            const gitRes = await fetch(`${API_URL}/dev/git_info.php?employee_id=${empId}`);
            const gitData = await gitRes.json();

            if (data.status === 'success') {
                setStatus({ ...data, git: gitData });
                setMaintenanceMsg(data.maintenance_message);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const toggleMaintenance = async () => {
        if (!user || !status) return;
        setActionLoading(true);
        try {
            const empId = user.employee_id || (user as any).id;
            const res = await fetch(`${API_URL}/dev/remote_control.php?action=toggle_maintenance&employee_id=${empId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: !status.maintenance_mode,
                    message: maintenanceMsg
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                fetchStatus();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleForceLogout = () => {
        setShowConfirmModal(true);
    };

    const executeForceLogout = async () => {
        if (!user) return;
        setShowConfirmModal(false);
        setActionLoading(true);
        try {
            const empId = user.employee_id || (user as any).id;
            const res = await fetch(`${API_URL}/dev/remote_control.php?action=force_logout_all&employee_id=${empId}`, {
                method: 'POST'
            });
            const data = await res.json();
            alert(data.message);
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Background Aesthetics */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-rose-50 to-transparent dark:from-rose-900/10 dark:to-transparent pointer-events-none z-0" />

            {/* Header */}
            <header className="px-6 py-6 pt-12 flex flex-col gap-6 z-30 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm"
                        >
                            <MdArrowBack size={18} />
                        </button>
                        <div>
                            <h1 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">Remote Control</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Global System Commands</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={fetchStatus}
                        className={`w-10 h-10 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white dark:border-gray-800 active:scale-90 transition-transform shadow-sm ${loading ? 'animate-spin' : ''}`}
                    >
                        <MdRefresh size={18} />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-6 z-10 space-y-6 pb-24 relative no-scrollbar">
                
                {/* Status Dashboard */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-900/80 p-5 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mb-3">
                            <MdStorage size={18} />
                        </div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Database</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">{status?.db_status || 'Checking...'}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900/80 p-5 rounded-[28px] border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mb-3">
                            <MdCloudQueue size={18} />
                        </div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Server Time</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">{status ? status.server_time.split(' ')[1] : '--:--:--'}</p>
                    </div>
                </div>

                {/* Build & Git Info */}
                <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                         <MdTerminal className="text-indigo-500" size={14} />
                         <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Build Manifest</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Branch</p>
                            <p className="text-xs font-bold text-indigo-500 mt-1">{status?.git?.branch || 'main'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Commit</p>
                            <p className="text-xs font-mono font-bold text-gray-900 dark:text-white mt-1">{status?.git?.commit || '8f2a1b3'}</p>
                        </div>
                        <div className="col-span-2 mt-4">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Last Server Update</p>
                             <p className="text-[10px] font-bold text-gray-900 dark:text-white mt-1 opacity-70">{status?.git?.last_update || 'Recent'}</p>
                        </div>
                    </div>
                </div>

                {/* Maintenance Mode Card */}
                <div className={`bg-white dark:bg-zinc-900/80 p-6 rounded-[32px] border transition-all duration-300 ${status?.maintenance_mode ? 'border-rose-500/30' : 'border-gray-100 dark:border-white/5'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${status?.maintenance_mode ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'}`}>
                                {status?.maintenance_mode ? <MdLock size={22} /> : <MdLockOpen size={22} />}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Maintenance Mode</h3>
                                <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400 mt-0.5">
                                    Status: {status?.maintenance_mode ? 'ENABLED' : 'DISABLED'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={toggleMaintenance}
                            disabled={actionLoading}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${status?.maintenance_mode ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                        >
                            {status?.maintenance_mode ? 'Stop' : 'Start'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Screen Message</label>
                        <textarea 
                            value={maintenanceMsg}
                            onChange={(e) => setMaintenanceMsg(e.target.value)}
                            className="w-full h-24 bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-white/5 rounded-2xl px-4 py-4 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20 transition-all resize-none placeholder:text-gray-300 italic"
                            placeholder="Message to display to users..."
                        />
                    </div>
                </div>

                {/* Emergency Actions */}
                <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-[32px] border border-gray-100 dark:border-white/5 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                         <MdSecurity className="text-rose-500" size={14} />
                         <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Emergency Protocols</span>
                    </div>

                    <button 
                        onClick={handleForceLogout}
                        disabled={actionLoading}
                        className="w-full h-16 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 text-rose-500 rounded-2xl flex items-center px-6 gap-4 active:scale-[0.98] transition-all"
                    >
                        <MdOutput size={24} />
                        <div className="text-left">
                            <h4 className="text-sm font-bold">Force Global Logout</h4>
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Invalidates all active sessions</p>
                        </div>
                    </button>

                    <button 
                        className="w-full h-16 bg-gray-50 dark:bg-white/5 text-gray-400 rounded-2xl flex items-center px-6 gap-4 opacity-50 cursor-not-allowed"
                        disabled
                    >
                        <MdPowerSettingsNew size={24} />
                        <div className="text-left">
                            <h4 className="text-sm font-bold">Restart API Service</h4>
                            <p className="text-[9px] font-bold uppercase tracking-widest">Requires root access</p>
                        </div>
                    </button>
                </div>

                {/* Protocol Warning */}
                <div className="p-5 rounded-[28px] bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 font-mono">
                    <div className="flex items-center gap-2 mb-2 text-amber-500">
                        <MdWarning size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Dev Protocol</span>
                    </div>
                    <p className="text-[9px] leading-relaxed text-amber-700 dark:text-amber-300 uppercase tracking-tight font-bold opacity-70">
                        Maintenance mode will block ALL traffic except IPs listed in the 'allowed_dev_ips' config. Use with caution during business hours.
                    </p>
                </div>

            </main>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] w-full max-w-sm shadow-2xl border border-white/10 animate-scale-in">
                         <div className="flex flex-col items-center text-center">
                             <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center mb-5">
                                <MdWarning size={32} />
                             </div>
                             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Force Logout?</h3>
                             <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[250px] mb-8">
                                 This will invalidate ALL active user sessions immediately. Users will be forced to log in again.
                             </p>
                             <div className="grid grid-cols-2 gap-3 w-full">
                                 <button 
                                     onClick={() => setShowConfirmModal(false)}
                                     className="py-3.5 rounded-[20px] bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white font-bold text-xs uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                 >
                                     Cancel
                                 </button>
                                 <button 
                                     onClick={executeForceLogout}
                                     className="py-3.5 rounded-[20px] bg-rose-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-rose-600 shadow-xl shadow-rose-500/20 transition-all active:scale-95"
                                 >
                                     Confirm
                                 </button>
                             </div>
                         </div>
                    </div>
                </div>
            )}

            <style>{`
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
                .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default RemoteControlScreen;
