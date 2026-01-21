import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    MdBuild, MdOutlineLockPerson, 
    MdHome, MdRefresh, MdArrowBack 
} from 'react-icons/md';
import { useAuthStore } from '../../store/useAuthStore';

const SystemStatusScreen: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { logout } = useAuthStore();
    
    const type = searchParams.get('type') || 'maintenance';
    const message = searchParams.get('message') || 
        (type === 'maintenance' 
            ? 'The system is currently undergoing scheduled maintenance. Please check back shortly.' 
            : 'Your session has been terminated by an administrator for security reasons.');

    const isMaintenance = type === 'maintenance';

    useEffect(() => {
        if (!isMaintenance) {
            // If it's a force logout, clear local auth
            logout();
        }
    }, [type]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-6 font-sans selection:bg-rose-500/30">
            
            {/* Background Glow */}
            <div className={`absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none ${isMaintenance ? 'bg-indigo-500' : 'bg-rose-500'}`} />

            <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-3xl border border-white/5 rounded-[48px] p-10 text-center shadow-2xl animate-in fade-in zoom-in duration-500 relative z-10">
                
                {/* Icon Container */}
                <div className={`w-28 h-28 rounded-[36px] flex items-center justify-center mx-auto mb-10 relative ${isMaintenance ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {isMaintenance ? <MdBuild size={48} /> : <MdOutlineLockPerson size={48} />}
                    
                    {/* Pulsing Border */}
                    <div className={`absolute inset-[-8px] border-2 rounded-[44px] opacity-20 animate-ping ${isMaintenance ? 'border-indigo-400' : 'border-rose-400'}`} />
                </div>

                <h1 className="text-3xl font-black tracking-tight mb-4">
                    {isMaintenance ? 'System Maintenance' : 'Authentication Required'}
                </h1>
                
                <p className="text-slate-400 leading-relaxed mb-12 font-medium px-4">
                    {message}
                </p>

                <div className="space-y-4">
                    <button 
                        onClick={() => window.location.href = '/'}
                        className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                            isMaintenance 
                            ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' 
                            : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                        }`}
                    >
                        <MdHome size={20} />
                        Go to Home
                    </button>

                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-widest bg-slate-800 hover:bg-slate-700 transition-all active:scale-95 border border-white/5"
                    >
                        <MdRefresh size={20} />
                        Retry Connection
                    </button>
                </div>

                <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    PhysioEZ Health Security
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </div>
            </div>

            {/* Subtle Footer */}
            <button 
                onClick={() => navigate(-1)}
                className="mt-8 flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-xs font-bold uppercase tracking-widest"
            >
                <MdArrowBack />
                Back
            </button>
        </div>
    );
};

export default SystemStatusScreen;
