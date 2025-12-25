import * as React from 'react';
import { useEffect, useState } from 'react';
import { User, Phone, MapPin, Calendar, Mail, Shield, Building, ChevronLeft } from 'lucide-react';

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
        // Using hardcoded employee_id=1 for demo if user.id is missing, or strictly user.id if available
        // Ideally we pass the ID from the auth store
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors pb-24 overflow-y-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-6 py-4 pt-[var(--safe-area-inset-top,32px)] mt-0 shadow-sm sticky top-0 z-10 flex items-center gap-3 transition-colors">

        <button onClick={() => navigate(-1)} className="p-1 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Profile</h1>
      </div>

      <div className="p-4 space-y-5">
        
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center text-center transition-colors">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-teal-600 dark:bg-teal-700 text-white flex items-center justify-center font-bold text-3xl uppercase shadow-md overflow-hidden">
                {profile.photo_path ? (
                    <img src={`${ADMIN_URL}/${profile.photo_path}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    profile.full_name?.charAt(0) || 'U'
                )}
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.full_name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{profile.job_title || profile.role}</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-2 ${profile.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800'}`}>
            {profile.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Personal Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <User size={16} className="text-teal-600 dark:text-teal-400" />
                    Personal Information
                </h3>
            </div>
            <div className="p-5 space-y-4">
                <InfoRow icon={<Phone size={14} />} label="Phone" value={profile.phone_number} />
                <InfoRow icon={<MapPin size={14} />} label="Address" value={profile.address} />
                <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={<Calendar size={14} />} label="DOB" value={profile.date_of_birth} />
                    <InfoRow icon={<Calendar size={14} />} label="Joined" value={profile.date_of_joining} />
                </div>
            </div>
        </div>

        {/* Account & Security */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield size={16} className="text-teal-600 dark:text-teal-400" />
                    Account
                </h3>
            </div>
            <div className="p-5 space-y-4">
                <InfoRow icon={<Mail size={14} />} label="Email" value={profile.email} />
                <InfoRow icon={<User size={14} />} label="Role" value={profile.role} className="capitalize" />
            </div>
        </div>

        {/* Branch Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building size={16} className="text-teal-600 dark:text-teal-400" />
                    Branch Details
                </h3>
            </div>
            <div className="p-5 space-y-4">
                <InfoRow icon={<Building size={14} />} label="Clinic" value={profile.clinic_name} />
                <InfoRow icon={<MapPin size={14} />} label="Branch" value={`${profile.branch_name} - ${profile.address_line_1}, ${profile.city}`} />
            </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, className = '' }: { icon: React.ReactNode, label: string, value: string, className?: string }) => (
    <div className="flex items-start gap-3">
        <div className="mt-0.5 text-teal-600 dark:text-teal-400">{icon}</div>
        <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
            <p className={`text-sm font-medium text-gray-900 dark:text-white break-words ${className}`}>{value || 'N/A'}</p>
        </div>
    </div>
);

export default ProfileScreen;
