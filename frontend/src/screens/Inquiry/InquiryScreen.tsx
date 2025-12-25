import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, Phone, Calendar, User, FileText, MapPin, Activity } from 'lucide-react';
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
        if (s === 'visited' || s === 'completed' || s === 'converted') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
        if (s === 'cancelled' || s === 'discarded') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
        if (s === 'contacted' || s === 'confirmed') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'; // Pending/New
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors pb-safe">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 px-4 py-3 pt-[var(--safe-area-inset-top,32px)] mt-0 shadow-sm sticky top-0 z-10">

                <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => navigate(-1)} className="p-1 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Inquiries</h1>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search name or phone..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500 dark:text-white"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors
                                ${activeTab === tab.id 
                                    ? 'bg-teal-600 text-white shadow-md' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                {loading && page === 1 ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
                ) : (
                    inquiries.length > 0 ? (
                        inquiries.map((item, index) => (
                            <InquiryCard 
                                key={item.id || index} 
                                item={item} 
                                type={activeTab} 
                                getStatusColor={getStatusColor} 
                                onClick={() => setSelectedItem(item)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            No inquiries found.
                        </div>
                    )
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-4 py-4">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm disabled:opacity-50 text-sm font-medium dark:text-white"
                        >
                            Previous
                        </button>
                        <span className="self-center text-sm text-gray-500">Page {page} of {totalPages}</span>
                        <button 
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm disabled:opacity-50 text-sm font-medium dark:text-white"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedItem.name}</h2>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(selectedItem.status)}`}>
                                    {selectedItem.status}
                                </span>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <ChevronLeft className="rotate-180" size={20} />
                            </button>
                        </div>
                        
                        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
                            <DetailRow label="Phone" value={selectedItem.phone} icon={<Phone size={14} />} />
                            <DetailRow label="Date" value={new Date(selectedItem.created_at).toLocaleDateString()} icon={<Calendar size={14} />} />
                            
                            {activeTab === 'quick' && (
                                <>
                                    <DetailRow label="Gender/Age" value={`${selectedItem.gender || '-'}, ${selectedItem.age || '-'}`} icon={<User size={14} />} />
                                    <DetailRow label="Referral" value={selectedItem.referral} />
                                    <DetailRow label="Chief Complaint" value={selectedItem.chief_complain} icon={<FileText size={14} />} />
                                    <DetailRow label="Remarks" value={selectedItem.review} icon={<FileText size={14} />} />
                                    <DetailRow label="Expected Visit" value={selectedItem.expected_visit_date} />
                                </>
                            )}
                            
                            {activeTab === 'test' && (
                                <>
                                    <DetailRow label="Test Name" value={selectedItem.testname} icon={<Activity size={14} />} />
                                    <DetailRow label="Referred By" value={selectedItem.referral} />
                                    <DetailRow label="Expected Visit" value={selectedItem.expected_visit_date} />
                                </>
                            )}

                             {activeTab === 'online' && (
                                <DetailRow label="Location" value={selectedItem.location} icon={<MapPin size={14} />} />
                            )}

                             {activeTab === 'booked' && (
                                <>
                                    <DetailRow label="Gender/Age" value={`${selectedItem.gender || '-'}, ${selectedItem.age || '-'}`} icon={<User size={14} />} />
                                    <DetailRow label="Consultation" value={selectedItem.consultationType} icon={<Activity size={14} />} />
                                    <DetailRow label="Medical Condition" value={selectedItem.medical_condition} />
                                    <DetailRow label="Condition Type" value={selectedItem.conditionType} />
                                    <DetailRow label="Occupation" value={selectedItem.occupation} />
                                    <DetailRow label="Contact Method" value={selectedItem.contactMethod} />
                                </>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3">
                             <a
                                href={`tel:${selectedItem.phone}`}
                                className="flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
                            >
                                <Phone size={18} /> Call
                            </a>
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold active:scale-95 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailRow = ({ label, value, icon }: any) => {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                {icon} {label}
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                {value}
            </p>
        </div>
    );
};

const InquiryCard = ({ item, type, getStatusColor, onClick }: any) => {
    return (
        <div onClick={onClick} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 dark:text-white">{item.name || 'Unknown'}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(item.status)}`}>
                    {item.status}
                </span>
            </div>
            
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                {item.phone && (
                    <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-teal-500" />
                        <span>{item.phone}</span>
                    </div>
                )}
                
                {/* Type Specific Fields - Limit to key fields for card */}
                {type === 'quick' && (
                    <>
                        <div className="flex items-center gap-1.5"><User size={12} /> {item.gender}, {item.age}y</div>
                        <div className="col-span-2 flex items-start gap-1.5"><FileText size={12} className="mt-0.5" /> <span className="line-clamp-1">{item.chief_complain}</span></div>
                    </>
                )}
                
                {type === 'test' && (
                    <>
                        <div className="col-span-2 flex items-center gap-1.5"><Activity size={12} /> Test: {item.testname}</div>
                    </>
                )}

                {type === 'online' && (
                     <div className="col-span-2 flex items-center gap-1.5"><MapPin size={12} /> {item.location}</div>
                )}

                {type === 'booked' && (
                    <>
                        <div className="col-span-2 flex items-center gap-1.5"><Activity size={12} /> {item.consultationType}</div>
                    </>
                )}

                <div className="flex items-center gap-1.5 col-span-2 mt-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <Calendar size={12} />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    {type === 'quick' && item.expected_visit_date && (
                         <span className="ml-auto text-orange-500">Visit: {item.expected_visit_date}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InquiryScreen;
