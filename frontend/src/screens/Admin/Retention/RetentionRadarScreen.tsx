import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdChevronLeft, MdSearch, MdPhone, MdMessage, 
    MdWarning, MdError, MdTrendingUp, MdRefresh,
    MdBusiness
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface AtRiskPatient {
    patient_id: number;
    patient_name: string;
    phone_number: string;
    branch_name: string;
    treatment_type: string;
    treatment_days: number;
    attended_days: number;
    last_visit_date: string;
    days_absent: number;
    risk_level: 'Critical' | 'High' | 'Medium';
    risk_score: number;
}

const RetentionRadarScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [leads, setLeads] = useState<AtRiskPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRadar = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const empId = user.employee_id || user.id;
            const res = await fetch(`${API_URL}/admin/insights.php?action=retention_radar&user_id=${empId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setLeads(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchRadar();
    }, [fetchRadar]);

    const filteredLeads = leads.filter(l => 
        l.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.branch_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getNudgeMessage = (patient: AtRiskPatient) => {
        return `Hi ${patient.patient_name}, we noticed you haven't visited Prospine for your ${patient.treatment_type} treatment in ${patient.days_absent} days. Is everything okay with your recovery? We'd love to see you back soon!`;
    };

    const handleWhatsAppNudge = (patient: AtRiskPatient) => {
        const msg = encodeURIComponent(getNudgeMessage(patient));
        const phone = patient.phone_number.replace(/\D/g, '');
        window.open(`https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${msg}`, '_blank');
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-200 relative overflow-hidden font-sans">
            
            {/* Branded Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-rose-50 via-rose-50/50 to-transparent dark:from-rose-900/10 dark:to-transparent pointer-events-none z-0" />

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
                            <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">Retention Radar</h1>
                            <p className="text-[10px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em] mt-2">Churn Prevention</p>
                        </div>
                    </div>
                    <button 
                        onClick={fetchRadar}
                        className="w-10 h-10 rounded-full bg-white/50 dark:bg-zinc-900/50 flex items-center justify-center text-gray-400 active:rotate-180 transition-all duration-500"
                    >
                        <MdRefresh size={20} />
                    </button>
                </div>

                <div className="relative">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        className="w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/10 transition-all placeholder:text-gray-300"
                        placeholder="Search at-risk patients..."
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-32 relative z-10 px-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                        <div className="w-6 h-6 border-2 border-transparent border-t-rose-500 rounded-full animate-spin" />
                        <p className="text-[9px] font-black uppercase tracking-widest italic">Scanning Records...</p>
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="py-24 text-center opacity-30 flex flex-col items-center">
                        <MdTrendingUp size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-sm font-light italic tracking-widest text-gray-400 uppercase">Retention Healthy</h3>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredLeads.map((lead, idx) => (
                            <div 
                                key={lead.patient_id}
                                className="bg-white dark:bg-zinc-900/40 rounded-[28px] p-5 border border-white dark:border-white/5 shadow-sm animate-slide-up"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                            lead.risk_level === 'Critical' ? 'bg-rose-50 text-rose-500' : 
                                            lead.risk_level === 'High' ? 'bg-orange-50 text-orange-500' : 
                                            'bg-amber-50 text-amber-500'
                                        }`}>
                                            {lead.risk_level === 'Critical' ? <MdError size={24} /> : <MdWarning size={24} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{lead.patient_name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                    <MdBusiness size={10} /> {lead.branch_name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                            lead.risk_level === 'Critical' ? 'bg-rose-500 text-white' : 
                                            lead.risk_level === 'High' ? 'bg-orange-500 text-white' : 
                                            'bg-amber-500 text-white'
                                        }`}>
                                            {lead.risk_level} Risk
                                        </div>
                                        <p className="text-[10px] font-medium text-gray-400 mt-2">{lead.days_absent}d Absent</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Last Seen</p>
                                        <p className="text-[11px] font-medium dark:text-white">{new Date(lead.last_visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Progress</p>
                                        <p className="text-[11px] font-medium dark:text-white">{lead.attended_days} / {lead.treatment_days || '∞'}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <a 
                                        href={`tel:${lead.phone_number}`}
                                        className="flex-1 py-3 bg-gray-900 dark:bg-zinc-800 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        <MdPhone size={14} /> Call
                                    </a>
                                    <button 
                                        onClick={() => handleWhatsAppNudge(lead)}
                                        className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                                    >
                                        <MdMessage size={14} /> Nudge
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default RetentionRadarScreen;
