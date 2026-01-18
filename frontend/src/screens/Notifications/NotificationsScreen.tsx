import { useState, useEffect } from 'react';
import { 
  MdArrowBack, MdNotifications, MdDelete, MdDoneAll, 
  MdDeleteSweep, MdCircle
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// Types
interface Notification {
  notification_id: number;
  message: string;
  link_url?: string;
  is_read: number | boolean;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

export const NotificationsScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipedId, setSwipedId] = useState<number | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      const branchId = user?.branch_id || 1;
      const employeeId = user?.employee_id || user?.id || '';
      
      const res = await fetch(`${baseUrl}/notifications.php?branch_id=${branchId}&employee_id=${employeeId}`);
      const json = await res.json();
      
      if (json.status === 'success') {
        setNotifications(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      await fetch(`${baseUrl}/notifications.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notification_id: id,
          employee_id: user?.employee_id || user?.id || ''
        })
      });
      
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      await fetch(`${baseUrl}/notifications.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          notification_id: id,
          employee_id: user?.employee_id || user?.id || ''
        })
      });
      
      setNotifications(prev => prev.filter(n => n.notification_id !== id));
      setSwipedId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      await fetch(`${baseUrl}/notifications.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read',
          employee_id: user?.employee_id || user?.id || '',
          branch_id: user?.branch_id || 1
        })
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAll = () => {
    setShowDeleteAllModal(true);
  };

  const confirmDeleteAll = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
      await fetch(`${baseUrl}/notifications.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_all',
          employee_id: user?.employee_id || user?.id || '',
          branch_id: user?.branch_id || 1
        })
      });
      
      setNotifications([]);
      setShowDeleteAllModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getCreatorName = (notif: Notification) => {
    if (notif.first_name || notif.last_name) {
      return `${notif.first_name || ''} ${notif.last_name || ''}`.trim();
    }
    return 'System';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
            <div className="flex-1">
              <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight">Notifications</h1>
              <p className="text-xs font-medium text-outline/80 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <div className="px-5 pb-3 flex gap-2">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary font-bold text-xs uppercase tracking-wider hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdDoneAll size={16} /> Mark All Read
            </button>
            <button
              onClick={deleteAll}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider hover:bg-red-500/20 transition-all"
            >
              <MdDeleteSweep size={16} /> Delete All
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-3 no-scrollbar relative z-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-60">
            <div className="w-20 h-20 bg-surface-variant/30 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <MdNotifications size={40} className="text-outline/50 dark:text-gray-600" />
            </div>
            <p className="text-outline font-medium dark:text-gray-500">No notifications</p>
            <p className="text-xs text-outline/60 dark:text-gray-600 mt-1">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notif, idx) => {
            // Stack animation: each card is slightly offset and scaled
            const stackOffset = Math.min(idx * 2, 8); // Max 8px offset
            const stackScale = 1 - Math.min(idx * 0.02, 0.08); // Max 0.08 scale reduction
            const stackOpacity = 1 - Math.min(idx * 0.1, 0.3); // Max 0.3 opacity reduction
            
            return (
              <div
                key={notif.notification_id}
                className="relative"
                style={{ 
                  animationDelay: `${idx * 30}ms`,
                  transform: `translateY(${stackOffset}px) scale(${stackScale})`,
                  opacity: stackOpacity,
                  zIndex: notifications.length - idx
                }}
              >
                {/* Swipeable Container */}
                <div
                  className={`relative transition-transform duration-300 ${
                    swipedId === notif.notification_id ? '-translate-x-20' : 'translate-x-0'
                  }`}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    const startX = touch.clientX;
                    
                    const handleTouchMove = (moveEvent: TouchEvent) => {
                      const currentX = moveEvent.touches[0].clientX;
                      const diff = startX - currentX;
                      
                      if (diff > 50) {
                        setSwipedId(notif.notification_id);
                        document.removeEventListener('touchmove', handleTouchMove);
                      }
                    };
                    
                    const handleTouchEnd = () => {
                      document.removeEventListener('touchmove', handleTouchMove);
                      document.removeEventListener('touchend', handleTouchEnd);
                    };
                    
                    document.addEventListener('touchmove', handleTouchMove);
                    document.addEventListener('touchend', handleTouchEnd);
                  }}
                  onClick={() => {
                    if (swipedId === notif.notification_id) {
                      setSwipedId(null);
                    } else if (!notif.is_read) {
                      markAsRead(notif.notification_id);
                    }
                    // Removed navigation - clicking does nothing except mark as read
                  }}
                >
                  <div className={`bg-white dark:bg-gray-900 rounded-[24px] p-4 shadow-sm border transition-all cursor-pointer ${
                    notif.is_read 
                      ? 'border-outline-variant/10 dark:border-gray-800 opacity-70' 
                      : 'border-primary/20 dark:border-primary/30 shadow-md'
                  }`}>
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
                        <MdNotifications size={20} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1">
                            <p className="text-xs text-outline dark:text-gray-400 leading-relaxed mb-1">{notif.message}</p>
                            <span className="text-[10px] font-bold text-outline/60 dark:text-gray-500">
                              From: {getCreatorName(notif)}
                            </span>
                          </div>
                          {!notif.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-outline/60 dark:text-gray-500">
                            {new Date(notif.created_at).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {notif.is_read && (
                            <span className="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase flex items-center gap-1">
                              <MdCircle size={6} /> Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete Button (Revealed on Swipe) */}
                {swipedId === notif.notification_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.notification_id);
                    }}
                    className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center text-white rounded-r-[24px] transition-all hover:bg-red-600"
                  >
                    <MdDelete size={24} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
            onClick={() => setShowDeleteAllModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-sm bg-surface dark:bg-gray-900 rounded-[28px] shadow-2xl flex flex-col animate-scale-in overflow-hidden border border-outline-variant/20 dark:border-gray-800">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center mb-4 mx-auto">
                <MdDeleteSweep size={24} className="text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className="text-xl font-bold text-on-surface dark:text-white text-center mb-2">Delete All Notifications?</h3>
              <p className="text-sm text-outline dark:text-gray-400 text-center mb-6">
                This will permanently delete all {notifications.length} notification{notifications.length !== 1 ? 's' : ''}. This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-surface-variant/50 dark:bg-gray-800 text-on-surface dark:text-white font-bold text-sm hover:bg-surface-variant transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAll}
                  className="flex-1 px-4 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsScreen;
