import React, { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '../firebase/firebase.js';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function NotificationPanel() {
  const { user, getIdToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Real-time listener for current user's notifications
  useEffect(() => {
    // Only subscribe if user has a valid Firebase UID
    const firebaseUid = user?.firebaseUid || user?.id;

    if (!firebaseUid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const userNotifsRef = ref(rtdb, `notifications/${firebaseUid}`);

      const unsubscribe = onValue(
        userNotifsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            // Convert Firebase object to array sorted newest first
            const list = Object.entries(data).map(([id, notif]) => ({
              id,
              ...notif,
            }));
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setNotifications(list);
          } else {
            setNotifications([]);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Realtime notifications listener warning:', error.message);
          setLoading(false);
        }
      );

      return () => {
        // Cleanup real-time listener on unmount or user change
        off(userNotifsRef);
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (err) {
      console.warn('Could not establish real-time database listener:', err.message);
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read via authenticated backend API
  const handleMarkAsRead = async (notifId) => {
    try {
      setUpdatingId(notifId);
      const token = await getIdToken();

      const response = await fetch(`${API_URL}/api/notifications/${notifId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Optimistic local update while Firebase syncs
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
      {/* Header with Live Unread Counter */}
      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
        <h3 className="font-semibold text-gray-800 text-sm">
          Campus Notifications
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            unreadCount > 0
              ? 'bg-blue-100 text-blue-700 font-semibold'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {unreadCount} unread
        </span>
      </div>

      {loading ? (
        <div className="text-center py-4 text-xs text-gray-400">
          Syncing notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-500">
          No notifications yet. You will receive real-time updates when new campus events are published!
        </div>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {notifications.map((item) => (
            <li
              key={item.id}
              className={`p-3 rounded-md text-sm border transition-colors ${
                item.read
                  ? 'bg-gray-50 border-gray-200 text-gray-600'
                  : 'bg-blue-50 border-blue-200 text-gray-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-sm text-gray-900">
                  {item.title}
                </span>
                {!item.read && (
                  <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1.5" title="Unread" />
                )}
              </div>

              <p className="text-xs text-gray-700 mb-2 leading-relaxed">
                {item.message}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100/60">
                <span>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) +
                      ' • ' +
                      new Date(item.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Just now'}
                </span>

                {!item.read && (
                  <button
                    type="button"
                    disabled={updatingId === item.id}
                    onClick={() => handleMarkAsRead(item.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline disabled:opacity-50"
                  >
                    {updatingId === item.id ? 'Updating...' : 'Mark as read'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
