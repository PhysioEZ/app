import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdSearch, 
    MdArrowBack, 
    MdPhone, 
    MdCalendarToday, 
    MdPerson, 
    MdDescription, 
    MdLocationOn, 
    MdLocalActivity, 
    MdClose,
    MdFilterList
} from 'react-icons/md';
import { useAuthStore } from '../../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

const InquiryScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'quick' | 'test' | 'online' | 'booked'>('quick');
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                branch_id: (user?.role === 'admin' ? 1 : 1).toString(), // Default 1
                type: activeTab,
                page: page.toString(),
                search: search,
                limit: '15'
            });
            const response = await fetch(`${API_URL}/inquiries.php?${query.toString()}`);
            const json = await response.json();
            if (json.status === 'success') {
                setInquiries(json.data);
                setTotalPages(json.pagination.pages);
            }
        } catch (error) {
            console.error('Failed to fetch inquiries', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1); // Reset page on tab change
    }, [activeTab]);

    useEffect(() => {
        fetchInquiries();
    }, [activeTab, page, search]);

    const tabs = [
        { id: 'quick', label: 'Quick' },
        { id: 'test', label: 'Test' },
        { id: 'online', label: 'Online' },
        { id: 'booked', label: 'Booked' },
    ];

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'visited' || s === 'completed' || s === 'converted') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        if (s === 'cancelled' || s === 'discarded') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800';
        if (s === 'contacted' || s === 'confirmed') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800'; // Pending/New
    };

    return (
        <div className="flex flex-col h-full bg-surface dark:bg-gray-950 transition-colors pb-safe font-sans relative">
             {/* Primary Gradient Background Mesh */}
             <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent pointer-events-none z-0 dark:from-primary/10" />

            {/* Header */}
            <div className="bg-transparent backdrop-blur-xl px-5 py-3 pt-[max(env(safe-area-inset-top),32px)] sticky top-0 z-30 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-variant/40 dark:hover:bg-gray-800 text-on-surface dark:text-white transition-colors">
                        <MdArrowBack size={24} />
                    </button>
                    <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight">Inquiries</h1>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-gray-400 group-focus-within:text-primary" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search name or phone..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-surface-variant/40 dark:bg-gray-900/60 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/50 text-on-surface dark:text-white placeholder-outline/60 dark:placeholder-gray-500 shadow-sm transition-all"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all uppercase tracking-wide
                                ${activeTab === tab.id 
                                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/30 scale-105' 
                                    : 'bg-surface dark:bg-gray-800 text-outline dark:text-gray-400 hover:bg-surface-variant dark:hover:bg-gray-700 border border-outline-variant/10'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-2 pb-24 space-y-3 no-scrollbar">
                {loading && page === 1 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                        <p className="text-xs font-bold text-outline uppercase tracking-wider">Loading...</p>
                    </div>
                ) : (
                    inquiries.length > 0 ? (
                        inquiries.map((item, index) => (
                            <div key={item.id || index} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                <InquiryCard 
                                    item={item} 
                                    type={activeTab} 
                                    getStatusColor={getStatusColor} 
                                    onClick={() => setSelectedItem(item)}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                            <div className="w-16 h-16 bg-surface-variant/30 rounded-full flex items-center justify-center mb-4">
                                <MdFilterList size={32} className="text-outline/50" />
                            </div>
                            <p className="text-outline font-medium">No inquiries found.</p>
                        </div>
                    )
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-4 py-6">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-6 py-2.5 bg-surface dark:bg-gray-800 rounded-xl shadow-sm border border-outline-variant/20 disabled:opacity-50 text-xs font-bold uppercase tracking-wider text-on-surface dark:text-white hover:bg-surface-variant transition-colors"
                        >
                            Previous
                        </button>
                        <span className="self-center text-xs font-bold text-outline dark:text-gray-400">Page {page} of {totalPages}</span>
                        <button 
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="px-6 py-2.5 bg-surface dark:bg-gray-800 rounded-xl shadow-sm border border-outline-variant/20 disabled:opacity-50 text-xs font-bold uppercase tracking-wider text-on-surface dark:text-white hover:bg-surface-variant transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedItem && (
                <div 
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4" 
                    onClick={() => setSelectedItem(null)}
                >
                    <div 
                        className="bg-surface dark:bg-gray-900 w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-slide-up border border-outline-variant/10 dark:border-gray-800 max-h-[85vh] flex flex-col" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 pb-2 shrink-0">
                            <div className="w-12 h-1.5 bg-surface-variant/50 rounded-full mx-auto mb-6 sm:hidden"></div>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h2 className="text-2xl font-bold font-poppins text-on-surface dark:text-white leading-tight">{selectedItem.name}</h2>
                                    <span className={`inline-flex items-center mt-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(selectedItem.status)}`}>
                                        {selectedItem.status}
                                    </span>
                                </div>
                                <button onClick={() => setSelectedItem(null)} className="p-2 -mr-2 bg-surface-variant/30 dark:bg-gray-800 rounded-full hover:bg-surface-variant dark:hover:bg-gray-700 transition-colors">
                                    <MdClose size={24} className="text-on-surface dark:text-white" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="p-6 pt-2 overflow-y-auto space-y-5 custom-scrollbar">
                            <DetailRow label="Phone Number" value={selectedItem.phone} icon={<MdPhone size={16} />} isLink href={`tel:${selectedItem.phone}`} />
                            <DetailRow label="Inquiry Date" value={new Date(selectedItem.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })} icon={<MdCalendarToday size={16} />} />
                            
                            {activeTab === 'quick' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailRow label="Gender" value={selectedItem.gender} icon={<MdPerson size={16} />} />
                                        <DetailRow label="Age" value={selectedItem.age ? `${selectedItem.age} Years` : ''} />
                                    </div>
                                    <DetailRow label="Chief Complaint" value={selectedItem.chief_complain} icon={<MdDescription size={16} />} />
                                    <DetailRow label="Remarks" value={selectedItem.review} />
                                    <DetailRow label="Expected Visit" value={selectedItem.expected_visit_date ? new Date(selectedItem.expected_visit_date).toLocaleDateString() : ''} icon={<MdCalendarToday size={16} />} highlight />
                                </>
                            )}
                            
                            {activeTab === 'test' && (
                                <>
                                    <DetailRow label="Test Name" value={selectedItem.testname} icon={<MdLocalActivity size={16} />} />
                                    <DetailRow label="Referred By" value={selectedItem.referral} />
                                    <DetailRow label="Expected Visit" value={selectedItem.expected_visit_date} icon={<MdCalendarToday size={16} />} />
                                </>
                            )}

                             {activeTab === 'online' && (
                                <DetailRow label="Location" value={selectedItem.location} icon={<MdLocationOn size={16} />} />
                            )}

                             {activeTab === 'booked' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailRow label="Gender" value={selectedItem.gender} icon={<MdPerson size={16} />} />
                                        <DetailRow label="Age" value={selectedItem.age ? `${selectedItem.age} Years` : ''} />
                                    </div>
                                    <DetailRow label="Consultation" value={selectedItem.consultationType} icon={<MdLocalActivity size={16} />} />
                                    <DetailRow label="Medical Condition" value={selectedItem.medical_condition} />
                                    <DetailRow label="Occupation" value={selectedItem.occupation} />
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 pb-8 border-t border-outline-variant/10 dark:border-gray-800 grid grid-cols-1 gap-3 shrink-0">
                             <a
                                href={`tel:${selectedItem.phone}`}
                                className="flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/25 active:scale-[0.98] transition-all hover:bg-primary/90"
                            >
                                <MdPhone size={20} /> Call Patient
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailRow = ({ label, value, icon, isLink, href, highlight }: any) => {
    if (!value || value === '-') return null;
    
    const Content = () => (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                {icon && <span className="text-primary dark:text-primary-container">{icon}</span>}
                {label}
            </span>
            <p className={`text-sm font-medium leading-relaxed ${isLink ? 'text-primary underline decoration-primary/30 underline-offset-2' : ''} ${highlight ? 'text-amber-600 dark:text-amber-400' : 'text-on-surface dark:text-gray-200'}`}>
                {value}
            </p>
        </div>
    );

    if (isLink && href) {
        return <a href={href} className="block hover:opacity-80 transition-opacity"><Content /></a>;
    }
    return <Content />;
};

const InquiryCard = ({ item, type, getStatusColor, onClick }: any) => {
    return (
        <div onClick={onClick} className="bg-surface dark:bg-gray-900 p-5 rounded-[24px] shadow-sm border border-outline-variant/10 dark:border-gray-800 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md hover:border-outline-variant/20 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-3 relative z-10">
                <h3 className="font-bold text-base text-on-surface dark:text-white leading-tight">{item.name || 'Unknown'}</h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(item.status)}`}>
                    {item.status}
                </span>
            </div>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs mt-3 relative z-10">
                {item.phone && (
                    <div className="flex items-center gap-2 text-on-surface-variant dark:text-gray-300 font-medium">
                        <MdPhone size={14} className="text-primary" />
                        <span>{item.phone}</span>
                    </div>
                )}
                
                {/* Type Specific Fields */}
                {type === 'quick' && (
                    <>
                        <div className="flex items-center gap-2 text-outline dark:text-gray-400">
                            <MdPerson size={14} /> 
                            <span>{item.gender || '-'}, {item.age || '-'}y</span>
                        </div>
                        {item.chief_complain && (
                            <div className="col-span-2 flex items-start gap-2 text-outline dark:text-gray-400">
                                <MdDescription size={14} className="mt-0.5 shrink-0" /> 
                                <span className="line-clamp-1">{item.chief_complain}</span>
                            </div>
                        )}
                    </>
                )}
                
                {type === 'test' && (
                    <div className="col-span-2 flex items-center gap-2 text-outline dark:text-gray-400">
                        <MdLocalActivity size={14} /> 
                        <span className="font-medium text-on-surface-variant dark:text-gray-300">{item.testname}</span>
                    </div>
                )}

                {type === 'online' && (
                     <div className="col-span-2 flex items-center gap-2 text-outline dark:text-gray-400">
                         <MdLocationOn size={14} /> 
                         <span>{item.location}</span>
                     </div>
                )}

                {type === 'booked' && (
                    <div className="col-span-2 flex items-center gap-2 text-outline dark:text-gray-400">
                        <MdLocalActivity size={14} /> 
                        <span>{item.consultationType}</span>
                    </div>
                )}
            </div>
             
             {/* Footer Info */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/10 dark:border-gray-800 relative z-10">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-outline/70 dark:text-gray-500 uppercase tracking-wider">
                    <MdCalendarToday size={12} />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                {type === 'quick' && item.expected_visit_date && (
                     <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                         Visit: {new Date(item.expected_visit_date).toLocaleDateString()}
                     </span>
                )}
            </div>
            
            {/* Decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
        </div>
    );
};

export default InquiryScreen;
