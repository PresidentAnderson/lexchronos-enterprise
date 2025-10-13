"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationCard, OrganizationList } from '@/components/admin/OrganizationCard';
import { MetricCard } from '@/components/admin/MetricCard';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react';

// Mock organization data
const generateMockOrganizations = () => {
  const plans = ['trial', 'basic', 'professional', 'enterprise'] as const;
  const statuses = ['active', 'past_due', 'canceled', 'unpaid'] as const;
  const industries = ['Corporate Law', 'Criminal Defense', 'Family Law', 'Immigration', 'Personal Injury'];
  const sizes = ['small', 'medium', 'large', 'enterprise'] as const;

  return Array.from({ length: 12 }, (_, i) => ({
    id: `org-${i + 1}`,
    name: `${['Smith & Associates', 'Johnson Law Group', 'Brown Legal Services', 'Davis & Partners', 'Wilson LLC', 'Taylor Law Firm', 'Anderson Legal', 'Martinez & Co', 'Thompson Associates', 'Garcia Law Group', 'Lee & Partners', 'White Legal Services'][i]}`,
    domain: `${['smith-law', 'johnson-legal', 'brown-legal', 'davis-partners', 'wilson-llc', 'taylor-law', 'anderson-legal', 'martinez-co', 'thompson-law', 'garcia-group', 'lee-partners', 'white-legal'][i]}.com`,
    industry: industries[Math.floor(Math.random() * industries.length)],
    size: sizes[Math.floor(Math.random() * sizes.length)],
    subscription: {
      plan: plans[Math.floor(Math.random() * plans.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      billingCycle: (Math.random() > 0.5 ? 'monthly' : 'yearly') as 'monthly' | 'yearly',
      nextBillingDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
      amount: Math.floor(Math.random() * 500) + 100
    },
    usage: {
      users: {
        current: Math.floor(Math.random() * 50) + 1,
        limit: [10, 25, 100, 500][Math.floor(Math.random() * 4)]
      },
      cases: {
        current: Math.floor(Math.random() * 200) + 10,
        limit: [50, 200, 1000, 5000][Math.floor(Math.random() * 4)]
      },
      storage: {
        current: Math.floor(Math.random() * 80) + 5,
        limit: [100, 500, 2000, 10000][Math.floor(Math.random() * 4)]
      }
    },
    metrics: {
      totalUsers: Math.floor(Math.random() * 50) + 1,
      activeUsers: Math.floor(Math.random() * 40) + 1,
      totalCases: Math.floor(Math.random() * 200) + 10,
      activeCases: Math.floor(Math.random() * 100) + 5,
      monthlyRevenue: Math.floor(Math.random() * 5000) + 500
    },
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    adminContact: {
      name: `Admin ${i + 1}`,
      email: `admin${i + 1}@${['smith-law', 'johnson-legal', 'brown-legal'][i % 3]}.com`
    }
  }));
};

export default function OrganizationsManagement() {
  const [organizations, setOrganizations] = useState(generateMockOrganizations());
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Calculate organization metrics
  const orgMetrics = {
    total: organizations.length,
    active: organizations.filter(org => org.subscription.status === 'active').length,
    trial: organizations.filter(org => org.subscription.plan === 'trial').length,
    pastDue: organizations.filter(org => org.subscription.status === 'past_due').length,
    totalRevenue: organizations.reduce((sum, org) => 
      org.subscription.status === 'active' ? sum + org.metrics.monthlyRevenue : sum, 0
    ),
    averageUsers: Math.round(
      organizations.reduce((sum, org) => sum + org.metrics.totalUsers, 0) / organizations.length
    ),
    averageRevenue: Math.round(
      organizations.reduce((sum, org) => sum + org.metrics.monthlyRevenue, 0) / organizations.length
    )
  };

  // Filter organizations
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = searchTerm === '' || 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.industry?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || org.subscription.status === statusFilter;
    const matchesPlan = planFilter === 'all' || org.subscription.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleOrganizationEdit = (organization: any) => {
    console.log('Edit organization:', organization);
    // In real app, open edit modal
  };

  const handleManageSubscription = (organizationId: string) => {
    console.log('Manage subscription for:', organizationId);
    // In real app, open subscription management
  };

  const handleViewDetails = (organizationId: string) => {
    console.log('View details for:', organizationId);
    // In real app, navigate to organization details
  };

  const handleExportData = () => {
    console.log('Exporting organization data...');
    // In real app, export data
  };

  const planDistribution = [
    { plan: 'trial', count: organizations.filter(o => o.subscription.plan === 'trial').length },
    { plan: 'basic', count: organizations.filter(o => o.subscription.plan === 'basic').length },
    { plan: 'professional', count: organizations.filter(o => o.subscription.plan === 'professional').length },
    { plan: 'enterprise', count: organizations.filter(o => o.subscription.plan === 'enterprise').length },
  ];

  const statusDistribution = [
    { status: 'active', count: organizations.filter(o => o.subscription.status === 'active').length },
    { status: 'past_due', count: organizations.filter(o => o.subscription.status === 'past_due').length },
    { status: 'canceled', count: organizations.filter(o => o.subscription.status === 'canceled').length },
    { status: 'unpaid', count: organizations.filter(o => o.subscription.status === 'unpaid').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
          <p className="text-muted-foreground">
            Manage law firms, subscriptions, and usage monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </Button>
        </div>
      </div>

      {/* Organization Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Organizations"
          value={orgMetrics.total}
          format="number"
          icon={Building2}
          description={`${orgMetrics.active} active, ${orgMetrics.trial} on trial`}
        />
        <MetricCard
          title="Monthly Revenue"
          value={orgMetrics.totalRevenue}
          format="currency"
          icon={DollarSign}
          description={`$${orgMetrics.averageRevenue} average per org`}
        />
        <MetricCard
          title="Total Users"
          value={organizations.reduce((sum, org) => sum + org.metrics.totalUsers, 0)}
          format="number"
          icon={Users}
          description={`${orgMetrics.averageUsers} average per org`}
        />
        <MetricCard
          title="Issues Requiring Attention"
          value={orgMetrics.pastDue}
          format="number"
          icon={AlertTriangle}
          description="Past due or unpaid subscriptions"
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
              <option value="unpaid">Unpaid</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Plans</option>
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations">Organizations ({filteredOrganizations.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="billing">Billing Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4">
          <OrganizationList
            organizations={filteredOrganizations}
            isLoading={isLoading}
            onEdit={handleOrganizationEdit}
            onManageSubscription={handleManageSubscription}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>
                  Breakdown of organizations by subscription plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planDistribution.map(({ plan, count }) => {
                    const percentage = (count / organizations.length * 100).toFixed(1);
                    return (
                      <div key={plan} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {plan.charAt(0).toUpperCase() + plan.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {count} organizations ({percentage}%)
                          </span>
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
                <CardDescription>
                  Current status of all organization subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusDistribution.map(({ status, count }) => {
                    const percentage = (count / organizations.length * 100).toFixed(1);
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'active': return 'bg-green-500';
                        case 'past_due': return 'bg-yellow-500';
                        case 'canceled': return 'bg-red-500';
                        case 'unpaid': return 'bg-red-500';
                        default: return 'bg-gray-500';
                      }
                    };

                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {count} organizations ({percentage}%)
                          </span>
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getStatusColor(status)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Financial performance across all organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${orgMetrics.totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Monthly Revenue</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ${orgMetrics.averageRevenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Average per Organization</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ${Math.round(orgMetrics.totalRevenue / organizations.reduce((sum, org) => sum + org.metrics.totalUsers, 0)).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Revenue per User</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Billing Issues
                </CardTitle>
                <CardDescription>
                  Organizations requiring billing attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organizations
                    .filter(org => org.subscription.status === 'past_due' || org.subscription.status === 'unpaid')
                    .map(org => (
                      <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {org.subscription.status === 'past_due' ? 'Payment past due' : 'Unpaid invoice'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="destructive">
                            {org.subscription.status.replace('_', ' ')}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Contact
                          </Button>
                        </div>
                      </div>
                    ))}
                  {organizations.filter(org => org.subscription.status === 'past_due' || org.subscription.status === 'unpaid').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                      No billing issues found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Renewals
                </CardTitle>
                <CardDescription>
                  Subscriptions renewing in the next 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organizations
                    .filter(org => {
                      const thirtyDaysFromNow = new Date();
                      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                      return org.subscription.nextBillingDate <= thirtyDaysFromNow;
                    })
                    .slice(0, 5)
                    .map(org => (
                      <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Renews {org.subscription.nextBillingDate.toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            ${org.subscription.amount}/{org.subscription.billingCycle === 'monthly' ? 'month' : 'year'}
                          </Badge>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}