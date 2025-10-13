"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  MetricCard,
  UserMetricCard,
  RevenueMetricCard,
  SystemMetricCard
} from '@/components/admin/MetricCard';
import { ActivityFeed, generateMockActivityEvents } from '@/components/admin/ActivityFeed';
import { SystemHealth } from '@/components/admin/SystemHealth';
import {
  Users,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  RefreshCw,
  Download,
  Calendar,
  BarChart3
} from 'lucide-react';

// Mock data for the dashboard
const mockDashboardData = {
  users: {
    total: 1250,
    new: 45,
    active: 892,
    growth: 12.5
  },
  organizations: {
    total: 85,
    new: 3,
    active: 78,
    growth: 8.2
  },
  cases: {
    total: 4520,
    new: 125,
    active: 2340,
    growth: 15.3
  },
  revenue: {
    total: 125400,
    monthly: 18750,
    arpu: 95,
    growth: 22.1
  },
  system: {
    uptime: 99.97,
    responseTime: 145,
    errorRate: 0.12
  }
};

const quickActions = [
  {
    title: 'Create User',
    description: 'Add a new user to the system',
    icon: Users,
    href: '/admin/users?action=create',
    variant: 'default' as const
  },
  {
    title: 'View Reports',
    description: 'Generate system reports',
    icon: BarChart3,
    href: '/admin/analytics',
    variant: 'outline' as const
  },
  {
    title: 'System Backup',
    description: 'Create system backup',
    icon: Download,
    href: '/admin/settings?tab=backup',
    variant: 'outline' as const
  },
  {
    title: 'Support Tickets',
    description: 'View pending support requests',
    icon: AlertTriangle,
    href: '/admin/support',
    variant: 'destructive' as const,
    badge: '3'
  }
];

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [activityEvents, setActivityEvents] = useState(generateMockActivityEvents(25));
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setActivityEvents(generateMockActivityEvents(25));
    setLastRefresh(new Date());
    setIsLoading(false);
  };

  const handleExportData = () => {
    // In real app, this would trigger data export
    console.log('Exporting dashboard data...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and management tools for LexChronos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Alert */}
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            All systems operational
          </span>
          <Badge variant="outline" className="text-green-700 border-green-300">
            99.97% uptime
          </Badge>
        </div>
        <div className="text-xs text-green-700">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={mockDashboardData.users.total}
          format="number"
          change={{
            value: mockDashboardData.users.growth,
            type: 'increase',
            period: 'last month'
          }}
          icon={Users}
          description={`${mockDashboardData.users.active} active users`}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Organizations"
          value={mockDashboardData.organizations.total}
          format="number"
          change={{
            value: mockDashboardData.organizations.growth,
            type: 'increase',
            period: 'last month'
          }}
          icon={Building2}
          description={`${mockDashboardData.organizations.active} active firms`}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Total Cases"
          value={mockDashboardData.cases.total}
          format="number"
          change={{
            value: mockDashboardData.cases.growth,
            type: 'increase',
            period: 'last month'
          }}
          icon={FileText}
          description={`${mockDashboardData.cases.active} active cases`}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Monthly Revenue"
          value={mockDashboardData.revenue.monthly}
          format="currency"
          change={{
            value: mockDashboardData.revenue.growth,
            type: 'increase',
            period: 'last month'
          }}
          icon={DollarSign}
          description={`$${mockDashboardData.revenue.arpu} ARPU`}
          isLoading={isLoading}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.title}
                  variant={action.variant}
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                  asChild
                >
                  <a href={action.href}>
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{action.title}</span>
                      {action.badge && (
                        <Badge variant="destructive" className="ml-auto">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-left opacity-80">
                      {action.description}
                    </p>
                  </a>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Detailed Metrics */}
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
                <CardDescription>
                  User growth and engagement statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserMetricCard
                  totalUsers={mockDashboardData.users.total}
                  newUsers={mockDashboardData.users.new}
                  activeUsers={mockDashboardData.users.active}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
                <CardDescription>
                  Financial performance and subscription analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueMetricCard
                  totalRevenue={mockDashboardData.revenue.total}
                  monthlyRevenue={mockDashboardData.revenue.monthly}
                  averageRevenuePerUser={mockDashboardData.revenue.arpu}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>
                  Technical performance and reliability metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemMetricCard
                  uptime={mockDashboardData.system.uptime}
                  responseTime={mockDashboardData.system.responseTime}
                  errorRate={mockDashboardData.system.errorRate}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ActivityFeed
            events={activityEvents}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            autoRefresh={true}
            refreshInterval={30000}
            maxItems={50}
            showFilters={true}
          />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemHealth
            isLoading={isLoading}
            onRefresh={handleRefresh}
            autoRefresh={true}
            refreshInterval={30000}
          />
        </TabsContent>
      </Tabs>

      {/* Recent Activity Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest system events and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{event.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.userName || event.organizationName || 'System'}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <a href="/admin?tab=activity">View All Activity</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Growth Trends
            </CardTitle>
            <CardDescription>
              Key growth indicators and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User Growth</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+{mockDashboardData.users.growth}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Revenue Growth</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+{mockDashboardData.revenue.growth}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Case Growth</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+{mockDashboardData.cases.growth}%</span>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <a href="/admin/analytics">View Analytics</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}