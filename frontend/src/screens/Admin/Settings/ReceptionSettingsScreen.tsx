import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
    MdAdd, MdEdit, MdDelete, MdPowerSettingsNew, 
    MdChevronLeft, MdSearch, MdClose, MdCheckCircle, MdWarning,
    MdMedicalServices, MdCampaign, MdBusinessCenter, MdMessage
} from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface ConfigItem {
    id: number;
    name: string;
    code: string;
    is_active: number;
    display_order: number;
    [key: string]: any;
}

const ReceptionSettingsScreen: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'complaints' | 'sources' | 'consultations' | 'services'>('complaints');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Data Store
    const [data, setData] = useState<{
        complaints: ConfigItem[],
        sources: ConfigItem[],
        consultations: ConfigItem[],
        services: ConfigItem[]
    }>({
        complaints: [],
        sources: [],
        consultations: [],
        services: []
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
    const [formData, setFormData] = useState({ name: '', code: '', is_active: 1, display_order: 0 });
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState<{type: 'success'|'error', message: string} | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const empId = user.employee_id || user.id;
            const res = await fetch(`${API_URL}/admin/reception_settings.php?action=fetch_metadata&user_id=${empId}`);
            const json = await res.json();
            if (json.status === 'success') {
                const normalized = {
                    complaints: json.data.complaints.map((i: any) => ({ ...i, id: i.complaint_id, name: i.complaint_name, code: i.complaint_code })),
                    sources: json.data.sources.map((i: any) => ({ ...i, id: i.source_id, name: i.source_name, code: i.source_code })),
                    consultations: json.data.consultations.map((i: any) => ({ ...i, id: i.consultation_id, name: i.consultation_name, code: i.consultation_code })),
                    services: json.data.services.map((i: any) => ({ ...i, id: i.service_id, name: i.service_name, code: i.service_code }))
                };
                setData(normalized);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        try {
            const empId = user.employee_id || user.id;
            const res = await fetch(`${API_URL}/admin/reception_settings.php?action=save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: empId,
                    category: activeTab,
                    id: editingItem ? editingItem.id : null,
                    ...formData
                })
            });
            const json = await res.json();
            if (json.status === 'success') {
                setIsModalOpen(false);
                fetchData();
                notify('success', 'Changes saved');
            } else {
                notify('error', json.message);
            }
        } catch (e) {
            notify('error', 'Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (item: ConfigItem) => {
        const newStatus = item.is_active === 1 ? 0 : 1;
        // Optimistic update
        const newData = { ...data };
        const idx = newData[activeTab].findIndex(i => i.id === item.id);
        if (idx !== -1) newData[activeTab][idx].is_active = newStatus;
        setData(newData);

        try {
            await fetch(`${API_URL}/admin/reception_settings.php?action=toggle_status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: activeTab, id: item.id, status: newStatus })
            });
        } catch (e) {
            fetchData();
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('This action is permanent. Continue?')) return;
        try {
            const res = await fetch(`${API_URL}/admin/reception_settings.php?action=delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: activeTab, id: id })
            });
            const json = await res.json();
            if (json.status === 'success') {
                fetchData();
                notify('success', 'Item deleted');
            }
        } catch (e) {
            notify('error', 'Delete failed');
        }
    };

    const openModal = (item: ConfigItem | null = null) => {
        setEditingItem(item);
        if (item) {
            setFormData({ name: item.name, code: item.code, is_active: item.is_active, display_order: item.display_order });
        } else {
            setFormData({ name: '', code: '', is_active: 1, display_order: 0 });
        }
        setIsModalOpen(true);
    };

    const notify = (type: 'success' | 'error', msg: string) => {
        setNotification({ type, message: msg });
        setTimeout(() => setNotification(null), 3000);
    };

    const tabs = [
        { id: 'complaints', label: 'Complaints', singular: 'Complaint', icon: <MdMedicalServices size={20} />, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'sources', label: 'Sources', singular: 'Source', icon: <MdCampaign size={20} />, color: 'text-purple-500', bg: 'bg-purple-50' },
        { id: 'consultations', label: 'Consultations', singular: 'Consultation', icon: <MdBusinessCenter size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 'services', label: 'Services', singular: 'Service', icon: <MdMessage size={20} />, color: 'text-orange-500', bg: 'bg-orange-50' }
    ];

    const currentTab = useMemo(() => tabs.find(t => t.id === activeTab)!, [activeTab]);

    const filteredData = useMemo(() => {
        const items = data[activeTab];
        if (!searchTerm) return items;
        const low = searchTerm.toLowerCase();
        return items.filter(i => i.name.toLowerCase().includes(low) || i.code.toLowerCase().includes(low));
    }, [data, activeTab, searchTerm]);

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-black transition-colors duration-200 relative overflow-hidden font-sans">
            
            {/* Branded Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#e0f2fe] via-[#e0f2fe]/50 to-transparent dark:from-blue-900/10 dark:to-transparent pointer-events-none z-0" />

            {/* Header */}
            <header className="px-6 py-6 pt-12 flex flex-col gap-6 z-40 relative">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/admin/menu')} 
                            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900/50 shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
                        >
                            <MdChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight leading-none">Reception Settings</h1>
                            <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mt-2">Config & Metadata</p>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        className="w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-gray-300"
                        placeholder={`Search ${currentTab.label}...`}
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Tab Strip */}
                <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all relative shrink-0 ${
                                activeTab === tab.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                : 'bg-white dark:bg-zinc-900 text-gray-400 border border-gray-50 dark:border-white/5'
                            }`}
                        >
                            <div className={`${activeTab === tab.id ? 'text-white' : tab.color}`}>
                                {tab.icon}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar p-5 pb-32 space-y-3 relative z-10">
                {loading ? (
                    <div className="py-20 text-center opacity-40 italic text-[10px] font-black uppercase tracking-widest">Loading metadata...</div>
                ) : filteredData.length === 0 ? (
                    <div className="py-20 text-center opacity-40 italic text-[10px] font-black uppercase tracking-widest">No entries found</div>
                ) : (
                    filteredData.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-zinc-900/50 p-5 rounded-[28px] border border-white dark:border-white/5 shadow-sm transition-all flex items-center gap-4 group">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border shadow-inner shrink-0 ${currentTab.bg} ${currentTab.color} border-current/10`}>
                                {item.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate">{item.name}</h3>
                                <p className="text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-1">CODE: {item.code} • ORDER: {item.display_order}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => handleToggleStatus(item)}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${item.is_active ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-gray-50 text-gray-300 border border-gray-200'}`}
                                >
                                    <MdPowerSettingsNew size={18} />
                                </button>
                                <button 
                                    onClick={() => openModal(item)}
                                    className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-400 flex items-center justify-center active:scale-90 transition-all border border-gray-100 dark:border-white/5"
                                >
                                    <MdEdit size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center active:scale-90 transition-all border border-rose-100"
                                >
                                    <MdDelete size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* FAB Button */}
            <button 
                onClick={() => openModal()}
                className="fixed bottom-24 right-6 w-14 h-14 rounded-[24px] bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-2xl flex items-center justify-center active:scale-95 transition-all z-50 animate-in fade-in slide-in-from-bottom-6 duration-500"
            >
                <MdAdd size={32} />
            </button>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-black w-full sm:max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-slide-up border border-white dark:border-white/5 flex flex-col">
                        <header className="p-10 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-light italic text-gray-900 dark:text-white">
                                    {editingItem ? 'Edit' : 'New'} {currentTab.singular}
                                </h3>
                                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-2">Manage System Config</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-900 text-gray-400 flex items-center justify-center active:scale-90 transition-all">
                                <MdClose size={24}/>
                            </button>
                        </header>
                        
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-10 pb-10 no-scrollbar space-y-6">
                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Display Name</label>
                                <input 
                                    required
                                    className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-xl font-light italic text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    placeholder="e.g. Neck Pain"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2">System Code</label>
                                <input 
                                    required
                                    className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono"
                                    placeholder="e.g. neck_pain"
                                    value={formData.code}
                                    onChange={e => setFormData({...formData, code: e.target.value})}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Order</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        value={formData.display_order}
                                        onChange={e => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, is_active: formData.is_active ? 0 : 1})}
                                        className={`w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                                            formData.is_active 
                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                            : 'bg-gray-100 text-gray-400 border-gray-200'
                                        }`}
                                    >
                                        {formData.is_active ? 'Active' : 'Hidden'}
                                    </button>
                                </div>
                            </div>

                            <button 
                                disabled={submitting}
                                className="w-full h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[28px] font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 disabled:opacity-30 transition-all mt-4"
                            >
                                {submitting ? 'Syncing...' : 'Save Configuration'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Notification */}
            {notification && (
                <div className={`fixed bottom-6 left-6 right-6 z-[200] p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up ${
                    notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                    {notification.type === 'success' ? <MdCheckCircle size={24} /> : <MdWarning size={24} />}
                    <p className="text-[11px] font-black uppercase tracking-widest">{notification.message}</p>
                </div>
            )}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .animate-fade-in { animation: fadeIn 0.2s ease-out; }
                .animate-slide-up { animation: slideUp 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default ReceptionSettingsScreen;
