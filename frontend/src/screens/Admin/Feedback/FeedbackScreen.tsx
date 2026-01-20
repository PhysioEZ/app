import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { 
    MdMessage, MdSearch, MdFilterList, 
    MdSentimentVerySatisfied, MdSentimentNeutral, 
    MdSentimentVeryDissatisfied, MdPerson, 
    MdLocationOn, MdPhone, MdChevronLeft 
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface Feedback {
    feedback_id: number;
    feedback_type: 'Good' | 'Average' | 'Bad';
    patient_status_snapshot: string;
    comments: string;
    created_at: string;
    patient_name: string;
    phone_number: string;
    first_name: string; // Employee First Name
    last_name: string;  // Employee Last Name
    branch_name: string;
}

const FeedbackScreen: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, good: 0, average: 0, bad: 0 });
    
    // Filters
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'Good' | 'Average' | 'Bad'>('all');

    useEffect(() => {
        if (user) fetchFeedback();
    }, [user, filterType, search]); // Re-fetch on filter change or use client-side filtering? 
                                    // API supports search, but let's debounce or just fetch all and filter client side if small data?
                                    // The API we built supports search params. Let's use them.

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (user) fetchFeedback();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const empId = (user as any).employee_id || user?.id;
            let url = `${API_URL}/admin/feedback.php?action=fetch_feedback&user_id=${empId}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (filterType !== 'all') url += `&type=${filterType}`;

            const res = await fetch(url);
            const json = await res.json();
            if (json.status === 'success') {
                setFeedbacks(json.data);
                setStats(json.stats);
            } else {
                setFeedbacks([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Good': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
            case 'Average': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
            case 'Bad': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800';
            default: return 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Good': return <MdSentimentVerySatisfied size={18} />;
            case 'Average': return <MdSentimentNeutral size={18} />;
            case 'Bad': return <MdSentimentVeryDissatisfied size={18} />;
            default: return <MdMessage size={18} />;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-200 relative overflow-hidden font-sans">
            
            {/* Branded Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#f0f9ff] via-[#f0f9ff]/50 to-transparent dark:from-sky-900/10 dark:to-transparent pointer-events-none z-0" />

            {/* Header */}
            <header className="px-6 py-6 pt-12 flex flex-col gap-6 z-40 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/admin/menu')} 
                            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900/50 shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
                        >
                            <MdChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">Feedback</h1>
                            <p className="text-[10px] font-medium text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em] mt-2">Patient Experience</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            className="w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/10 transition-all placeholder:text-gray-300"
                            placeholder="Find feedback..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Filter Type Toggle */}
                    <div className="flex bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-2xl p-1 gap-1">
                         <button 
                            onClick={() => setFilterType('all')}
                            className={`p-2 rounded-xl transition-all ${filterType === 'all' ? 'bg-white dark:bg-zinc-800 shadow-sm text-sky-600 dark:text-sky-400' : 'text-gray-400 hover:text-gray-600'}`}
                         >
                            <MdFilterList size={20} />
                         </button>
                         <button 
                            onClick={() => setFilterType(filterType === 'Good' ? 'all' : 'Good')}
                            className={`p-2 rounded-xl transition-all ${filterType === 'Good' ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-400 hover:text-sky-500'}`}
                         >
                            <MdSentimentVerySatisfied size={20} />
                         </button>
                         <button 
                            onClick={() => setFilterType(filterType === 'Bad' ? 'all' : 'Bad')}
                            className={`p-2 rounded-xl transition-all ${filterType === 'Bad' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-400 hover:text-rose-500'}`}
                         >
                            <MdSentimentVeryDissatisfied size={20} />
                         </button>
                    </div>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3 px-6 pt-6">
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.good}</span>
                    <span className="text-[10px] font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-wider">Good</span>
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.average}</span>
                    <span className="text-[10px] font-bold text-amber-600/60 dark:text-amber-400/60 uppercase tracking-wider">Neutral</span>
                </div>
                <div className="bg-rose-50/50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.bad}</span>
                    <span className="text-[10px] font-bold text-rose-600/60 dark:text-rose-400/60 uppercase tracking-wider">Bad</span>
                </div>
            </div>

            {/* List */}
            <main className="flex-1 p-6 space-y-4 pb-24 overflow-y-auto">
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-medium">No feedback found</div>
                ) : (
                    feedbacks.map(fb => (
                        <div key={fb.feedback_id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                            
                            {/* Header: Patient & Rating */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                        {(fb.patient_name || 'A').charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                                            {fb.patient_name}
                                        </h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                            {new Date(fb.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 ${getTypeColor(fb.feedback_type)}`}>
                                    {getTypeIcon(fb.feedback_type)}
                                    <span className="text-[10px] font-black uppercase tracking-wide">{fb.feedback_type}</span>
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl mb-3">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 italic">
                                    "{fb.comments || 'No comments provided.'}"
                                </p>
                            </div>

                            {/* Footer: Branch & Staff & Action */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700/50 mt-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                                        <MdLocationOn size={12} />
                                        <span>{fb.branch_name || 'Global'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                                        <MdPerson size={12} />
                                        <span>{fb.first_name} {fb.last_name}</span>
                                    </div>
                                </div>
                                
                                {fb.phone_number && (
                                    <a 
                                        href={`tel:${fb.phone_number}`}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
                                    >
                                        <MdPhone size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-wide">Call Patient</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
};

export default FeedbackScreen;
