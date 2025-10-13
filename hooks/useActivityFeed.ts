import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { Activity } from '@/lib/socket';

export interface ActivityFeedItem extends Activity {
  icon?: string;
  color?: string;
  actionUrl?: string;
}

export const useActivityFeed = (caseId?: string) => {
  const socket = useSocket();
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!socket) return;

    // Listen for new activities
    socket.on('activity:new', (activity: ActivityFeedItem) => {
      // Only add if it matches our filter (if any)
      if (!caseId || activity.caseId === caseId) {
        setActivities(prev => [activity, ...prev]);
      }
    });

    // Listen for activity updates
    socket.on('activity:updated', (updatedActivity: ActivityFeedItem) => {
      setActivities(prev =>
        prev.map(activity =>
          activity.id === updatedActivity.id ? updatedActivity : activity
        )
      );
    });

    // Listen for activity deletions
    socket.on('activity:deleted', (activityId: string) => {
      setActivities(prev => prev.filter(activity => activity.id !== activityId));
    });

    // Request initial activities
    if (caseId) {
      socket.emit('activity:get_case_feed', caseId);
    } else {
      socket.emit('activity:get_global_feed', { limit: 50 });
    }

    // Listen for activity feed response
    socket.on('activity:feed', (data: { activities: ActivityFeedItem[]; hasMore: boolean }) => {
      setActivities(data.activities);
      setHasMore(data.hasMore);
      setIsLoading(false);
    });

    return () => {
      socket.off('activity:new');
      socket.off('activity:updated');
      socket.off('activity:deleted');
      socket.off('activity:feed');
    };
  }, [socket, caseId]);

  const loadMore = useCallback(() => {
    if (socket && hasMore && !isLoading) {
      setIsLoading(true);
      const lastActivity = activities[activities.length - 1];
      
      if (caseId) {
        socket.emit('activity:get_case_feed', caseId, {
          before: lastActivity?.timestamp,
          limit: 20
        });
      } else {
        socket.emit('activity:get_global_feed', {
          before: lastActivity?.timestamp,
          limit: 20
        });
      }
    }
  }, [socket, hasMore, isLoading, activities, caseId]);

  const markAsRead = useCallback((activityId: string) => {
    if (socket) {
      socket.emit('activity:mark_read', activityId);
      setActivities(prev =>
        prev.map(activity =>
          activity.id === activityId 
            ? { ...activity, read: true, readAt: new Date().toISOString() }
            : activity
        )
      );
    }
  }, [socket]);

  const markAllAsRead = useCallback(() => {
    if (socket) {
      const unreadIds = activities.filter(a => !a.read).map(a => a.id);
      socket.emit('activity:mark_all_read', { ids: unreadIds, caseId });
      setActivities(prev =>
        prev.map(activity => ({
          ...activity,
          read: true,
          readAt: activity.read ? activity.readAt : new Date().toISOString()
        }))
      );
    }
  }, [socket, activities, caseId]);

  // Helper functions for activity formatting
  const getActivityIcon = useCallback((activity: ActivityFeedItem): string => {
    if (activity.icon) return activity.icon;
    
    switch (activity.type) {
      case 'case_update': return '📋';
      case 'document_edit': return '📄';
      case 'timeline_event': return '📅';
      case 'chat_message': return '💬';
      case 'deadline_reminder': return '⏰';
      case 'user_joined': return '👤';
      case 'file_upload': return '📎';
      case 'payment_received': return '💰';
      case 'court_filing': return '⚖️';
      default: return '📢';
    }
  }, []);

  const getActivityColor = useCallback((activity: ActivityFeedItem): string => {
    if (activity.color) return activity.color;
    
    switch (activity.type) {
      case 'deadline_reminder': return 'red';
      case 'payment_received': return 'green';
      case 'case_update': return 'blue';
      case 'document_edit': return 'purple';
      case 'timeline_event': return 'orange';
      case 'chat_message': return 'gray';
      default: return 'blue';
    }
  }, []);

  const getActivityDescription = useCallback((activity: ActivityFeedItem): string => {
    switch (activity.type) {
      case 'case_update':
        return `updated ${activity.field} in case`;
      case 'document_edit':
        return `edited document "${activity.documentName || 'Untitled'}"`;
      case 'timeline_event':
        return `added timeline event "${activity.event?.title || 'Untitled'}"`;
      case 'chat_message':
        return `sent a message in chat`;
      case 'deadline_reminder':
        return `deadline approaching: ${activity.title}`;
      case 'user_joined':
        return `joined the case`;
      case 'file_upload':
        return `uploaded file "${activity.fileName || 'Unknown'}"`;
      case 'payment_received':
        return `payment of $${activity.amount || '0.00'} received`;
      case 'court_filing':
        return `filed document with court`;
      default:
        return activity.message || 'performed an action';
    }
  }, []);

  const formatActivity = useCallback((activity: ActivityFeedItem) => ({
    ...activity,
    icon: getActivityIcon(activity),
    color: getActivityColor(activity),
    description: getActivityDescription(activity),
    timeAgo: formatTimeAgo(new Date(activity.timestamp))
  }), [getActivityIcon, getActivityColor, getActivityDescription]);

  const formattedActivities = activities.map(formatActivity);
  const unreadCount = activities.filter(a => !a.read).length;

  return {
    activities: formattedActivities,
    isLoading,
    hasMore,
    unreadCount,
    loadMore,
    markAsRead,
    markAllAsRead
  };
};

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}