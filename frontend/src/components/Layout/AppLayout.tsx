import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import BottomNav from './BottomNav';
import { useTheme } from '../../hooks';

export const AppLayout = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  useTheme(); // Initialize theme

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex-1 overflow-y-auto relative scroller pb-safe">
        <Outlet />
      </div>
      {!location.pathname.startsWith('/chat/') && <BottomNav />}
    </div>
  );
};

export default AppLayout;
