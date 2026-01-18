import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  MdSearch,
  MdArrowBack,
  MdPerson,
  MdPhone,
  MdCalendarToday,
  MdAdd,
  MdCheckCircle,
  MdError,
  MdClose,
  MdDescription,
  MdMedicalServices,
  MdStickyNote2,
  MdAssignment,
  MdAccessTime,
  MdCancel
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface Registration {
  registration_id: number;
  patient_name: string;
  phone_number: string;
  age: number | string;
  gender: string;
  consultation_type: string;
  reffered_by: string;
  chief_complain: string;
  consultation_amount: number | string;
  created_at: string;
  status: string;
  patient_photo_path: string | null;
  patient_uid: string | null;
  is_patient_created: number;
  email?: string;
  address?: string;
  doctor_notes?: string;
  prescription?: string;
  follow_up_date?: string;
  remarks?: string;
  payment_method?: string;
}

interface RegistrationStats {
  total: number;
  pending: number;
  consulted: number;
  cancelled: number;
}

const DetailRow = ({ icon, label, value, className = '' }: { icon: any, label: string, value: React.ReactNode, className?: string }) => {
  if (!value) return null;
  return (
    <div className={`flex gap-3 items-start ${className}`}>
      <div className="mt-0.5 p-1.5 bg-surface-variant/50 dark:bg-gray-700/50 rounded-lg text-primary dark:text-primary-container shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-sm font-medium text-on-surface dark:text-gray-100">{value}</div>
      </div>
    </div>
  );
};

