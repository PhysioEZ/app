import { useState, useEffect } from 'react';
import { MdArrowBack, MdCheckCircle, MdHistory, MdAutoAwesome, MdTipsAndUpdates, MdPalette, MdDarkMode } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

export const AboutScreen = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
                const res = await fetch(`${baseUrl}/app_info.php`);
                const json = await res.json();
                if (json.status === 'success') {
                    setData(json.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInfo();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-surface dark:bg-black">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="flex flex-col h-full bg-surface dark:bg-black text-on-surface dark:text-gray-200 font-sans">
            {/* Header */}
            <div className="px-6 py-6 pt-[max(env(safe-area-inset-top),32px)] flex items-center gap-4 sticky top-0 z-10 bg-surface/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-on-surface dark:text-white">
                    <MdArrowBack size={24} />
                </button>
                <h1 className="text-2xl font-light tracking-tight text-on-surface dark:text-white">About & Updates</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-8 no-scrollbar">
                
                {/* 1. MAJOR OVERHAUL CARD (Manual Injection) */}
                <div className="bg-primary-container dark:bg-gray-900 rounded-[28px] p-8 shadow-sm border border-primary/10 dark:border-gray-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-primary/20 dark:bg-white/5 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-primary dark:bg-white rounded-2xl shadow-lg shadow-primary/30 dark:shadow-white/10 text-on-primary dark:text-black">
                                <MdAutoAwesome size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-primary dark:text-gray-400">Just Arrived</p>
                                <h2 className="text-2xl font-bold text-on-surface dark:text-white leading-tight">The Big Update</h2>
                            </div>
                        </div>

                        <p className="text-sm text-on-surface-variant dark:text-gray-300 mb-8 leading-relaxed font-medium">
                            We've completely re-engineered the experience with Google's Material Design 3. It's cleaner, faster, and more beautiful than ever.
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 text-primary dark:text-white"><MdPalette size={20} /></div>
                                <div>
                                    <h3 className="font-bold text-base text-on-surface dark:text-white">Material 3 UI</h3>
                                    <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">A complete visual refresh with modern cards, typography, and softer shapes.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 text-primary dark:text-white"><MdDarkMode size={20} /></div>
                                <div>
                                    <h3 className="font-bold text-base text-on-surface dark:text-white">True Dark Mode</h3>
                                    <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">Easy on the eyes, available system-wide with a single toggle.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 text-primary dark:text-white"><MdTipsAndUpdates size={20} /></div>
                                <div>
                                    <h3 className="font-bold text-base text-on-surface dark:text-white">Enhanced Navigation</h3>
                                    <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">Redesigned bottom bar and menu for quicker access to key screens.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. RELEASE HISTORY (API Data) */}
                {data.releases && data.releases.length > 0 && (
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-2">Release History</h3>
                        {data.releases.map((release: any, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                            <MdHistory size={20} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-lg text-gray-900 dark:text-white block">v{release.version}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{release.date}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 italic border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                                    "{release.description}"
                                </p>
                                
                                <div className="space-y-4">
                                    {release.features.map((f: any, i: number) => (
                                        <div key={i} className="flex gap-3">
                                            <MdCheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{f.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{f.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-center pt-8 pb-4 opacity-40">
                     <p className="text-[10px] font-mono">App Version: {data.releases[0]?.version} (Build 2026.01)</p>
                     <p className="text-[10px] uppercase font-bold mt-1">© 2026 Physio EZ</p>
                </div>
            </div>
        </div>
    );
};
