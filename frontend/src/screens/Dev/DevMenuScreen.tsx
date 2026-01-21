import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../hooks/useTheme';
import { 
    MdTerminal, 
    MdLogout, 
    MdSettings, 
    MdChevronRight, 
    MdCode, 
    MdSecurity,
    MdChat,
    MdTraffic,
    MdNotifications,
    MdBugReport,
    MdSpeed,
    MdStorage,
    MdBlock,
    MdDns,
    MdDarkMode,
    MdLightMode
} from 'react-icons/md';

const DevMenuScreen: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

    const menuCategories = [
        {
            title: "Core Tools",
            items: [
                { 
                    id: 'dev-console', 
                    label: 'SQL Console', 
                    icon: <MdTerminal size={20} />, 
                    link: '/dev/console',
                    desc: 'Execute Raw SQL',
                    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                },
                { 
                    id: 'db-schema', 
                    label: 'Database Explorer', 
                    icon: <MdSettings size={20} />, 
                    link: '/dev/db',
                    desc: 'Table rows & integrity',
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                },
                { 
                    id: 'table-mgmt', 
                    label: 'Table Management', 
                    icon: <MdStorage size={20} />, 
                    link: '/dev/tables',
                    desc: 'Optimize & Monitor',
                    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                }
            ]
        },
        {
            title: "Security & Monitoring",
            items: [
                { 
                    id: 'auth-audit', 
                    label: 'Auth Audit', 
                    icon: <MdSecurity size={20} />, 
                    link: '/dev/auth-audit',
                    desc: 'Login tracking',
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                },
                { 
                    id: 'ip-blacklist', 
                    label: 'IP Blacklist', 
                    icon: <MdBlock size={20} />, 
                    link: '/dev/blacklist',
                    desc: 'Block malicious IPs',
                    color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'
                },
                { 
                    id: 'db-audit', 
                    label: 'Audit Logs', 
                    icon: <MdSecurity size={20} />, 
                    link: '/dev/audit',
                    desc: 'Database event stream',
                    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                },
                { 
                    id: 'sys-audit', 
                    label: 'System Logs', 
                    icon: <MdCode size={20} />, 
                    link: '/dev/logs',
                    desc: 'Raw Error Stream',
                    color: 'text-slate-500 bg-slate-50 dark:bg-slate-900/20'
                },
                { 
                    id: 'sentry-lite', 
                    label: 'Sentry Monitor', 
                    icon: <MdSpeed size={20} />, 
                    link: '/dev/sentry',
                    desc: 'Performance & Health',
                    color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'
                },
                { 
                    id: 'traffic', 
                    label: 'Traffic Tracker', 
                    icon: <MdTraffic size={20} />, 
                    link: '/dev/traffic',
                    desc: 'HTTP monitor',
                    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                }
            ]
        },
        {
            title: "Communication",
            items: [
                { 
                    id: 'broadcast', 
                    label: 'Broadcast Center', 
                    icon: <MdNotifications size={20} />, 
                    link: '/dev/broadcast',
                    desc: 'Push communications',
                    color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20'
                },
                { 
                    id: 'dev-chat', 
                    label: 'Team Chat', 
                    icon: <MdChat size={20} />, 
                    link: '/dev/chat',
                    desc: 'Internal coordination',
                    color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20'
                },
                { 
                    id: 'dev-issues', 
                    label: 'Pending Issues', 
                    icon: <MdBugReport size={20} />, 
                    link: '/dev/issues',
                    desc: 'Bug tracking & fixes',
                    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                }
            ]
        },
        {
            title: "System",
            items: [
                { 
                    id: 'remote-control', 
                    label: 'Remote Control', 
                    icon: <MdTerminal size={20} />, 
                    link: '/dev/remote',
                    desc: 'Maintenance & protocols',
                    color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'
                },
                { 
                    id: 'system-info', 
                    label: 'System Info', 
                    icon: <MdDns size={20} />, 
                    link: '/dev/info',
                    desc: 'PHP Config & resources',
                    color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                }
            ]
        }
    ];

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
            
            {/* Direct Teal Gradient Background - Matching Dashboard */}
            <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/20 dark:to-transparent pointer-events-none z-0" />
            
            {/* Header */}
            <header className="px-6 py-6 pt-12 flex items-center justify-between z-30 relative">
                <div>
                    <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">Menu</h1>
                    {/* <p className="text-[10px] font-medium text-gray-500/70 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">Modular Root Access</p> */}
                </div>
                <button 
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-90 transition-all"
                >
                    {theme === 'dark' ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
                </button>
            </header>

            {/* Profile Strip */}
            <div className="px-6 mb-4 relative z-10 animate-fade-in">
                <button onClick={() => navigate('/dev/profile')} className="flex items-center gap-4 p-1 text-left w-full group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-medium text-lg shadow-lg shadow-indigo-500/20 group-active:scale-95 transition-transform">
                        {user?.name?.charAt(0) || 'D'}
                    </div>
                    <div>
                        <h2 className="font-medium text-base text-gray-900 dark:text-white leading-tight">{user?.name}</h2>
                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.1em] font-medium mt-0.5 group-hover:text-indigo-400 transition-colors">System Core • {user?.role}</p>
                    </div>
                </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto px-6 space-y-6 relative z-10 pb-32 no-scrollbar">
                {menuCategories.map((category, catIndex) => (
                    <div key={catIndex} className="space-y-3">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 opacity-70">
                            {category.title}
                        </h3>
                        <div className="space-y-2">
                            {category.items.map((item) => (
                                <button 
                                    key={item.id}
                                    onClick={() => navigate(item.link)}
                                    className="w-full bg-white dark:bg-zinc-900/80 p-3.5 rounded-[20px] flex items-center justify-between active:scale-[0.98] transition-all border border-gray-100 dark:border-white/5 shadow-sm group hover:border-indigo-500/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${item.color}`}>
                                            {item.icon}
                                        </div>
                                        <div className="text-left">
                                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 block">{item.label}</span>
                                            <span className="text-[10px] text-gray-400 font-medium block tracking-wide">{item.desc}</span>
                                        </div>
                                    </div>
                                    <MdChevronRight size={20} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                <button 
                    onClick={() => setShowLogoutConfirm(true)} 
                    className="w-full mt-6 bg-rose-500/5 dark:bg-rose-900/10 p-4 rounded-[24px] flex items-center justify-between active:scale-[0.98] transition-all border border-rose-500/20 shadow-sm group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 transition-transform group-hover:scale-90">
                            <MdLogout size={18} />
                        </div>
                        <div className="text-left">
                            <span className="font-semibold text-sm text-rose-500 block">Terminate Session</span>
                            <span className="text-[10px] text-rose-500/60 font-bold uppercase tracking-widest block">Release Root Access</span>
                        </div>
                    </div>
                </button>
                
                {/* Footer */}
                <div className="pt-8 pb-12 text-center opacity-30">
                     <div className="flex items-center justify-center gap-2 text-gray-400">
                        <span className="text-[12px] font-black uppercase tracking-[0.3em]">PhysioEZ v3.2</span>
                     </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-xs rounded-[32px] p-6 shadow-2xl shadow-rose-500/20 border border-rose-100 dark:border-rose-900/30 transform transition-all scale-100">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center mb-2">
                                <MdLogout size={32} />
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Terminate Session?</h3>
                                <p className="text-sm text-gray-500 font-medium mt-2 leading-relaxed">
                                    You are about to release root access and return to the login screen.
                                </p>
                            </div>

                            <div className="flex gap-3 w-full mt-2">
                                <button 
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-sm font-bold active:scale-95 transition-transform"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => logout()}
                                    className="flex-1 py-3.5 px-4 rounded-2xl bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-500/30 active:scale-95 transition-transform"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DevMenuScreen;