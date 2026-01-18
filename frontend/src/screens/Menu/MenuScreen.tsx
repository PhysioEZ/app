import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
    MdPersonAdd, 
    MdAssignment, 
    MdQrCodeScanner, 
    MdReceiptLong, 
    MdAccountBalanceWallet, 
    MdBarChart, 
    MdBiotech, 
    MdSupportAgent,
    MdFeedback,
    MdInfo,
    MdChevronRight,
    MdLogout,
    MdWbSunny,
    MdDarkMode
} from 'react-icons/md';

const ADMIN_URL = 'https://prospine.in/admin';

const MenuScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { 
            id: 'inquiry', 
            label: 'Inquiry', 
            icon: <MdAssignment size={24} />, 
            link: '/inquiry'
        },
        { 
            id: 'registration', 
            label: 'Registration', 
            icon: <MdPersonAdd size={24} />, 
            link: '/registration'
        },
        { 
            id: 'attendance', 
            label: 'Attendance', 
            icon: <MdQrCodeScanner size={24} />, 
            link: '/attendance'
        },
        { 
            id: 'billing', 
            label: 'Billing', 
            icon: <MdReceiptLong size={24} />, 
            link: '/billing'
        },
        { 
            id: 'tests', 
            label: 'Lab Tests', 
            icon: <MdBiotech size={24} />, 
            link: '/tests'
        },
        { 
            id: 'reports', 
            label: 'Reports', 
            icon: <MdBarChart size={24} />, 
            link: '/reports'
        },
        { 
            id: 'expenses', 
            label: 'Expenses', 
            icon: <MdAccountBalanceWallet size={24} />, 
            link: '/expenses'
        },
        { 
            id: 'feedback', 
            label: 'Feedback', 
            icon: <MdFeedback size={24} />, 
            link: '/feedback'
        },
        { 
            id: 'support', 
            label: 'Support', 
            icon: <MdSupportAgent size={24} />, 
            link: '/support'
        }
    ];

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

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black transition-colors pb-[env(safe-area-inset-bottom)] font-sans relative">
            {/* Primary Gradient Background Mesh */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent pointer-events-none z-0 dark:from-primary/10" />

            {/* Minimal Header */}
            <div className="bg-gray-50 dark:bg-black px-6 py-6 pt-[max(env(safe-area-inset-top),32px)] relative z-10 bg-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-poppins text-black dark:text-white tracking-tight">Menu</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
                
                {/* Profile Strip */}
                <div className="flex items-center justify-between mb-8 py-2 border-b border-gray-100 dark:border-gray-900">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-2xl font-bold overflow-hidden border border-gray-200 dark:border-gray-800">
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
                                <span>{user?.name?.charAt(0) || 'U'}</span>
                            )}
                            {/* Fallback for error handling on image */}
                            <span className="hidden w-full h-full items-center justify-center bg-black dark:bg-white text-white dark:text-black">
                                {user?.name?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div>
                            <h2 className="font-bold text-base text-black dark:text-white">{user?.name || 'User'}</h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{user?.role || 'Staff'}</p>
                        </div>
                    </div>
                </div>

                {/* List Layout with Minimal Icons */}
                <div className="space-y-2">
                    {menuItems.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => navigate(item.link)}
                            className="w-full group bg-white dark:bg-gray-900/50 p-4 rounded-xl flex items-center justify-between active:scale-[0.99] transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                    {item.icon}
                                </div>
                                <span className="font-medium text-base text-gray-800 dark:text-gray-200">{item.label}</span>
                            </div>
                            <MdChevronRight size={20} className="text-gray-300 dark:text-gray-700 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ))}
                </div>

                {/* Footer Links */}
                <div className="mt-4 space-y-2">
                     <button 
                        onClick={toggleTheme} 
                        className="w-full group bg-white dark:bg-gray-900/50 p-4 rounded-xl flex items-center justify-between active:scale-[0.99] transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
                     >
                        <div className="flex items-center gap-4">
                            <div className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                {isDark ? <MdWbSunny size={24} /> : <MdDarkMode size={24} />}
                            </div>
                            <span className="font-medium text-base text-gray-800 dark:text-gray-200">Appearance</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{isDark ? 'Dark' : 'Light'}</span>
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                     </button>
                     <button 
                        onClick={() => navigate('/about')} 
                        className="w-full group bg-white dark:bg-gray-900/50 p-4 rounded-xl flex items-center justify-between active:scale-[0.99] transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
                     >
                        <div className="flex items-center gap-4">
                            <div className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                <MdInfo size={24} />
                            </div>
                            <span className="font-medium text-base text-gray-800 dark:text-gray-200">About App</span>
                        </div>
                        <MdChevronRight size={20} className="text-gray-300 dark:text-gray-700 group-hover:translate-x-1 transition-transform" />
                     </button>

                     <button 
                        onClick={handleLogout} 
                        className="w-full group bg-white dark:bg-gray-900/50 p-4 rounded-xl flex items-center justify-between active:scale-[0.99] transition-all duration-200 border border-transparent hover:border-red-500/30 dark:hover:border-red-500/30"
                     >
                        <div className="flex items-center gap-4">
                            <div className="text-red-500">
                                <MdLogout size={24} />
                            </div>
                            <span className="font-medium text-base text-red-500">Log Out</span>
                        </div>
                     </button>
                </div>

                {/* Version */}
                <div className="mt-6 text-center">
                    <p className="text-[10px] font-bold text-gray-800 uppercase tracking-widest opacity-50">v3.0.0</p>
                    <p className="text-[12px] uppercase text-gray-800 mt-2">© 2026 Physio EZ</p>
                </div>
            </div>

            {/* Logout Modal (Minimal) */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
                    <div 
                        className="bg-white dark:bg-gray-950 w-full sm:max-w-xs rounded-2xl shadow-2xl p-6 mb-20 sm:mb-0 border border-gray-100 dark:border-gray-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-black dark:text-white mb-2">Sign out?</h3>
                        <p className="text-sm text-gray-500 mb-6">Confirm you want to exit.</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowLogoutModal(false)} 
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-bold rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmLogout} 
                                className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg text-sm"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuScreen;
