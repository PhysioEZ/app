import * as React from 'react';
import { useEffect, useState } from 'react';
import { 
  MdArrowBack, MdPerson, MdPhone, MdLocationOn, MdCalendarToday, 
  MdEmail, MdShield, MdBusiness, MdVerified
} from 'react-icons/md';

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
const ADMIN_URL = 'https://prospine.in/admin';

interface ProfileData {
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  job_title: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  date_of_joining: string;
  email: string;
  role: string;
  is_active: number;
  photo_path: string;
  branch_name: string;
  clinic_name: string;
  branch_phone: string;
  branch_email: string;
  address_line_1: string;
  city: string;
}

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const empId = user?.id || 1; 
        const response = await fetch(`${API_URL}/profile.php?employee_id=${empId}`);
        const json = await response.json();
        if (json.status === 'success') {
          setProfile(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface dark:bg-black">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col h-full bg-surface dark:bg-black font-sans transition-colors relative">
      {/* Primary Gradient Mesh */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/30 to-transparent pointer-events-none z-0 dark:from-primary/10" />

      {/* Header */}
      <div className="bg-transparent backdrop-blur-xl sticky top-0 z-20 pt-[max(env(safe-area-inset-top),32px)] transition-colors border-b border-outline-variant/5">
        <div className="px-5 py-3 mb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-variant/40 text-on-surface dark:text-white transition-colors">
              <MdArrowBack size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight">My Profile</h1>
              <p className="text-xs font-medium text-outline/80 dark:text-gray-400">Personal Information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-5 no-scrollbar relative z-10">
        
        {/* Profile Hero Card */}
        <div className="bg-white dark:bg-gray-900 rounded-[32px] p-6 text-center shadow-lg border border-outline-variant/10 dark:border-gray-800 relative overflow-hidden animate-slide-up">
          {/* Decorative Gradients */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-secondary/10 blur-2xl"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-28 h-28 rounded-[2rem] border-4 border-surface dark:border-black bg-surface-variant shadow-xl mb-4 overflow-hidden flex items-center justify-center relative">
              {profile.photo_path ? (
                <img src={`${ADMIN_URL}/${profile.photo_path}`} alt="Profile" className="w-full h-full object-cover" />
              ) : ( 
                <span className="text-5xl font-black text-primary">{profile.full_name?.charAt(0) || 'U'}</span>
              )}
            </div>
            
            <h2 className="text-2xl font-black font-poppins text-on-surface dark:text-white mb-1">{profile.full_name}</h2>
            <p className="text-sm font-bold text-outline dark:text-gray-400 capitalize mb-3">{profile.job_title || profile.role}</p>
            
            <div className="flex gap-2">
              <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                profile.is_active 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                <MdVerified size={12} />
                {profile.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 text-[10px] font-black text-primary uppercase tracking-wider">
                ID: {profile.employee_id}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white dark:bg-gray-900 rounded-[24px] p-5 shadow-sm border border-outline-variant/10 dark:border-gray-800 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <h3 className="text-sm font-bold text-on-surface dark:text-white mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <MdPerson size={16} className="text-primary" />
            </div>
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <MdPhone size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Phone Number</p>
                <a href={`tel:${profile.phone_number}`} className="text-sm font-bold text-green-600 dark:text-green-400 hover:underline">{profile.phone_number}</a>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <MdEmail size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-bold text-on-surface dark:text-white truncate">{profile.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <MdLocationOn size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Address</p>
                <p className="text-sm font-bold text-on-surface dark:text-white leading-tight">{profile.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Details Card */}
        <div className="bg-white dark:bg-gray-900 rounded-[24px] p-5 shadow-sm border border-outline-variant/10 dark:border-gray-800 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-sm font-bold text-on-surface dark:text-white mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-secondary/10 dark:bg-secondary/20 rounded-lg">
              <MdCalendarToday size={16} className="text-secondary" />
            </div>
            Personal Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1.5">
                <MdCalendarToday size={14} className="text-outline dark:text-gray-500" />
                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Date of Birth</p>
              </div>
              <p className="text-sm font-bold text-on-surface dark:text-white">{profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-IN') : 'N/A'}</p>
            </div>

            <div className="p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1.5">
                <MdCalendarToday size={14} className="text-outline dark:text-gray-500" />
                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Joined On</p>
              </div>
              <p className="text-sm font-bold text-on-surface dark:text-white">{profile.date_of_joining ? new Date(profile.date_of_joining).toLocaleDateString('en-IN') : 'N/A'}</p>
            </div>

            <div className="p-3 bg-surface-variant/30 dark:bg-gray-800/50 rounded-2xl border border-outline-variant/10 dark:border-gray-700 col-span-2">
              <div className="flex items-center gap-2 mb-1.5">
                <MdShield size={14} className="text-outline dark:text-gray-500" />
                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Role</p>
              </div>
              <p className="text-sm font-bold text-on-surface dark:text-white capitalize">{profile.role}</p>
            </div>
          </div>
        </div>

        {/* Branch Information Card */}
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 rounded-[24px] p-5 shadow-sm border border-primary/20 dark:border-primary/30 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <h3 className="text-sm font-bold text-on-surface dark:text-white mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-primary/20 dark:bg-primary/30 rounded-lg">
              <MdBusiness size={16} className="text-primary" />
            </div>
            Branch Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-900/60 rounded-2xl backdrop-blur-sm border border-white/50 dark:border-gray-800">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                <MdBusiness size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Clinic Name</p>
                <p className="text-sm font-bold text-on-surface dark:text-white">{profile.clinic_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-900/60 rounded-2xl backdrop-blur-sm border border-white/50 dark:border-gray-800">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center shrink-0">
                <MdLocationOn size={18} className="text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Branch Location</p>
                <p className="text-sm font-bold text-on-surface dark:text-white leading-tight">{profile.branch_name} - {profile.address_line_1}, {profile.city}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
