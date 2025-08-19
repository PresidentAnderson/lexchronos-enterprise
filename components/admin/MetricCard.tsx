"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  icon?: LucideIcon;
  description?: string;
  className?: string;
  format?: 'number' | 'currency' | 'percentage';
  isLoading?: boolean;
}

const formatValue = (value: string | number, format?: string): string => {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case 'percentage':
      return `${value}%`;
    case 'number':
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
};

const getChangeColor = (type: 'increase' | 'decrease' | 'neutral'): string => {
  switch (type) {
    case 'increase':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'decrease':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'neutral':
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
  switch (type) {
    case 'increase':
      return TrendingUp;
    case 'decrease':
      return TrendingDown;
    case 'neutral':
    default:
      return Minus;
  }
};

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  className,
  format,
  isLoading = false,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
          </CardTitle>
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-20 mb-2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
        </CardContent>
      </Card>
    );
  }

  const ChangeIcon = change ? getChangeIcon(change.type) : null;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">
          {formatValue(value, format)}
        </div>
        
        {change && (
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-medium",
                getChangeColor(change.type)
              )}
            >
              {ChangeIcon && <ChangeIcon className="h-3 w-3 mr-1" />}
              {change.value > 0 && change.type !== 'neutral' && '+'}
              {formatValue(change.value, format === 'currency' ? 'number' : format)}
              {format === 'percentage' && '%'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              vs {change.period}
            </span>
          </div>
        )}
        
        {description && (
          <p className="text-xs text-muted-foreground mt-2">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized metric cards for common admin dashboard metrics
export function UserMetricCard({ totalUsers, newUsers, activeUsers }: {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Total Users"
        value={totalUsers}
        format="number"
        change={{
          value: newUsers,
          type: newUsers > 0 ? 'increase' : 'neutral',
          period: 'last month'
        }}
        description={`${activeUsers} active this month`}
      />
      <MetricCard
        title="New Users"
        value={newUsers}
        format="number"
        change={{
          value: 12,
          type: 'increase',
          period: 'last month'
        }}
        description="New registrations"
      />
      <MetricCard
        title="Active Users"
        value={activeUsers}
        format="number"
        change={{
          value: Math.round((activeUsers / totalUsers) * 100),
          type: 'neutral',
          period: 'activity rate'
        }}
        description="Active in last 30 days"
      />
    </div>
  );
}

export function RevenueMetricCard({ 
  totalRevenue, 
  monthlyRevenue, 
  averageRevenuePerUser 
}: {
  totalRevenue: number;
  monthlyRevenue: number;
  averageRevenuePerUser: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Total Revenue"
        value={totalRevenue}
        format="currency"
        change={{
          value: monthlyRevenue,
          type: monthlyRevenue > 0 ? 'increase' : 'decrease',
          period: 'this month'
        }}
        description="All-time revenue"
      />
      <MetricCard
        title="Monthly Revenue"
        value={monthlyRevenue}
        format="currency"
        change={{
          value: 15,
          type: 'increase',
          period: 'last month'
        }}
        description="Current month"
      />
      <MetricCard
        title="ARPU"
        value={averageRevenuePerUser}
        format="currency"
        description="Average Revenue Per User"
      />
    </div>
  );
}

export function SystemMetricCard({ 
  uptime, 
  responseTime, 
  errorRate 
}: {
  uptime: number;
  responseTime: number;
  errorRate: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="System Uptime"
        value={uptime}
        format="percentage"
        change={{
          value: 0.1,
          type: uptime > 99.9 ? 'increase' : 'decrease',
          period: 'last month'
        }}
        description="99.9% SLA target"
      />
      <MetricCard
        title="Avg Response Time"
        value={`${responseTime}ms`}
        change={{
          value: -50,
          type: 'increase',
          period: 'last week'
        }}
        description="API response time"
      />
      <MetricCard
        title="Error Rate"
        value={errorRate}
        format="percentage"
        change={{
          value: -0.2,
          type: errorRate < 1 ? 'increase' : 'decrease',
          period: 'last day'
        }}
        description="Target: < 1%"
      />
    </div>
  );
}