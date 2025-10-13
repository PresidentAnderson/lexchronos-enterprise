'use client'

/**
 * LexChronos Analytics Dashboard
 * Comprehensive analytics visualization for legal practice management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, FileText, Clock, DollarSign, 
  Gavel, Search, AlertCircle, Target, Calendar, Phone 
} from 'lucide-react';

// Types for analytics data
interface AnalyticsMetric {
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
  color: string;
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface TimeSeriesData {
  date: string;
  cases: number;
  revenue: number;
  billableHours: number;
  clientInteractions: number;
}

interface PracticeAreaData {
  area: string;
  cases: number;
  revenue: number;
  avgCaseValue: number;
  winRate: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');
  
  // Mock data - in real implementation, this would come from your analytics API
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([
    {
      label: 'Total Revenue',
      value: '$145,230',
      change: 12.5,
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      label: 'Active Cases',
      value: '87',
      change: 5.2,
      trend: 'up',
      icon: Gavel,
      color: 'text-blue-600'
    },
    {
      label: 'Billable Hours',
      value: '1,248',
      change: -2.1,
      trend: 'down',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      label: 'Client Interactions',
      value: '342',
      change: 8.3,
      trend: 'up',
      icon: Phone,
      color: 'text-purple-600'
    },
    {
      label: 'Documents Processed',
      value: '2,156',
      change: 15.7,
      trend: 'up',
      icon: FileText,
      color: 'text-indigo-600'
    },
    {
      label: 'New Clients',
      value: '23',
      change: 18.2,
      trend: 'up',
      icon: Users,
      color: 'text-cyan-600'
    }
  ]);

  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([
    { date: '2024-01-01', cases: 45, revenue: 85000, billableHours: 180, clientInteractions: 95 },
    { date: '2024-01-08', cases: 48, revenue: 92000, billableHours: 195, clientInteractions: 103 },
    { date: '2024-01-15', cases: 52, revenue: 98000, billableHours: 210, clientInteractions: 118 },
    { date: '2024-01-22', cases: 47, revenue: 89000, billableHours: 188, clientInteractions: 97 },
    { date: '2024-01-29', cases: 55, revenue: 105000, billableHours: 225, clientInteractions: 125 },
  ]);

  const [practiceAreaData, setPracticeAreaData] = useState<PracticeAreaData[]>([
    { area: 'Corporate Law', cases: 28, revenue: 125000, avgCaseValue: 4464, winRate: 92 },
    { area: 'Employment Law', cases: 34, revenue: 89000, avgCaseValue: 2618, winRate: 88 },
    { area: 'Intellectual Property', cases: 15, revenue: 67000, avgCaseValue: 4467, winRate: 95 },
    { area: 'Litigation', cases: 22, revenue: 78000, avgCaseValue: 3545, winRate: 85 },
    { area: 'Real Estate', cases: 41, revenue: 56000, avgCaseValue: 1366, winRate: 90 }
  ]);

  const [caseStatusData, setCaseStatusData] = useState<ChartData[]>([
    { name: 'Active', value: 45, color: '#3B82F6' },
    { name: 'Closed Won', value: 28, color: '#10B981' },
    { name: 'Settled', value: 18, color: '#F59E0B' },
    { name: 'Pending', value: 12, color: '#EF4444' },
    { name: 'On Hold', value: 7, color: '#6B7280' }
  ]);

  const [revenueBySource, setRevenueBySource] = useState<ChartData[]>([
    { name: 'Existing Clients', value: 145000, percentage: 65 },
    { name: 'New Clients', value: 67000, percentage: 30 },
    { name: 'Referrals', value: 23000, percentage: 10 },
    { name: 'Marketing', value: 12000, percentage: 5 }
  ]);

  // Calculate conversion metrics
  const conversionMetrics = {
    leadToClient: 23.5,
    consultationToRetainer: 67.2,
    caseWinRate: 89.4,
    clientRetentionRate: 94.1
  };

  // User behavior analytics
  const userBehaviorData = {
    avgSessionDuration: '12m 34s',
    mostUsedFeatures: [
      { feature: 'Case Management', usage: 85 },
      { feature: 'Time Tracking', usage: 72 },
      { feature: 'Document Upload', usage: 68 },
      { feature: 'Client Communication', usage: 65 },
      { feature: 'Billing', usage: 58 }
    ],
    searchQueries: [
      { query: 'employment contract', count: 45 },
      { query: 'discovery motion', count: 38 },
      { query: 'client intake form', count: 32 },
      { query: 'settlement agreement', count: 28 },
      { query: 'court filing', count: 24 }
    ]
  };

  const MetricCard: React.FC<{ metric: AnalyticsMetric }> = ({ metric }) => {
    const Icon = metric.icon;
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
          <Icon className={`h-4 w-4 ${metric.color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metric.value}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {metric.trend === 'up' ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            ) : metric.trend === 'down' ? (
              <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
            ) : (
              <div className="mr-1 h-3 w-3" />
            )}
            {metric.change > 0 ? '+' : ''}{metric.change}% from last period
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics for your legal practice
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cases">Case Analytics</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="clients">Client Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="user-behavior">User Behavior</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Time Series Chart */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cases" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="billableHours" stroke="#F59E0B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Practice Area Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Practice Area Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={practiceAreaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="area" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Case Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Case Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={caseStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {caseStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Case Analytics Tab */}
        <TabsContent value="cases" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Case Progression Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {practiceAreaData.map((area) => (
                  <div key={area.area} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{area.area}</span>
                      <span className="text-sm text-muted-foreground">
                        {area.cases} cases • ${area.avgCaseValue} avg
                      </span>
                    </div>
                    <Progress value={area.winRate} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {area.winRate}% success rate
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Case Resolution Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Case Duration</span>
                    <Badge variant="secondary">4.2 months</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Fastest Resolution</span>
                    <Badge variant="secondary">18 days</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Longest Case</span>
                    <Badge variant="secondary">2.1 years</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cases Closed This Month</span>
                    <Badge variant="secondary">23</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={revenueBySource}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({name, percentage}) => `${name}: ${percentage}%`}
                    >
                      {revenueBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 90}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial KPIs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average Hourly Rate</span>
                  <Badge variant="secondary">$425</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Utilization Rate</span>
                  <Badge variant="secondary">78%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Collection Rate</span>
                  <Badge variant="secondary">94%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Outstanding Receivables</span>
                  <Badge variant="destructive">$23,450</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Client Insights Tab */}
        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Acquisition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Lead to Client Rate</span>
                    <Badge variant="secondary">{conversionMetrics.leadToClient}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Consultation to Retainer</span>
                    <Badge variant="secondary">{conversionMetrics.consultationToRetainer}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Client Retention Rate</span>
                    <Badge variant="secondary">{conversionMetrics.clientRetentionRate}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">4.7</div>
                    <div className="text-sm text-muted-foreground">Average Rating</div>
                  </div>
                  <Progress value={94} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">
                    94% client satisfaction rate
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average Page Load Time</span>
                  <Badge variant="secondary">1.2s</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Uptime</span>
                  <Badge variant="secondary">99.9%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Error Rate</span>
                  <Badge variant="secondary">0.1%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Daily Active Users</span>
                  <Badge variant="secondary">127</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Monthly Active Users</span>
                  <Badge variant="secondary">394</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Session Duration</span>
                  <Badge variant="secondary">{userBehaviorData.avgSessionDuration}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="user-behavior" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Most Used Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userBehaviorData.mostUsedFeatures.map((feature, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{feature.feature}</span>
                      <span className="text-sm text-muted-foreground">{feature.usage}%</span>
                    </div>
                    <Progress value={feature.usage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Search Queries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userBehaviorData.searchQueries.map((query, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{query.query}</span>
                    <Badge variant="outline">{query.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;