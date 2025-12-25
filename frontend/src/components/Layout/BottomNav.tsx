import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Menu, MessageCircle } from 'lucide-react';

const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe z-50 transition-colors duration-200">
      <div className="flex justify-around items-center h-16">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`
          }
        >
          <LayoutDashboard size={24} strokeWidth={2} />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>

        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`
          }
        >
          <MessageCircle size={24} strokeWidth={2} />
          <span className="text-[10px] font-medium">Chat</span>
        </NavLink>

        <NavLink
          to="/appointments"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`
          }
        >
          <CalendarDays size={24} strokeWidth={2} />
          <span className="text-[10px] font-medium">Schedule</span>
        </NavLink>

        <NavLink
          to="/patients"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`
          }
        >
          <Users size={24} strokeWidth={2} />
          <span className="text-[10px] font-medium">Patients</span>
        </NavLink>

        <NavLink
          to="/menu"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`
          }
        >
          <Menu size={24} strokeWidth={2} />
          <span className="text-[10px] font-medium">Menu</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
