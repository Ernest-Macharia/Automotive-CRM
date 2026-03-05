'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { notificationsService, NotificationEntity } from '@/services/notificationsService';

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationEntity[]>([]);

  const unreadCount = useMemo(() => items.filter(item => !item.read).length, [items]);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getMine();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (id?: string) => {
    if (!id) return;
    try {
      await notificationsService.markAsRead(id);
      setItems(prev => prev.map(item => ((item._id || item.id) === id ? { ...item, read: true } : item)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showToast('Failed to update notification', 'error');
    }
  };

  const markAllRead = async () => {
    const unread = items.filter(item => !item.read);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(item => markRead(item._id || item.id)));
      showToast('Marked all notifications as read', 'success');
    } catch {
      // Individual failures are handled by markRead
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadNotifications}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading notifications...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map(item => {
              const id = item._id || item.id;
              return (
                <div key={id} className={`p-4 ${item.read ? 'bg-white' : 'bg-blue-50/40'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.title || 'Notification'}</p>
                      <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                    {!item.read && (
                      <button
                        onClick={() => markRead(id)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
