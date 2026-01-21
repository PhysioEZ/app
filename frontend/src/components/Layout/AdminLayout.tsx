import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../hooks';
import AdminBottomNav from './AdminBottomNav';

export const AdminLayout = () => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  useTheme(); // Initialize theme

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Strict Role Check
  if (user?.role !== 'admin' && user?.role !== 'superadmin' && user?.role !== 'developer') {
      return <Navigate to="/dashboard" replace />;
  }

  // Only hide dock on specific chat conversations (e.g. /admin/chat/123), NOT on the list (/admin/chat)
  // Also hide dock on profile screen for immersive feel
  const hideDock = location.pathname.startsWith('/admin/chat/') || 
                   location.pathname.startsWith('/dev/chat/') ||
                   location.pathname === '/dev/profile' ||
                   location.pathname === '/admin/profile';

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black transition-colors duration-500">
      <div className={`flex-1 overflow-y-auto relative w-full h-full ${hideDock ? 'pb-0' : 'pb-24'} md:pb-0 no-scrollbar`}>
        <Outlet />
      </div>
      {!hideDock && <AdminBottomNav />}
    </div>
  );
};

export default AdminLayout;
