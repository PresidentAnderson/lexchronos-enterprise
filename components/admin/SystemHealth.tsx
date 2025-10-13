"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Server,
  Database,
  Cloud,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold?: {
    warning: number;
    critical: number;
  };
  description?: string;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number; // percentage
  responseTime: number; // milliseconds
  lastCheck: Date;
  endpoint?: string;
}

interface SystemHealthData {
  overall: 'healthy' | 'warning' | 'critical';
  uptime: number;
  metrics: {
    cpu: SystemMetric;
    memory: SystemMetric;
    disk: SystemMetric;
    database: SystemMetric;
    apiResponseTime: SystemMetric;
    errorRate: SystemMetric;
  };
  services: ServiceStatus[];
  lastUpdated: Date;
}

interface SystemHealthProps {
  data?: SystemHealthData;
  isLoading?: boolean;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

const getStatusColor = (status: 'healthy' | 'warning' | 'critical' | 'online' | 'offline' | 'degraded'): string => {
  switch (status) {
    case 'healthy':
    case 'online':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'warning':
    case 'degraded':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'critical':
    case 'offline':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getStatusIcon = (status: 'healthy' | 'warning' | 'critical' | 'online' | 'offline' | 'degraded') => {
  switch (status) {
    case 'healthy':
    case 'online':
      return CheckCircle;
    case 'warning':
    case 'degraded':
      return AlertTriangle;
    case 'critical':
    case 'offline':
      return XCircle;
    default:
      return Clock;
  }
};

const getMetricIcon = (metricName: string) => {
  switch (metricName) {
    case 'cpu':
      return Cpu;
    case 'memory':
      return MemoryStick;
    case 'disk':
      return HardDrive;
    case 'database':
      return Database;
    case 'apiResponseTime':
      return Activity;
    case 'errorRate':
      return AlertTriangle;
    default:
      return Server;
  }
};

const formatUptime = (uptime: number): string => {
  if (uptime >= 99.9) return `${uptime.toFixed(2)}%`;
  if (uptime >= 99) return `${uptime.toFixed(1)}%`;
  return `${uptime.toFixed(0)}%`;
};

const formatDuration = (hours: number): string => {
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (days > 0) {
    return `${days}d ${remainingHours.toFixed(0)}h`;
  }
  return `${remainingHours.toFixed(1)}h`;
};

// Mock data for demonstration
const mockSystemHealth: SystemHealthData = {
  overall: 'healthy',
  uptime: 99.97,
  metrics: {
    cpu: {
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      status: 'healthy',
      threshold: { warning: 70, critical: 90 },
      description: 'Current CPU utilization'
    },
    memory: {
      name: 'Memory Usage',
      value: 62,
      unit: '%',
      status: 'healthy',
      threshold: { warning: 80, critical: 95 },
      description: 'RAM utilization'
    },
    disk: {
      name: 'Disk Usage',
      value: 78,
      unit: '%',
      status: 'warning',
      threshold: { warning: 75, critical: 90 },
      description: 'Storage utilization'
    },
    database: {
      name: 'Database Performance',
      value: 12,
      unit: 'ms',
      status: 'healthy',
      threshold: { warning: 50, critical: 100 },
      description: 'Average query response time'
    },
    apiResponseTime: {
      name: 'API Response Time',
      value: 145,
      unit: 'ms',
      status: 'healthy',
      threshold: { warning: 500, critical: 1000 },
      description: 'Average API response time'
    },
    errorRate: {
      name: 'Error Rate',
      value: 0.12,
      unit: '%',
      status: 'healthy',
      threshold: { warning: 1, critical: 5 },
      description: '5xx errors in last hour'
    }
  },
  services: [
    {
      name: 'API Server',
      status: 'online',
      uptime: 99.98,
      responseTime: 145,
      lastCheck: new Date(),
      endpoint: '/api/health'
    },
    {
      name: 'Database',
      status: 'online',
      uptime: 99.95,
      responseTime: 12,
      lastCheck: new Date(),
    },
    {
      name: 'Authentication Service',
      status: 'online',
      uptime: 99.99,
      responseTime: 89,
      lastCheck: new Date(),
      endpoint: '/api/auth/health'
    },
    {
      name: 'File Storage',
      status: 'online',
      uptime: 99.92,
      responseTime: 234,
      lastCheck: new Date(),
    },
    {
      name: 'Email Service',
      status: 'degraded',
      uptime: 98.5,
      responseTime: 1200,
      lastCheck: new Date(),
    }
  ],
  lastUpdated: new Date()
};

export function SystemHealth({
  data = mockSystemHealth,
  isLoading = false,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30000,
  className
}: SystemHealthProps) {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(() => {
        onRefresh();
        setLastRefresh(new Date());
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, onRefresh, refreshInterval]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
      setLastRefresh(new Date());
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-32" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const OverallIcon = getStatusIcon(data.overall);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <OverallIcon className={cn(
                "h-5 w-5",
                data.overall === 'healthy' ? 'text-green-600' :
                data.overall === 'warning' ? 'text-yellow-600' : 'text-red-600'
              )} />
              System Health
            </CardTitle>
            <CardDescription>
              Real-time system monitoring and health status
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={getStatusColor(data.overall)}
            >
              {data.overall.charAt(0).toUpperCase() + data.overall.slice(1)}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Uptime */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="font-medium">System Uptime</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatUptime(data.uptime)}
            </div>
            <div className="text-xs text-muted-foreground">
              Last 30 days
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div>
          <h4 className="text-sm font-medium mb-3">System Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.metrics).map(([key, metric]) => {
              const Icon = getMetricIcon(key);
              const percentage = metric.threshold ? 
                (metric.value / (metric.threshold.critical * 1.2)) * 100 : 
                metric.value;

              return (
                <div key={key} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{metric.name}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getStatusColor(metric.status))}
                    >
                      {metric.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-medium">
                        {metric.value}{metric.unit}
                      </span>
                    </div>
                    
                    {metric.threshold && (
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className="h-2"
                      />
                    )}
                  </div>
                  
                  {metric.description && (
                    <p className="text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Services Status */}
        <div>
          <h4 className="text-sm font-medium mb-3">Services Status</h4>
          <div className="space-y-2">
            {data.services.map((service, index) => {
              const StatusIcon = getStatusIcon(service.status);
              
              return (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={cn(
                      "h-4 w-4",
                      service.status === 'online' ? 'text-green-600' :
                      service.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                    )} />
                    <div>
                      <div className="text-sm font-medium">{service.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {service.endpoint && `${service.endpoint} • `}
                        Checked {new Date(service.lastCheck).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-right">
                      <div className="font-medium">{formatUptime(service.uptime)}</div>
                      <div className="text-xs text-muted-foreground">uptime</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{service.responseTime}ms</div>
                      <div className="text-xs text-muted-foreground">response</div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getStatusColor(service.status))}
                    >
                      {service.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Last updated: {data.lastUpdated.toLocaleTimeString()} • 
            {autoRefresh && ` Auto-refresh every ${refreshInterval / 1000}s`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}