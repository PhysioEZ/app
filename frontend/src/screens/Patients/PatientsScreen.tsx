import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, Activity, Users } from 'lucide-react';
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

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900 transition-colors duration-200">
      {/* Modern Glassy Header */}
      <header className="sticky top-0 z-20 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-6 py-4 pt-11 mb-2">
        <div className="flex items-center justify-between mb-4">
             <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Patients</h1>
             {/* Placeholder for Add Action if needed */}
             <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800/50"></div> 
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border-none rounded-2xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 sm:text-sm shadow-sm transition-all"
          />
        </div>
      </header>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 pb-32 no-scrollbar">
        
        {/* Stats Hero Card */}
        {stats && (
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                 {/* Decorative */}
                 <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/10 blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 rounded-full bg-black/10 blur-2xl"></div>

                 <div className="flex justify-between items-center mb-6 relative z-10">
                     <div className="flex items-center gap-2">
                         <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Users size={18} className="text-indigo-100" />
                         </div>
                         <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-100">Overview</h3>
                     </div>
                     <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold border border-white/10">
                         {stats.total} Total
                     </span>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-4 text-center relative z-10">
                     <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
                         <p className="text-xl font-black">{stats.active}</p>
                         <p className="text-[10px] font-bold text-indigo-200 uppercase mt-0.5">Active</p>
                     </div>
                     <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
                         <p className="text-xl font-black text-amber-300">{stats.inactive}</p>
                         <p className="text-[10px] font-bold text-indigo-200 uppercase mt-0.5">Inactive</p>
                     </div>
                     <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
                         <p className="text-xl font-black text-emerald-300">{stats.completed}</p>
                         <p className="text-[10px] font-bold text-indigo-200 uppercase mt-0.5">Done</p>
                     </div>
                 </div>
            </div>
        )}

        {/* Patients List */}
        <div className="space-y-3">
            {patients.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                <Users size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No patients found</p>
              </div>
            ) : (
              patients.map((patient) => (
                <div 
                    key={patient.patient_id} 
                    onClick={() => navigate(`/patients/${patient.patient_id}`)}
                    className="group bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex items-center justify-between active:scale-[0.98] transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black uppercase shadow-sm
                      ${patient.gender === 'Female' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}
                    `}>
                      {patient.patient_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate text-base">{patient.patient_name}</h3>
                          {patient.due_amount > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 ml-2 whitespace-nowrap">
                                 {formatCurrency(patient.due_amount)}
                              </span>
                          )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                           <Activity size={12} className="text-teal-500" /> {patient.treatment_type}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                            patient.status === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 
                            patient.status === 'completed' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : 'bg-gray-50 text-gray-500'
                        }`}>
                            {patient.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 transition-colors">
                      <ChevronRight size={18} />
                  </div>
                </div>
              ))
            )}
        </div>

        {/* Load More */}
        {hasMore && patients.length > 0 && (
          <button 
            onClick={() => fetchPatients(false)}
            disabled={loading}
            className="w-full py-4 rounded-xl text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-50 transition-colors"
          >
            {loading ? (
                <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                </div>
            ) : 'Load More Patients'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PatientsScreen;
