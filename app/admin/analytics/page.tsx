"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MetricCard } from '@/components/admin/MetricCard';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  FileText,
  Calendar,
  Download,
  RefreshCw,
  Target,
  Activity,
  Zap,
  Clock
} from 'lucide-react';

// Mock analytics data
const analyticsData = {
  revenue: {
    total: 145200,
    monthly: 23400,
    quarterly: 67800,
    yearly: 145200,
    growth: {
      monthly: 15.2,
      quarterly: 8.7,
      yearly: 22.1
    },
    byPlan: {
      trial: 0,
      basic: 12500,
      professional: 45600,
      enterprise: 87100
    },
    recurring: 138900,
    oneTime: 6300
  },
  users: {
    total: 1547,
    active: 1203,
    new: 67,
    churned: 12,
    growth: {
      monthly: 12.8,
      quarterly: 18.3,
      yearly: 45.2
    },
    byRole: {
      clients: 892,
      lawyers: 445,
      paralegals: 156,
      admins: 54
    },
    retention: {
      month1: 95,
      month3: 87,
      month6: 82,
      month12: 76
    }
  },
  organizations: {
    total: 87,
    active: 79,
    new: 5,
    churned: 2,
    growth: {
      monthly: 8.3,
      quarterly: 15.1,
      yearly: 34.8
    },
    bySize: {
      small: 45,
      medium: 28,
      large: 12,
      enterprise: 2
    }
  },
  usage: {
    cases: {
      total: 5642,
      active: 2789,
      new: 234,
      completed: 156
    },
    documents: {
      total: 45672,
      uploaded: 1234,
      scanned: 456,
      storage: 2.3 // TB
    },
    features: {
      documentScanning: 89,
      timelineGeneration: 76,
      realTimeUpdates: 94,
      apiAccess: 23
    }
  },
  performance: {
    pageViews: 156734,
    uniqueVisitors: 12456,
    avgSessionTime: 24.5, // minutes
    bounceRate: 32.1,
    apiCalls: 234567,
    avgResponseTime: 145 // ms
  }
};

