import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { TimelineEvent } from '@/lib/socket';

export const useTimeline = (caseId: string) => {
  const socket = useSocket();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket || !caseId) return;

    // Join timeline room
    socket.emit('timeline:join', caseId);
    setIsConnected(true);

    // Listen for new timeline events
    socket.on('timeline:event_added', (event: TimelineEvent) => {
      setEvents(prev => {
        // Insert event in chronological order
        const newEvents = [...prev, event];
        return newEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });
    });

    // Listen for event updates
    socket.on('timeline:event_updated', (updatedEvent: TimelineEvent) => {
      setEvents(prev =>
        prev.map(event =>
          event.id === updatedEvent.id ? updatedEvent : event
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
    });

    // Listen for event deletions
    socket.on('timeline:event_deleted', (eventId: string) => {
      setEvents(prev => prev.filter(event => event.id !== eventId));
    });

    return () => {
      socket.off('timeline:event_added');
      socket.off('timeline:event_updated');
      socket.off('timeline:event_deleted');
      setIsConnected(false);
    };
  }, [socket, caseId]);

  const addEvent = useCallback((event: Omit<TimelineEvent, 'id' | 'userId' | 'userName' | 'timestamp'>) => {
    if (socket && caseId) {
      socket.emit('timeline:add_event', {
        caseId,
        event
      });
    }
  }, [socket, caseId]);

  const updateEvent = useCallback((eventId: string, updates: Partial<TimelineEvent>) => {
    if (socket && caseId) {
      socket.emit('timeline:update_event', {
        caseId,
        eventId,
        updates
      });
    }
  }, [socket, caseId]);

  const deleteEvent = useCallback((eventId: string) => {
    if (socket && caseId) {
      socket.emit('timeline:delete_event', {
        caseId,
        eventId
      });
    }
  }, [socket, caseId]);

  // Helper function to get upcoming events
  const getUpcomingEvents = useCallback((days: number = 7) => {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= future;
    });
  }, [events]);

  // Helper function to get overdue events
  const getOverdueEvents = useCallback(() => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate < now;
    });
  }, [events]);

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    getUpcomingEvents,
    getOverdueEvents,
    isConnected
  };
};