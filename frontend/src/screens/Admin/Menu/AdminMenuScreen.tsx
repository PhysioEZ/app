import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdDashboard, 
    MdMessage, 
    MdAccountBalanceWallet, 
    MdGroups, 
    MdVerified, 
    MdStorefront, 
    MdShare, 
    MdPerson, 
    MdBugReport, 
    MdSettings,
    MdChevronRight,
    MdLogout,
    MdWbSunny,
    MdDarkMode,
    MdFeedback,
    MdLibraryBooks,
    MdNotifications,
    MdHistory,
    MdAssessment
} from 'react-icons/md';

const ADMIN_URL = 'https://prospine.in/admin';

const AdminMenuScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { 
            id: 'dashboard', 
            label: 'Dashboard', 
            icon: <MdDashboard size={24} />, 
            link: '/admin/dashboard'
        },
        { 
            id: 'notifications', 
            label: 'Notifications', 
            icon: <MdNotifications size={24} />, 
            link: '/admin/notifications'
        },
        { 
            id: 'patients', 
            label: 'Patients', 
            icon: <MdPerson size={24} />, 
            link: '/admin/patients'
        },
        { 
            id: 'chat', 
            label: 'Team Chat', 
            icon: <MdMessage size={24} />, 
            link: '/admin/chat'
        },
        { 
            id: 'ledger', 
            label: 'Financial Ledger', 
            icon: <MdLibraryBooks size={24} />, 
            link: '/admin/ledger'
        },
        { 
            id: 'expenses', 
            label: 'Expense Approvals', 
            icon: <MdAccountBalanceWallet size={24} />, 
            link: '/admin/expenses'
        },
        { 
            id: 'staff', 
            label: 'Employee Directory', 
            icon: <MdGroups size={24} />, 
            link: '/admin/staff'
        },
        { 
            id: 'attendance', 
            label: 'Attendance Queue', 
            icon: <MdVerified size={24} />, 
            link: '/admin/attendance'
        },
        { 
            id: 'branches', 
            label: 'Clinic Network', 
            icon: <MdStorefront size={24} />, 
            link: '/admin/branches'
        },
        { 
            id: 'referrals', 
            label: 'Referral Partners', 
            icon: <MdShare size={24} />, 
            link: '/admin/referrals'
        },
        { 
            id: 'reception-config', 
            label: 'Reception Config', 
            icon: <MdSettings size={24} />, 
            link: '/admin/settings/reception'
        },
        { 
            id: 'feedback', 
            label: 'Patient Feedback', 
            icon: <MdFeedback size={24} />, 
            link: '/admin/feedback'
        },
        { 
            id: 'issues', 
            label: 'System Issues', 
            icon: <MdBugReport size={24} />, 
            link: '/admin/issues'
        },
        { 
            id: 'records', 
            label: 'System Records', 
            icon: <MdHistory size={24} />, 
            link: '/admin/records'
        },
        { 
            id: 'reports', 
            label: 'Reports & Analytics', 
            icon: <MdAssessment size={24} />, 
            link: '/admin/reports'
        }
    ];

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-black transition-colors pb-[env(safe-area-inset-bottom)] font-sans relative">
            {/* Branded Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/30 to-transparent pointer-events-none z-0 dark:from-teal-900/10" />

            {/* Minimal Header */}
            <div className="px-6 py-6 pt-[max(env(safe-area-inset-top),32px)] relative z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-light text-gray-900 dark:text-white tracking-tight">Admin Menu</h1>
                        <p className="text-[10px] font-medium text-teal-600/70 uppercase tracking-[0.2em] mt-1">Physio EZ Control Center</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar z-10">
                
                {/* Profile Strip */}
                <div className="flex items-center justify-between mb-8 py-6 border-b border-gray-100 dark:border-gray-900">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-white dark:bg-gray-800 flex items-center justify-center text-teal-600 dark:text-teal-400 text-2xl font-light overflow-hidden shadow-sm border border-white dark:border-gray-800">
                            {user?.photo ? (
                                <img 
                                    src={`${ADMIN_URL}/${user.photo}`} 
                                    alt={user.name} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none'; 
                                        ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                                    }}
                                />
                            ) : (
                                <span>{user?.name?.charAt(0) || 'A'}</span>
                            )}
                            <span className="hidden w-full h-full items-center justify-center bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
                                {user?.name?.charAt(0) || 'A'}
                            </span>
                        </div>
                        <div>
                            <h2 className="font-medium text-lg text-gray-900 dark:text-white">{user?.name || 'Administrator'}</h2>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{user?.role || 'Super Admin'}</p>
                        </div>
                    </div>
                </div>

                {/* List Layout with Professional Mono Icons */}
                <div className="space-y-3">
                    {menuItems.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => navigate(item.link)}
                            className="w-full group bg-white dark:bg-zinc-900/40 p-4 rounded-[20px] flex items-center justify-between active:scale-[0.98] transition-all duration-300 border border-white dark:border-white/5 shadow-sm shadow-gray-200/50 dark:shadow-none hover:border-teal-500/30"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-gray-400 dark:text-gray-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                    {item.icon}
                                </div>
                                <span className="font-medium text-[15px] text-gray-700 dark:text-gray-200">{item.label}</span>
                            </div>
                            <MdChevronRight size={20} className="text-gray-300 dark:text-gray-700 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ))}
                </div>

                {/* System Controls */}
                <div className="mt-8 space-y-3 pt-6 border-t border-gray-100 dark:border-gray-900">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">System Preferences</p>
                    
                    <button 
                        onClick={toggleTheme} 
                        className="w-full group bg-white dark:bg-zinc-900/40 p-4 rounded-[20px] flex items-center justify-between active:scale-[0.98] transition-all duration-300 border border-white dark:border-white/5 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="text-gray-400 group-hover:text-teal-500 transition-colors">
                                {isDark ? <MdWbSunny size={24} /> : <MdDarkMode size={24} />}
                            </div>
                            <span className="font-medium text-[15px] text-gray-700 dark:text-gray-200">Appearance</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{isDark ? 'Dark' : 'Light'}</span>
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${isDark ? 'bg-teal-600/20' : 'bg-gray-100'}`}>
                                <div className={`w-4 h-4 rounded-full bg-teal-500 shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    </button>

                    <button 
                        onClick={handleLogout} 
                        className="w-full group bg-gradient-to-br from-white via-rose-50/20 to-white dark:from-zinc-900 dark:via-rose-950/20 dark:to-zinc-900 p-4 rounded-[20px] flex items-center justify-between active:scale-[0.98] transition-all duration-300 border border-rose-100 dark:border-rose-900/30 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="text-rose-500">
                                <MdLogout size={24} />
                            </div>
                            <span className="font-medium text-[15px] text-rose-500">Sign Out Account</span>
                        </div>
                    </button>
                </div>

                {/* Footer Credits */}
                <div className="mt-12 text-center pb-12">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em]">Physio EZ • v3.0.0</p>
                    <div className="mt-4 flex items-center justify-center gap-1.5 opacity-30">
                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                    </div>
                </div>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
                    <div 
                        className="bg-white dark:bg-black w-full sm:max-w-xs rounded-[32px] shadow-2xl p-8 mb-20 sm:mb-0 border border-gray-100 dark:border-white/5 animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                            <MdLogout size={32} />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2 tracking-tight">Sign out?</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8">
                            Are you sure you want to exit?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={confirmLogout} 
                                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl text-sm transition-all active:scale-[0.98]"
                            >
                                Sign Out
                            </button>
                            <button 
                                onClick={() => setShowLogoutModal(false)} 
                                className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold rounded-2xl text-sm transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMenuScreen;
