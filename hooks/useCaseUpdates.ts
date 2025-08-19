import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { CaseUpdate, Activity } from '@/lib/socket';

export const useCaseUpdates = (caseId: string) => {
  const socket = useSocket();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket || !caseId) return;

    // Join case room
    socket.emit('case:join', caseId);
    setIsConnected(true);

    // Listen for case activities
    socket.on('case:activities', (caseActivities: Activity[]) => {
      setActivities(caseActivities);
    });

    // Listen for real-time updates
    socket.on('case:updated', (update: CaseUpdate) => {
      setActivities(prev => [...prev, update.activity]);
    });

    return () => {
      socket.emit('case:leave', caseId);
      socket.off('case:activities');
      socket.off('case:updated');
      setIsConnected(false);
    };
  }, [socket, caseId]);

  const updateCase = useCallback((field: string, update: any) => {
    if (socket && caseId) {
      socket.emit('case:update', {
        caseId,
        field,
        update
      });
    }
  }, [socket, caseId]);

  return {
    activities,
    updateCase,
    isConnected
  };
};