const timeRanges = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last 12 months', value: '12m' },
  { label: 'All time', value: 'all' }
];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExport = () => {
    console.log('Exporting analytics data...');
    // In real app, export analytics data
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Revenue analytics, user growth metrics, and performance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={analyticsData.revenue.total}
          format="currency"
          change={{
            value: analyticsData.revenue.growth.monthly,
            type: 'increase',
            period: 'last month'
          }}
          icon={DollarSign}
          description="All-time revenue"
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Active Users"
          value={analyticsData.users.active}
          format="number"
          change={{
            value: analyticsData.users.growth.monthly,
            type: 'increase',
            period: 'last month'
          }}
          icon={Users}
          description={`${analyticsData.users.total} total users`}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Organizations"
          value={analyticsData.organizations.active}
          format="number"
          change={{
            value: analyticsData.organizations.growth.monthly,
            type: 'increase',
            period: 'last month'
          }}
          icon={Building2}
          description={`${analyticsData.organizations.total} total firms`}
          isLoading={isLoading}
        />
        
        <MetricCard
          title="Active Cases"
          value={analyticsData.usage.cases.active}
          format="number"
          change={{
            value: 8.5,
            type: 'increase',
            period: 'last month'
          }}
          icon={FileText}
          description={`${analyticsData.usage.cases.total} total cases`}
          isLoading={isLoading}
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Revenue Analytics */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>
                  Revenue distribution by subscription plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analyticsData.revenue.byPlan).map(([plan, amount]) => {
                  const percentage = (amount / analyticsData.revenue.total * 100).toFixed(1);
                  return (
                    <div key={plan} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{plan}</span>
                        <span>${amount.toLocaleString()} ({percentage}%)</span>
                      </div>
                      <Progress value={parseFloat(percentage)} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Type</CardTitle>
                <CardDescription>
                  Recurring vs one-time revenue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Recurring Revenue</span>
                    <span>${analyticsData.revenue.recurring.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={(analyticsData.revenue.recurring / analyticsData.revenue.total) * 100} 
                    className="h-2" 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">One-time Revenue</span>
                    <span>${analyticsData.revenue.oneTime.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={(analyticsData.revenue.oneTime / analyticsData.revenue.total) * 100} 
                    className="h-2" 
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {((analyticsData.revenue.recurring / analyticsData.revenue.total) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Recurring Revenue Ratio</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth Trends</CardTitle>
              <CardDescription>
                Revenue growth across different time periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      +{analyticsData.revenue.growth.monthly}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">Monthly Growth</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-bold text-blue-600">
                      +{analyticsData.revenue.growth.quarterly}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">Quarterly Growth</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="text-lg font-bold text-purple-600">
                      +{analyticsData.revenue.growth.yearly}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">Yearly Growth</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Analytics */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution by Role</CardTitle>
                <CardDescription>
                  Breakdown of users by their roles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analyticsData.users.byRole).map(([role, count]) => {
                  const percentage = (count / analyticsData.users.total * 100).toFixed(1);
                  return (
                    <div key={role} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{role}</span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                      <Progress value={parseFloat(percentage)} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Retention</CardTitle>
                <CardDescription>
                  User retention rates over time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analyticsData.users.retention).map(([period, rate]) => (
                  <div key={period} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {period.replace('month', 'Month ')}
                      </span>
                      <span>{rate}%</span>
                    </div>
                    <Progress value={rate} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Growth Metrics</CardTitle>
              <CardDescription>
                Key user acquisition and growth statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData.users.new}
                  </div>
                  <div className="text-sm text-muted-foreground">New Users</div>
                  <div className="text-xs text-green-600 mt-1">
                    +{analyticsData.users.growth.monthly}% this month
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData.users.active}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {((analyticsData.users.active / analyticsData.users.total) * 100).toFixed(1)}% of total
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {analyticsData.users.churned}
                  </div>
                  <div className="text-sm text-muted-foreground">Churned Users</div>
                  <div className="text-xs text-red-600 mt-1">
                    {((analyticsData.users.churned / analyticsData.users.total) * 100).toFixed(1)}% churn rate
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData.users.retention.month12}%
                  </div>
                  <div className="text-sm text-muted-foreground">12-Month Retention</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Annual retention rate
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Analytics */}
        <TabsContent value="organizations" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Organizations by Size</CardTitle>
                <CardDescription>
                  Distribution of organizations by company size
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analyticsData.organizations.bySize).map(([size, count]) => {
                  const percentage = (count / analyticsData.organizations.total * 100).toFixed(1);
                  return (
                    <div key={size} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{size}</span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                      <Progress value={parseFloat(percentage)} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization Health</CardTitle>
                <CardDescription>
                  Key metrics for organization success
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Organizations</span>
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      {analyticsData.organizations.active}/{analyticsData.organizations.total}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">New This Month</span>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      +{analyticsData.organizations.new}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Churned This Month</span>
                    <Badge variant="outline" className="text-red-600 border-red-300">
                      -{analyticsData.organizations.churned}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Growth Rate</span>
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      +{analyticsData.organizations.growth.monthly}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Analytics */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feature Adoption</CardTitle>
                <CardDescription>
                  Percentage of organizations using each feature
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analyticsData.usage.features).map(([feature, adoption]) => (
                  <div key={feature} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span>{adoption}%</span>
                    </div>
                    <Progress value={adoption} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Statistics</CardTitle>
                <CardDescription>
                  Cases and documents across the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {analyticsData.usage.cases.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Cases</div>
                    <div className="text-xs text-green-600 mt-1">
                      {analyticsData.usage.cases.active.toLocaleString()} active
                    </div>
                  </div>
                  
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-xl font-bold text-purple-600">
                      {analyticsData.usage.documents.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Documents</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {analyticsData.usage.documents.storage}TB storage used
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Analytics */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Website Performance
                </CardTitle>
                <CardDescription>
                  User engagement and website metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Page Views</span>
                    <span className="text-sm">{analyticsData.performance.pageViews.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Unique Visitors</span>
                    <span className="text-sm">{analyticsData.performance.uniqueVisitors.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg Session Time</span>
                    <span className="text-sm">{analyticsData.performance.avgSessionTime} min</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Bounce Rate</span>
                    <span className="text-sm">{analyticsData.performance.bounceRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  API Performance
                </CardTitle>
                <CardDescription>
                  API usage and response time metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total API Calls</span>
                    <span className="text-sm">{analyticsData.performance.apiCalls.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg Response Time</span>
                    <span className="text-sm">{analyticsData.performance.avgResponseTime}ms</span>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}