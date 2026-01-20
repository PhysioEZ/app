import React from 'react';
import { Download } from 'lucide-react';

interface UpdateModalProps {
    version: string;
    notes?: string;
    url: string;
    forceUpdate: boolean;
    onClose: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ version, notes, url, forceUpdate, onClose }) => {
    
    const handleDownload = () => {
        window.open(url, '_blank');
        if (!forceUpdate) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white/95 dark:bg-gray-800/95 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 relative">
                
                {/* Decorative Background Blur */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl pointer-events-none" />

                {/* Header Icon */}
                <div className="pt-8 pb-4 flex justify-center relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-float">
                        <Download size={32} className="text-white drop-shadow-md" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="px-8 pb-6 text-center relative z-10">
                    <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                        Update Available!
                    </h2>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold mb-4 border border-indigo-100 dark:border-indigo-800">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Version {version}
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            A new version of the app is available. Upgrade now for the best experience.
                        </p>
                        
                        {notes && (
                            <div className="text-left bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 max-h-32 overflow-y-auto scrollbar-hide">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Release Notes</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                    {notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900/40 space-y-3 border-t border-gray-100 dark:border-gray-800/50 relative z-10">
                    <button 
                        onClick={handleDownload}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <Download size={20} className="animate-bounce" />
                        Downlaod Update
                    </button>
                    
                    {!forceUpdate && (
                        <button 
                            onClick={onClose}
                            className="w-full py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold text-sm transition-colors"
                        >
                            Possibly Later
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;
