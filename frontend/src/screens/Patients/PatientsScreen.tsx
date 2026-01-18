import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { 
    MdSearch, 
    MdChevronRight, 
    MdMonitorHeart, 
    MdPeople,
    MdPhone,
    MdWarning
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

interface Patient {
  patient_id: string;
  patient_name: string;
  phone_number: string;
  age: number;
  gender: string;
  treatment_type: string;
  status: string;
  total_amount: number;
  due_amount: number;
}

interface PatientStats {
  total: number;
  active: number;
  completed: number;
  inactive: number;
}

const PatientsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Debounce ref
  const timeoutRef = useRef<number | null>(null);

  const fetchPatients = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    
    try {
      const currentPage = reset ? 1 : page;
      const branchId = user?.branch_id || 1;
      const employeeId = user?.employee_id || '';
      const query = new URLSearchParams({
        branch_id: branchId.toString(),
        employee_id: employeeId.toString(),
        page: currentPage.toString(),
        search: search
      });

      const res = await fetch(`${API_URL}/patients.php?${query.toString()}`);
      const json = await res.json();
      
      if (json.status === 'success') {
        if (reset) {
          setPatients(json.data);
        } else {
          setPatients(prev => [...prev, ...json.data]);
        }
        
        // Update stats if available (and usually on first load or search reset)
        if (json.stats) {
            setStats(json.stats);
        }
        
        setHasMore(json.data.length === 20);
        if (!reset) setPage(prev => prev + 1);
        else setPage(2);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Search Effect
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = window.setTimeout(() => {
      fetchPatients(true);
    }, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [search]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
      switch(status?.toLowerCase()) {
          case 'active': return 'bg-green-500';
          case 'completed': return 'bg-blue-500';
          case 'inactive': return 'bg-gray-400';
          default: return 'bg-gray-400';
      }
  };

  return (
    <div className="flex flex-col h-full bg-surface dark:bg-gray-950 transition-colors duration-200 font-sans relative">
      
      {/* Primary Gradient Background Mesh */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent pointer-events-none z-0 dark:from-primary/10" />

      {/* --- Sticky Header Area --- */}
      <div className="sticky top-0 z-30 bg-transparent backdrop-blur-xl transition-colors">
          <header className="px-5 py-3 pt-11 flex items-center justify-between">
            <div>
                 <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight">Patients</h1>
                 <p className="text-xs text-outline dark:text-gray-400 font-medium">Directory & Records</p>
            </div>
          </header>

          {/* Search Bar */}
          <div className="px-5 pb-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MdSearch className="h-5 w-5 text-outline group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 rounded-[16px] bg-surface-variant/40 dark:bg-gray-900 border-none text-on-surface dark:text-white placeholder-outline/60 focus:ring-2 focus:ring-primary/50 focus:bg-surface-variant/60 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Filter Chips / Stats Row */}
          {stats && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-3 snap-x">
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-variant/50 dark:bg-gray-800 border border-outline-variant/10 whitespace-nowrap snap-start shrink-0">
                   <MdPeople size={14} className="text-outline" />
                   <span className="text-xs font-bold text-on-surface dark:text-white">{stats.total}</span>
                   <span className="text-[10px] font-bold uppercase text-outline">Total</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 whitespace-nowrap snap-start shrink-0">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="text-xs font-bold text-green-700 dark:text-green-300">{stats.active}</span>
                   <span className="text-[10px] font-bold uppercase text-green-600/70 dark:text-green-400/60">Active</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 whitespace-nowrap snap-start shrink-0">
                   <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                   <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{stats.completed}</span>
                   <span className="text-[10px] font-bold uppercase text-blue-600/70 dark:text-blue-400/60">Done</span>
               </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 whitespace-nowrap snap-start shrink-0">
                   <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                   <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{stats.inactive}</span>
                   <span className="text-[10px] font-bold uppercase text-gray-500">Inactive</span>
               </div>
            </div>
          )}
      </div>

      {/* --- Main List Content --- */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 space-y-3 pb-32 no-scrollbar">
        {patients.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <MdPeople size={48} className="text-outline/40 mb-4" />
            <p className="text-outline font-medium">No patients found</p>
          </div>
        ) : (
          patients.map((patient, i) => (
            <div 
                key={patient.patient_id} 
                onClick={() => navigate(`/patients/${patient.patient_id}`)}
                className="group relative bg-white dark:bg-gray-900 p-4 rounded-[22px] border border-outline-variant/10 dark:border-gray-800 shadow-sm active:scale-[0.98] transition-all duration-200 animate-slide-up hover:shadow-md"
                style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg font-bold shadow-sm relative
                  ${patient.gender === 'Female' 
                      ? 'bg-gradient-to-br from-pink-100 to-rose-50 text-pink-600 dark:from-pink-900/30 dark:to-pink-800/20 dark:text-pink-300' 
                      : 'bg-gradient-to-br from-blue-100 to-indigo-50 text-blue-600 dark:from-blue-900/30 dark:to-blue-800/20 dark:text-blue-300'}
                `}>
                  {patient.patient_name.charAt(0)}
                  {/* Status Dot */}
                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-[3px] border-white dark:border-gray-900 rounded-full ${getStatusColor(patient.status)}`}></div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-on-surface dark:text-white truncate text-[15px] leading-tight">
                            {patient.patient_name}
                        </h3>
                        <MdChevronRight size={20} className="text-outline/40 -mr-1" />
                    </div>
                    
                    <p className="text-xs text-outline dark:text-gray-400 mt-1 flex items-center gap-1.5">
                        <span className="font-medium bg-surface-variant/50 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                            {patient.gender || '-'}, {patient.age || '-'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-outline/40"></span>
                        <MdMonitorHeart size={12} className="text-primary" />
                        <span className="truncate">{patient.treatment_type || 'General'}</span>
                    </p>

                    {/* Footer / Highlights */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/10 dark:border-gray-800/60">
                         {patient.phone_number ? (
                             <div className="flex items-center gap-1 text-xs font-semibold text-secondary dark:text-teal-400">
                                 <MdPhone size={12} />
                                 {patient.phone_number}
                             </div>
                         ) : <div></div>}
                         
                         {patient.due_amount > 0 && (
                            <div className="flex items-center gap-1 bg-error-container/40 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                                <MdWarning size={12} className="text-error" />
                                <span className="text-[10px] font-bold text-error dark:text-red-300">
                                    Due: {formatCurrency(patient.due_amount)}
                                </span>
                            </div>
                         )}
                    </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Load More Trigger */}
        {hasMore && patients.length > 0 && (
          <button 
            onClick={() => fetchPatients(false)}
            disabled={loading}
            className="w-full py-4 rounded-xl text-primary dark:text-teal-400 font-bold text-xs uppercase tracking-wider hover:bg-primary/5 dark:hover:bg-teal-900/20 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Loading...' : 'Show More'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PatientsScreen;
