import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { PresenceData, UserData } from '@/lib/socket';

export const usePresence = () => {
  const socket = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceData & { userData: UserData }>>(new Map());
  const [myStatus, setMyStatus] = useState<PresenceData['status']>('online');

  useEffect(() => {
    if (!socket) return;

    // Listen for user online status
    socket.on('user:online', (data: { userId: string; userData: UserData }) => {
      setOnlineUsers(prev => new Map(prev.set(data.userId, {
        userId: data.userId,
        status: 'online',
        userData: data.userData
      })));
    });

    // Listen for user offline status
    socket.on('user:offline', (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
    });

    // Listen for presence updates
    socket.on('presence:user_updated', (data: {
      userId: string;
      status: PresenceData['status'];
      activity?: string;
    }) => {
      setOnlineUsers(prev => {
        const user = prev.get(data.userId);
        if (user) {
          return new Map(prev.set(data.userId, {
            ...user,
            status: data.status,
            activity: data.activity
          }));
        }
        return prev;
      });
    });

    // Handle visibility change to update presence
    const handleVisibilityChange = () => {
      const newStatus = document.hidden ? 'away' : 'online';
      updateStatus(newStatus);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle window focus/blur
    const handleFocus = () => updateStatus('online');
    const handleBlur = () => updateStatus('away');

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('presence:user_updated');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [socket]);

  const updateStatus = useCallback((status: PresenceData['status'], activity?: string) => {
    if (socket) {
      setMyStatus(status);
      socket.emit('presence:update', {
        status,
        activity
      });
    }
  }, [socket]);

  const getUserStatus = useCallback((userId: string): PresenceData['status'] => {
    return onlineUsers.get(userId)?.status || 'offline';
  }, [onlineUsers]);

  const getUserActivity = useCallback((userId: string): string | undefined => {
    return onlineUsers.get(userId)?.activity;
  }, [onlineUsers]);

  const isUserOnline = useCallback((userId: string): boolean => {
    const status = getUserStatus(userId);
    return status === 'online' || status === 'busy';
  }, [getUserStatus]);

  const getOnlineUserCount = useCallback((): number => {
    return Array.from(onlineUsers.values()).filter(user => 
      user.status === 'online' || user.status === 'busy'
    ).length;
  }, [onlineUsers]);

  const getOnlineUsers = useCallback(() => {
    return Array.from(onlineUsers.values())
      .filter(user => user.status !== 'offline')
      .sort((a, b) => {
        // Sort by status priority: online > busy > away > offline
        const statusPriority = { online: 4, busy: 3, away: 2, offline: 1 };
        return statusPriority[b.status] - statusPriority[a.status];
      });
  }, [onlineUsers]);

  return {
    onlineUsers: Array.from(onlineUsers.values()),
    myStatus,
    updateStatus,
    getUserStatus,
    getUserActivity,
    isUserOnline,
    getOnlineUserCount,
    getOnlineUsers
  };
};