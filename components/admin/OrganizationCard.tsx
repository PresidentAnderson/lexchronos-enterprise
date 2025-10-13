"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Building,
  Users,
  FileText,
  DollarSign,
  Calendar,
  MoreHorizontal,
  Edit,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  subscription: {
    plan: 'trial' | 'basic' | 'professional' | 'enterprise';
    status: 'active' | 'past_due' | 'canceled' | 'unpaid';
    billingCycle: 'monthly' | 'yearly';
    nextBillingDate: Date;
    amount: number;
  };
  usage: {
    users: { current: number; limit: number };
    cases: { current: number; limit: number };
    storage: { current: number; limit: number }; // in GB
  };
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalCases: number;
    activeCases: number;
    monthlyRevenue: number;
  };
  createdAt: Date;
  lastActivity?: Date;
  adminContact?: {
    name: string;
    email: string;
  };
}

interface OrganizationCardProps {
  organization: Organization;
  onEdit?: (organization: Organization) => void;
  onManageSubscription?: (organizationId: string) => void;
  onViewDetails?: (organizationId: string) => void;
  className?: string;
  showDetailedMetrics?: boolean;
}

const getSubscriptionStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'past_due':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'canceled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'unpaid':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPlanColor = (plan: string): string => {
  switch (plan) {
    case 'trial':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'basic':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'professional':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'enterprise':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

const getUsageColor = (percentage: number): string => {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

export function OrganizationCard({
  organization,
  onEdit,
  onManageSubscription,
  onViewDetails,
  className,
  showDetailedMetrics = false
}: OrganizationCardProps) {
  const userUsagePercentage = (organization.usage.users.current / organization.usage.users.limit) * 100;
  const caseUsagePercentage = (organization.usage.cases.current / organization.usage.cases.limit) * 100;
  const storageUsagePercentage = (organization.usage.storage.current / organization.usage.storage.limit) * 100;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              {organization.name}
            </CardTitle>
            <CardDescription>
              {organization.domain && (
                <span className="text-sm text-muted-foreground">
                  {organization.domain}
                </span>
              )}
              {organization.industry && (
                <span className="text-sm text-muted-foreground ml-2">
                  • {organization.industry}
                </span>
              )}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {onViewDetails && (
                <DropdownMenuItem onClick={() => onViewDetails(organization.id)}>
                  <Building className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(organization)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Organization
                </DropdownMenuItem>
              )}
              
              {onManageSubscription && (
                <DropdownMenuItem onClick={() => onManageSubscription(organization.id)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Subscription
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Subscription Info */}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className={getPlanColor(organization.subscription.plan)}>
            {organization.subscription.plan.charAt(0).toUpperCase() + organization.subscription.plan.slice(1)}
          </Badge>
          <Badge variant="outline" className={getSubscriptionStatusColor(organization.subscription.status)}>
            {organization.subscription.status.replace('_', ' ').charAt(0).toUpperCase() + organization.subscription.status.replace('_', ' ').slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </div>
            <div className="text-2xl font-bold">
              {organization.metrics.totalUsers}
            </div>
            <div className="text-xs text-muted-foreground">
              {organization.metrics.activeUsers} active
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Cases</span>
            </div>
            <div className="text-2xl font-bold">
              {organization.metrics.totalCases}
            </div>
            <div className="text-xs text-muted-foreground">
              {organization.metrics.activeCases} active
            </div>
          </div>
        </div>

        {/* Usage Progress Bars */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Users</span>
              <span className={cn(
                "font-medium",
                userUsagePercentage >= 90 ? "text-red-600" : 
                userUsagePercentage >= 75 ? "text-yellow-600" : "text-green-600"
              )}>
                {organization.usage.users.current} / {organization.usage.users.limit}
              </span>
            </div>
            <Progress 
              value={userUsagePercentage} 
              className="h-2"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Cases</span>
              <span className={cn(
                "font-medium",
                caseUsagePercentage >= 90 ? "text-red-600" : 
                caseUsagePercentage >= 75 ? "text-yellow-600" : "text-green-600"
              )}>
                {organization.usage.cases.current} / {organization.usage.cases.limit}
              </span>
            </div>
            <Progress 
              value={caseUsagePercentage} 
              className="h-2"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Storage</span>
              <span className={cn(
                "font-medium",
                storageUsagePercentage >= 90 ? "text-red-600" : 
                storageUsagePercentage >= 75 ? "text-yellow-600" : "text-green-600"
              )}>
                {organization.usage.storage.current}GB / {organization.usage.storage.limit}GB
              </span>
            </div>
            <Progress 
              value={storageUsagePercentage} 
              className="h-2"
            />
          </div>
        </div>

        {/* Billing Information */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Monthly Revenue</span>
              </div>
              <div className="text-lg font-semibold">
                {formatCurrency(organization.metrics.monthlyRevenue)}
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Next Billing</span>
              </div>
              <div className="text-sm font-medium">
                {formatDate(organization.subscription.nextBillingDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Contact */}
        {organization.adminContact && (
          <div className="border-t pt-4">
            <div className="text-xs text-muted-foreground mb-1">Admin Contact</div>
            <div className="text-sm font-medium">{organization.adminContact.name}</div>
            <div className="text-xs text-muted-foreground">{organization.adminContact.email}</div>
          </div>
        )}

        {/* Alerts */}
        {(userUsagePercentage >= 90 || caseUsagePercentage >= 90 || storageUsagePercentage >= 90) && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md p-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Usage limits approaching</span>
            </div>
          </div>
        )}

        {organization.subscription.status !== 'active' && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Subscription requires attention</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized organization list component
export function OrganizationList({ 
  organizations, 
  isLoading = false,
  ...props 
}: {
  organizations: Organization[];
  isLoading?: boolean;
} & Omit<OrganizationCardProps, 'organization'>) {
  if (isLoading) {
    return (
      <div className="grid gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-48" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-gray-200 rounded" />
                  <div className="h-16 bg-gray-200 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {organizations.map((organization) => (
        <OrganizationCard
          key={organization.id}
          organization={organization}
          {...props}
        />
      ))}
    </div>
  );
}