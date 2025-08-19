import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { NotificationData } from '@/lib/socket';

export const useNotifications = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    // Listen for deadline notifications
    socket.on('notification:deadline', (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      }
    });

    // Listen for general notifications
    socket.on('notification:new', (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      socket.off('notification:deadline');
      socket.off('notification:new');
    };
  }, [socket]);

  const markAsRead = useCallback((notificationId: string) => {
    if (socket) {
      socket.emit('notification:mark_read', notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [socket]);

  const markAllAsRead = useCallback(() => {
    notifications
      .filter(n => !n.read)
      .forEach(n => markAsRead(n.id));
  }, [notifications, markAsRead]);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestPermission
  };
};