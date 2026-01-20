import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdChevronLeft, MdSearch, MdPhone, MdMessage, 
    MdPerson, MdRefresh,
    MdStar, MdListAlt
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface DriftPartner {
    partner_id: number;
    name: string;
    phone: string;
    last_referral_date: string;
    total_referrals: number;
    days_since_referral: number;
    drift_level: 'Critical' | 'High' | 'Cold';
}

const ReferralDriftScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [partners, setPartners] = useState<DriftPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchDrift = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const empId = user.employee_id || user.id;
            const res = await fetch(`${API_URL}/admin/insights.php?action=referral_drift&user_id=${empId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setPartners(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchDrift();
    }, [fetchDrift]);

    const filteredPartners = partners.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getNudgeMessage = (partner: DriftPartner) => {
        return `Hi ${partner.name}, we just noticed it has been ${partner.days_since_referral} days since your last referral to Prospine. We value our partnership and would love to know if there is anything we can assist you or your patients with!`;
    };

    const handleWhatsAppNudge = (partner: DriftPartner) => {
        const msg = encodeURIComponent(getNudgeMessage(partner));
        const phone = partner.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${msg}`, '_blank');
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-200 relative overflow-hidden font-sans">
            
            {/* Branded Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-indigo-50 via-indigo-50/50 to-transparent dark:from-indigo-900/10 dark:to-transparent pointer-events-none z-0" />

            {/* Header */}
            <header className="px-6 py-6 pt-12 flex flex-col gap-6 z-40 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/admin/dashboard')} 
                            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900/50 shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
                        >
                            <MdChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">Referral Drift</h1>
                            <p className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mt-2">Partner Engagement</p>
                        </div>
                    </div>
                    <button 
                        onClick={fetchDrift}
                        className="w-10 h-10 rounded-full bg-white/50 dark:bg-zinc-900/50 flex items-center justify-center text-gray-400 active:rotate-180 transition-all duration-500"
                    >
                        <MdRefresh size={20} />
                    </button>
                </div>

                <div className="relative">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        className="w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300"
                        placeholder="Search partners..."
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-32 relative z-10 px-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                        <div className="w-6 h-6 border-2 border-transparent border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-[9px] font-black uppercase tracking-widest italic">Analyzing Connections...</p>
                    </div>
                ) : filteredPartners.length === 0 ? (
                    <div className="py-24 text-center opacity-30 flex flex-col items-center">
                        <MdStar size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-sm font-light italic tracking-widest text-gray-400 uppercase">Partners active</h3>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredPartners.map((partner, idx) => (
                            <div 
                                key={partner.partner_id}
                                className="bg-white dark:bg-zinc-900/40 rounded-[28px] p-5 border border-white dark:border-white/5 shadow-sm animate-slide-up"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                            partner.drift_level === 'Critical' ? 'bg-rose-50 text-rose-500' : 
                                            partner.drift_level === 'High' ? 'bg-orange-50 text-orange-500' : 
                                            'bg-amber-50 text-amber-500'
                                        }`}>
                                            <MdPerson size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{partner.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                    <MdListAlt size={10} className="text-gray-400" /> {partner.total_referrals} Total
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                            partner.drift_level === 'Critical' ? 'bg-rose-500 text-white' : 
                                            partner.drift_level === 'High' ? 'bg-orange-500 text-white' : 
                                            'bg-amber-500 text-white'
                                        }`}>
                                            {partner.drift_level} Drift
                                        </div>
                                        <p className="text-[10px] font-medium text-gray-400 mt-2">{partner.days_since_referral}d Silent</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Last Referral</p>
                                        <p className="text-[11px] font-medium dark:text-white">
                                            {new Date(partner.last_referral_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col justify-center text-center">
                                       <button 
                                            onClick={() => navigate('/admin/referrals')}
                                            className="text-[9px] font-black text-indigo-600 uppercase tracking-widest"
                                       >
                                           View History
                                       </button>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {partner.phone ? (
                                        <>
                                            <a 
                                                href={`tel:${partner.phone}`}
                                                className="flex-1 py-3 bg-gray-900 dark:bg-zinc-800 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
                                            >
                                                <MdPhone size={14} /> Call
                                            </a>
                                            <button 
                                                onClick={() => handleWhatsAppNudge(partner)}
                                                className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                                            >
                                                <MdMessage size={14} /> Nudge
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full py-3 bg-gray-50 dark:bg-white/5 text-gray-400 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest italic border border-dashed border-gray-200 dark:border-white/5">
                                            No Mobile No Found
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ReferralDriftScreen;
