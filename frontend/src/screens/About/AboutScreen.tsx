import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Sparkles, History } from 'lucide-react';
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
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="px-4 py-3 pt-[var(--safe-area-inset-top,32px)] mt-0 flex items-center gap-3 sticky top-0 z-10 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Updates & Features</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-6">
                
                {/* 1. LATEST RELEASE CARD (Hero) */}
                {data.releases && data.releases[0] && (
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 shadow-xl shadow-indigo-500/30 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                    <span className="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-yellow-300" />
                                        Latest Update
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-indigo-100 bg-black/20 px-2 py-1 rounded-lg">
                                    {data.releases[0].date}
                                </span>
                            </div>

                            <h2 className="text-3xl font-black mb-1">v{data.releases[0].version}</h2>
                            <p className="text-indigo-100 text-sm font-medium mb-6 leading-relaxed opacity-90">
                                {data.releases[0].description}
                            </p>

                            <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/10 space-y-3">
                                {data.releases[0].features.map((feat: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="p-1 rounded-full bg-teal-400/20 text-teal-300 mt-0.5 shrink-0">
                                            <CheckCircle2 size={12} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white leading-tight">{feat.title}</p>
                                            <p className="text-[10px] text-indigo-200 leading-tight mt-0.5">{feat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. PREVIOUS RELEASES (History) */}
                {data.releases && data.releases.length > 1 && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-2">Previous Updates</h3>
                        {data.releases.slice(1).map((release: any, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 opacity-75 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500">
                                            <History size={14} />
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white">v{release.version}</span>
                                    </div>
                                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500">{release.date}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{release.description}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {release.features.map((f: any, i: number) => (
                                        <div key={i} className="flex flex-col">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                <span>{f.title}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 pl-3.5 leading-tight mt-0.5">{f.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-center py-8">
                     <p className="text-[10px] text-gray-400">App Version: {data.releases[0].version} (Build 2025.12.21)</p>
                     <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">© 2025 ProSpine</p>
                </div>
            </div>
        </div>
    );
};