export const RegistrationScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Helper to format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Fetch Logic
  const fetchRegistrations = async (pageNum: number, search: string) => {
    setLoading(true);
    try {
      const branchId = user?.branch_id || 1;
      const params = new URLSearchParams({
        branch_id: branchId.toString(),
        page: pageNum.toString(),
        limit: '15',
        search: search
      });

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      const response = await fetch(`${baseUrl}/registrations.php?${params.toString()}`);
      const data = await response.json();

      if (data.status === 'success') {
        setRegistrations(prev => pageNum === 1 ? data.data : [...prev, ...data.data]);
        setTotalPages(data.pagination.pages);
        if (data.stats) {
            setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update Status Logic
  const handleStatusUpdate = async (newStatus: string) => {
      if (!selectedRegistration) return;
      setUpdatingStatus(true);
      try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
          const res = await fetch(`${baseUrl}/update_registration_status.php`, {
              method: 'POST',
              body: JSON.stringify({
                  registration_id: selectedRegistration.registration_id,
                  status: newStatus
              })
          });
          const json = await res.json();
          if (json.status === 'success') {
              // Update local state
              const updatedReg = { ...selectedRegistration, status: newStatus };
              setSelectedRegistration(updatedReg);
              setRegistrations(prev => prev.map(r => r.registration_id === updatedReg.registration_id ? updatedReg : r));
              // Refresh stats if we wanted to be perfectly accurate, but simpler to skip for now to avoid jumpiness
          }
      } catch (err) {
          console.error("Status update failed", err);
      } finally {
          setUpdatingStatus(false);
      }
  };

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchRegistrations(1, searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRegistrations(nextPage, searchQuery);
    }
  };

  const handleCardClick = async (reg: Registration) => {
    setSelectedRegistration(reg); // Show partial data immediately
    setDetailLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      const response = await fetch(`${baseUrl}/registrations.php?id=${reg.registration_id}&branch_id=${user?.branch_id || 1}`);
      const data = await response.json();
      if (data.status === 'success') {
        // Merge with existing to keep UI smooth if backend sends more fields
        setSelectedRegistration(prev => ({ ...prev, ...data.data }));
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'consulted': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'closed': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      default: return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    }
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    return `https://prospine.in/proadmin/admin/${path}`;
  };

  return (
    <div className="flex flex-col h-full bg-surface dark:bg-gray-950 transition-colors relative font-sans">
      {/* Primary Gradient Background Mesh */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent pointer-events-none z-0 dark:from-primary/10" />

      {/* Header */}
      <div className="bg-transparent backdrop-blur-xl sticky top-0 z-20 pt-[max(env(safe-area-inset-top),32px)] transition-colors duration-200">
        <div className="px-5 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2 -ml-2 hover:bg-surface-variant/40 dark:hover:bg-gray-800 rounded-full transition-colors font-bold text-on-surface dark:text-white"
          >
            <MdArrowBack size={24} />
          </button>
          <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight">Registrations</h1>
        </div>
        
        {/* Search */}
        <div className="px-5 pb-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdSearch className="h-5 w-5 text-outline group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-surface-variant/40 dark:bg-gray-900/60 border-none rounded-2xl text-sm text-on-surface dark:text-white placeholder:text-outline/60 focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 space-y-4 pb-28 no-scrollbar">
        
        {/* Stats Card - Enhanced */}
        {stats && (
            <div className="grid grid-cols-2 gap-3 mb-2 animate-slide-up">
                <div className="col-span-2 bg-gradient-to-br from-primary to-secondary rounded-[24px] p-5 text-on-primary shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="flex justify-between items-end relative z-10">
                        <div>
                            <p className="text-primary-container/80 text-xs font-bold uppercase tracking-wider mb-2">Total Registrations</p>
                            <p className="text-4xl font-black">{stats.total}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <MdAssignment size={24} className="text-white" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-surface dark:bg-gray-900 p-4 rounded-[20px] shadow-sm border border-outline-variant/10 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Pending</p>
                    <p className="text-2xl font-bold text-on-surface dark:text-white">{stats.pending}</p>
                </div>
                <div className="bg-surface dark:bg-gray-900 p-4 rounded-[20px] shadow-sm border border-outline-variant/10 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                     <p className="text-[10px] font-bold text-green-600 dark:text-green-500 uppercase tracking-widest mb-1">Consulted</p>
                    <p className="text-2xl font-bold text-on-surface dark:text-white">{stats.consulted}</p>
                </div>
            </div>
        )}

        {loading && page === 1 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="text-xs font-bold text-outline">Loading Records...</p>
          </div>
        ) : registrations.length > 0 ? (
          <div className="space-y-3">
            {registrations.map((reg, index) => (
              <div 
                key={reg.registration_id}
                onClick={() => handleCardClick(reg)}
                className="bg-surface dark:bg-gray-900 rounded-[24px] p-4 shadow-sm border border-outline-variant/10 dark:border-gray-800 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group animate-slide-up hover:shadow-md"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex gap-4 items-start">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-surface-variant dark:bg-gray-800 flex items-center justify-center text-outline dark:text-gray-400 font-bold text-xl overflow-hidden shadow-inner uppercase">
                      {reg.patient_photo_path ? (
                        <img src={getImageUrl(reg.patient_photo_path) || ''} alt={reg.patient_name} className="w-full h-full object-cover" />
                      ) : (
                        reg.patient_name.charAt(0)
                      )}
                    </div>
                    {reg.status?.toLowerCase() === 'pending' && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-error rounded-full border-2 border-surface dark:border-gray-900"></span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                       <h3 className="font-bold text-base text-on-surface dark:text-white truncate pr-2">{reg.patient_name}</h3>
                       <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wide border ${getStatusColor(reg.status)}`}>
                         {reg.status}
                       </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 mb-2">
                         <span className="text-[10px] font-mono text-outline dark:text-gray-500 bg-surface-variant/50 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                            {reg.patient_uid ? `#${reg.patient_uid}` : `#${reg.registration_id}`}
                         </span>
                         <span className="text-xs text-outline/40">•</span>
                         <span className="text-xs font-medium text-on-surface-variant dark:text-gray-400 flex items-center gap-1">
                             <MdCalendarToday size={12} /> {formatDate(reg.created_at)}
                         </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-outline dark:text-gray-400">
                        {reg.chief_complain && (
                           <div className="flex items-center gap-1.5 bg-primary-container/30 dark:bg-primary/10 text-primary dark:text-primary-container px-2 py-1 rounded-md max-w-[60%] truncate">
                              <MdMedicalServices size={12} /> <span className="truncate">{reg.chief_complain}</span>
                           </div>
                        )}
                        <div className="flex items-center gap-1">
                           <MdPhone size={12} /> {reg.phone_number}
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination / Load More */}
            {page < totalPages && (
               <div className="flex justify-center pt-4">
                 <button 
                   onClick={loadMore}
                   className="group relative px-6 py-3 bg-surface dark:bg-gray-800 text-primary text-xs font-bold uppercase tracking-wider rounded-2xl shadow-sm border border-outline-variant/20 dark:border-gray-700 overflow-hidden hover:bg-surface-variant transition-colors"
                 >
                   Load More Records
                 </button>
               </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
            <div className="w-20 h-20 bg-surface-variant/30 rounded-full flex items-center justify-center mb-4">
              <MdPerson size={32} className="text-outline/50" />
            </div>
            <h3 className="text-on-surface dark:text-white font-bold mb-1">No registrations found</h3>
            <p className="text-outline dark:text-gray-400 text-sm max-w-[200px]">Try adjusting your search.</p>
          </div>
        )}
      </div>

      {/* Details Modal - Premium Glass revamp */}
      {selectedRegistration && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-4 perspective-1000">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedRegistration(null)}
          ></div>
          <div className="relative bg-surface dark:bg-gray-900 w-full sm:max-w-md sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up duration-300">
            
            {/* Modal Header with Status Toggle */}
            <div className="px-6 py-5 border-b border-outline-variant/10 dark:border-gray-800 bg-surface dark:bg-gray-900 z-10 sticky top-0">
               <div className="flex justify-between items-start mb-4">
                   <h2 className="text-2xl font-bold font-poppins text-on-surface dark:text-white leading-tight">{selectedRegistration.patient_name}</h2>
                   <button 
                     onClick={() => setSelectedRegistration(null)}
                     className="p-2 -mr-2 bg-surface-variant/30 hover:bg-surface-variant dark:hover:bg-gray-700 rounded-full transition-colors"
                   >
                     <MdClose size={24} className="text-on-surface dark:text-white" />
                   </button>
               </div>

               {/* Segmented Button Group */}
               <div className="flex w-full bg-surface-variant/30 dark:bg-gray-800/50 p-1 rounded-full relative">
                   {['Pending', 'Consulted', 'Cancelled'].map((status) => {
                       const isActive = selectedRegistration.status === status;
                       
                       // Config for each status
                       let activeClass = '';
                       let icon = null;
                       
                       if (status === 'Pending') {
                           icon = <MdAccessTime size={16} />;
                           activeClass = isActive ? 'bg-amber-100 text-amber-800 dark:bg-amber-600 dark:text-white shadow-md' : 'text-outline dark:text-gray-400 hover:bg-surface-variant/50';
                       } else if (status === 'Consulted') {
                           icon = <MdCheckCircle size={16} />;
                           activeClass = isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-600 dark:text-white shadow-md' : 'text-outline dark:text-gray-400 hover:bg-surface-variant/50';
                       } else if (status === 'Cancelled') {
                           icon = <MdCancel size={16} />;
                           activeClass = isActive ? 'bg-rose-100 text-rose-800 dark:bg-rose-600 dark:text-white shadow-md' : 'text-outline dark:text-gray-400 hover:bg-surface-variant/50';
                       }

                       return (
                           <button
                                key={status}
                                onClick={() => handleStatusUpdate(status)}
                                disabled={updatingStatus}
                                className={`
                                    flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider 
                                    flex items-center justify-center gap-2
                                    rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                    ${activeClass}
                                    ${isActive ? 'scale-100 z-10 ring-0 shadow-lg' : 'scale-90 opacity-70 hover:opacity-100'}
                                `}
                           >
                               {updatingStatus && isActive ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> : icon}
                               <span>{status}</span>
                           </button>
                       )
                   })}
               </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 bg-surface-variant/20 dark:bg-black/20 pb-safe">
              {detailLoading ? (
                 <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                 </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className={`p-4 rounded-2xl flex items-center gap-3 border ${selectedRegistration.is_patient_created ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-900' : 'bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900'}`}>
                      {selectedRegistration.is_patient_created ? <MdCheckCircle size={24} className="text-emerald-500" /> : <MdError size={24} className="text-amber-500" />}
                      <span className="text-xs font-bold">{selectedRegistration.is_patient_created ? 'Patient Record Synced' : 'No Permanent Record Found'}</span>
                  </div>

                  {/* Photo & Basic Info */}
                  <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-surface dark:bg-gray-800 p-1 shadow-sm border border-outline-variant/10 dark:border-gray-700">
                          <div className="w-full h-full rounded-xl bg-surface-variant dark:bg-gray-600 overflow-hidden flex items-center justify-center text-3xl font-black text-outline/30 uppercase">
                             {selectedRegistration.patient_photo_path ? (
                                <img src={getImageUrl(selectedRegistration.patient_photo_path) || ''} alt="Profile" className="w-full h-full object-cover" />
                             ) : selectedRegistration.patient_name.charAt(0)}
                          </div>
                      </div>
                      <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-on-surface dark:text-gray-300 font-medium">
                              <MdPhone size={16} className="text-primary" />
                              <a href={`tel:${selectedRegistration.phone_number}`} className="hover:underline">{selectedRegistration.phone_number}</a>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-on-surface dark:text-gray-300">
                              <MdPerson size={16} className="text-primary" />
                              <span>{selectedRegistration.age} Yrs, {selectedRegistration.gender}</span>
                          </div>
                          {selectedRegistration.email && (
                              <div className="flex items-center gap-2 text-sm text-on-surface dark:text-gray-300">
                                  <MdPerson size={16} className="text-primary" />
                                  <span className="truncate max-w-[150px]">{selectedRegistration.email}</span>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="bg-surface dark:bg-gray-800 rounded-[24px] p-5 shadow-sm border border-outline-variant/10 dark:border-gray-700 space-y-4">
                      <h3 className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase tracking-widest mb-2 border-b border-outline-variant/10 pb-2">Medical Details</h3>
                      <DetailRow icon={<MdMedicalServices size={18} />} label="Chief Complaint" value={selectedRegistration.chief_complain} />
                      <DetailRow icon={<MdAssignment size={18} />} label="Type" value={selectedRegistration.consultation_type} />
                      <DetailRow icon={<MdPerson size={18} />} label="Referred By" value={selectedRegistration.reffered_by} />
                  </div>

                  <div className="bg-surface dark:bg-gray-800 rounded-[24px] p-5 shadow-sm border border-outline-variant/10 dark:border-gray-700 space-y-4">
                      <h3 className="text-[10px] font-bold text-outline dark:text-gray-500 uppercase tracking-widest mb-2 border-b border-outline-variant/10 pb-2">Payment</h3>
                      <div className="flex justify-between items-end bg-surface-variant/30 dark:bg-gray-700/30 p-4 rounded-xl">
                          <div>
                              <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase mb-1">Total Amount</p>
                              <p className="text-2xl font-black text-on-surface dark:text-white">₹ {selectedRegistration.consultation_amount || '0'}</p>
                          </div>
                          <span className="px-3 py-1 bg-surface dark:bg-gray-600 rounded-md text-xs font-bold text-on-surface dark:text-gray-200 border border-outline-variant/10">
                              {selectedRegistration.payment_method || 'CASH'}
                          </span>
                      </div>
                  </div>

                  {/* Notes & Remarks */}
                  {(selectedRegistration.doctor_notes || selectedRegistration.prescription || selectedRegistration.remarks) && (
                    <div className="space-y-3">
                         {selectedRegistration.doctor_notes && (
                             <div className="bg-surface dark:bg-gray-800 p-5 rounded-[24px] border-l-4 border-primary shadow-sm">
                                 <h4 className="text-[10px] font-bold text-primary uppercase mb-2 flex items-center gap-2">
                                    <MdStickyNote2 /> Doctor Notes
                                 </h4>
                                 <p className="text-sm text-on-surface dark:text-gray-300 leading-relaxed">{selectedRegistration.doctor_notes}</p>
                             </div>
                         )}
                         {selectedRegistration.remarks && (
                             <div className="bg-surface dark:bg-gray-800 p-5 rounded-[24px] border-l-4 border-amber-500 shadow-sm">
                                 <h4 className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase mb-2 flex items-center gap-2">
                                     <MdDescription /> Remarks
                                 </h4>
                                 <p className="text-sm text-on-surface dark:text-gray-300 leading-relaxed">{selectedRegistration.remarks}</p>
                             </div>
                         )}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
       )}

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/registration/new')}
        className="fixed bottom-24 right-5 w-16 h-16 bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center active:scale-90 transition-all z-30 group"
      >
        <MdAdd size={32} className="group-hover:rotate-90 transition-transform" />
      </button>
    </div>
  );
};

export default RegistrationScreen;
