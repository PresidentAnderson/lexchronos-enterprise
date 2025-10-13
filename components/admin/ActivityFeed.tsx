"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  FileText,
  Settings,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityEvent {
  id: string;
  type: 'user' | 'organization' | 'system' | 'billing' | 'security';
  action: string;
  description: string;
  userId?: string;
  userName?: string;
  organizationId?: string;
  organizationName?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'error' | 'pending' | 'warning';
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  isLoading?: boolean;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  maxItems?: number;
  showFilters?: boolean;
  className?: string;
}

const getEventIcon = (type: string, status?: string) => {
  if (status === 'error') return XCircle;
  if (status === 'warning') return AlertTriangle;
  if (status === 'success') return CheckCircle;
  
  switch (type) {
    case 'user':
      return Users;
    case 'organization':
      return FileText;
    case 'system':
      return Settings;
    case 'billing':
      return DollarSign;
    case 'security':
      return AlertTriangle;
    default:
      return Clock;
  }
};

const getEventColor = (severity: string, status?: string): string => {
  if (status === 'error') return 'text-red-600 bg-red-50 border-red-200';
  if (status === 'warning') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (status === 'success') return 'text-green-600 bg-green-50 border-green-200';
  
  switch (severity) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'low':
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
};

const groupEventsByDate = (events: ActivityEvent[]): Record<string, ActivityEvent[]> => {
  const groups: Record<string, ActivityEvent[]> = {};
  
  events.forEach(event => {
    const dateKey = event.timestamp.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
  });
  
  return groups;
};

export function ActivityFeed({
  events,
  isLoading = false,
  onRefresh,
  autoRefresh = false,
  refreshInterval = 30000,
  maxItems = 50,
  showFilters = true,
  className
}: ActivityFeedProps) {
  const [filteredEvents, setFilteredEvents] = useState<ActivityEvent[]>(events);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    let filtered = events;
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === typeFilter);
    }
    
    if (severityFilter !== 'all') {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }
    
    // Sort by timestamp descending and limit
    filtered = filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxItems);
    
    setFilteredEvents(filtered);
  }, [events, typeFilter, severityFilter, maxItems]);

  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(onRefresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, onRefresh, refreshInterval]);

  const groupedEvents = groupEventsByDate(filteredEvents);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-32" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Real-time system activity and events
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRefresh}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {showFilters && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {/* Open filter modal */}}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="user">User</option>
                <option value="organization">Organization</option>
                <option value="system">System</option>
                <option value="billing">Billing</option>
                <option value="security">Security</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activity events found
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {new Date(dateKey).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-3">
                    {dateEvents.map((event) => {
                      const Icon = getEventIcon(event.type, event.status);
                      
                      return (
                        <div key={event.id} className="flex items-start space-x-3">
                          {/* Icon */}
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full border-2",
                            getEventColor(event.severity, event.status)
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                  {event.action}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", getEventColor(event.severity, event.status))}
                                >
                                  {event.severity}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(event.timestamp)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                            
                            {/* Additional metadata */}
                            {(event.userName || event.organizationName) && (
                              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                {event.userName && (
                                  <span>User: {event.userName}</span>
                                )}
                                {event.organizationName && (
                                  <span>Org: {event.organizationName}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {filteredEvents.length >= maxItems && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Showing latest {maxItems} events • {autoRefresh && 'Auto-refreshing'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mock data generator for development
export function generateMockActivityEvents(count: number = 20): ActivityEvent[] {
  const types: ActivityEvent['type'][] = ['user', 'organization', 'system', 'billing', 'security'];
  const severities: ActivityEvent['severity'][] = ['low', 'medium', 'high', 'critical'];
  const statuses: ActivityEvent['status'][] = ['success', 'error', 'pending', 'warning'];
  
  const actions = {
    user: ['User Created', 'User Updated', 'User Deleted', 'Password Changed', 'Login Failed'],
    organization: ['Organization Created', 'Subscription Updated', 'Plan Changed', 'Usage Limit Reached'],
    system: ['System Backup', 'Database Migration', 'Service Restart', 'Update Deployed'],
    billing: ['Payment Processed', 'Invoice Generated', 'Payment Failed', 'Refund Issued'],
    security: ['Suspicious Login', 'Permission Denied', 'Rate Limit Exceeded', 'MFA Enabled']
  };

  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const action = actions[type][Math.floor(Math.random() * actions[type].length)];
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    return {
      id: `event-${i}`,
      type,
      action,
      description: `${action} for ${type === 'user' ? 'user@example.com' : 'Example Org'}`,
      userId: type === 'user' ? `user-${i}` : undefined,
      userName: type === 'user' ? `User ${i}` : undefined,
      organizationId: type === 'organization' ? `org-${i}` : undefined,
      organizationName: type === 'organization' ? `Organization ${i}` : undefined,
      timestamp,
      severity: severities[Math.floor(Math.random() * severities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      metadata: {}
    };
  });
}