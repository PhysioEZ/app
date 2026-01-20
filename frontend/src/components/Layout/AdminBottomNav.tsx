import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageCircle, BookOpen, Menu } from 'lucide-react';

const AdminBottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/40 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 pb-safe z-50 transition-colors duration-200 block md:hidden">
      <div className="flex justify-around items-center h-20">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
              isActive ? 'text-teal-600 dark:text-teal-400 scale-110' : 'text-gray-400 dark:text-gray-600'
            }`
          }
        >
          <LayoutDashboard size={24} strokeWidth={2} />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>

        <NavLink
          to="/admin/chat"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
              isActive ? 'text-teal-600 dark:text-teal-400 scale-110' : 'text-gray-400 dark:text-gray-600'
            }`
          }
        >
          <MessageCircle size={24} strokeWidth={2} />
          <span className="text-[10px] font-medium">Chat</span>
        </NavLink>

        <NavLink
          to="/admin/ledger"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
              isActive ? 'text-teal-600 dark:text-teal-400 scale-110' : 'text-gray-400 dark:text-gray-600'
            }`
          }
        >
          <BookOpen size={24} strokeWidth={2} />
          <span className="text-[10px] font-medium">Ledger</span>
        </NavLink>

        <NavLink
          to="/admin/menu"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
              isActive ? 'text-teal-600 dark:text-teal-400 scale-110' : 'text-gray-400 dark:text-gray-600'
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

export default AdminBottomNav;
