'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  HardDrive, 
  CreditCard, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, formatFileSize } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  userLimit: number;
  storageLimit: number;
  currentUsers: number;
  currentStorage: number;
  trialEnd?: string;
}

interface Usage {
  limits: {
    withinLimits: boolean;
    errors: string[];
    usage: {
      users: number;
      userLimit: number;
      storage: number;
      storageLimit: number;
    };
  };
  additionalCharges: {
    additionalUsers: number;
    additionalStorage: number;
    total: number;
    formatted: {
      additionalUsers: string;
      additionalStorage: string;
      total: string;
    };
  };
}

interface SubscriptionDashboardProps {
  lawFirmId: string;
}

export function SubscriptionDashboard({ lawFirmId }: SubscriptionDashboardProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
    fetchUsageData();
  }, [lawFirmId]);

  const fetchSubscriptionData = async () => {
    try {
      // This would typically fetch the current subscription for the law firm
      // For now, we'll simulate the data
      setSubscription({
        id: 'sub_123',
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        userLimit: 25,
        storageLimit: 100,
        currentUsers: 8,
        currentStorage: 45 * 1024 // 45GB in MB
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription data');
    }
  };

  const fetchUsageData = async () => {
    try {
      const response = await fetch(`/api/usage?lawFirmId=${lawFirmId}`);
      const data = await response.json();
      
      if (data.success) {
        setUsage(data.usage);
      } else {
        toast.error('Failed to load usage data');
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
      toast.error('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', cancelAtPeriodEnd: true })
      });

      const data = await response.json();
      
      if (data.success) {
        setSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : null);
        toast.success('Subscription will be canceled at the end of the current period');
      } else {
        toast.error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' })
      });

      const data = await response.json();
      
      if (data.success) {
        setSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: false, status: 'ACTIVE' } : null);
        toast.success('Subscription reactivated successfully');
      } else {
        toast.error(data.error || 'Failed to reactivate subscription');
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Failed to reactivate subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'trialing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'past_due':
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'canceled':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No active subscription found.</p>
        </CardContent>
      </Card>
    );
  }

  const userUsagePercentage = subscription.userLimit > 0 
    ? Math.round((subscription.currentUsers / subscription.userLimit) * 100)
    : 0;

  const storageUsagePercentage = subscription.storageLimit > 0 
    ? Math.round(((subscription.currentStorage / 1024) / subscription.storageLimit) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Subscription Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plan Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
            {getStatusIcon(subscription.status)}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{subscription.plan}</span>
                <Badge className={getStatusColor(subscription.status)}>
                  {subscription.status}
                </Badge>
              </div>
              {subscription.trialEnd && (
                <p className="text-sm text-gray-600">
                  Trial ends {formatDate(subscription.trialEnd)}
                </p>
              )}
              {subscription.cancelAtPeriodEnd && (
                <p className="text-sm text-red-600">
                  Cancels on {formatDate(subscription.currentPeriodEnd)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Usage</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{subscription.currentUsers}</span>
                <span className="text-sm text-gray-600">
                  of {subscription.userLimit === -1 ? '∞' : subscription.userLimit}
                </span>
              </div>
              {subscription.userLimit > 0 && (
                <Progress value={userUsagePercentage} className="h-2" />
              )}
              {userUsagePercentage > 100 && (
                <p className="text-xs text-red-600">Over limit - additional charges apply</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {Math.round(subscription.currentStorage / 1024)}GB
                </span>
                <span className="text-sm text-gray-600">of {subscription.storageLimit}GB</span>
              </div>
              <Progress value={storageUsagePercentage} className="h-2" />
              {storageUsagePercentage > 100 && (
                <p className="text-xs text-red-600">Over limit - additional charges apply</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Subscription Details</TabsTrigger>
          <TabsTrigger value="usage">Usage & Billing</TabsTrigger>
          <TabsTrigger value="actions">Manage Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Your current subscription information and billing cycle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Plan</Label>
                  <p className="text-sm font-medium">{subscription.plan}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status}
                  </Badge>
                </div>
                <div>
                  <Label>Current Period</Label>
                  <p className="text-sm">
                    {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
                <div>
                  <Label>Next Billing Date</Label>
                  <p className="text-sm">{formatDate(subscription.currentPeriodEnd)}</p>
                </div>
              </div>

              {usage?.limits && !usage.limits.withinLimits && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Usage Limits Exceeded</h4>
                      <ul className="text-sm text-yellow-700 mt-1">
                        {usage.limits.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          {usage && (
            <Card>
              <CardHeader>
                <CardTitle>Usage & Additional Charges</CardTitle>
                <CardDescription>
                  Track your usage and any additional charges for the current billing period.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {usage.additionalCharges.total > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-800 mb-2">Additional Charges This Month</h4>
                    <div className="space-y-2 text-sm">
                      {usage.additionalCharges.additionalUsers > 0 && (
                        <div className="flex justify-between">
                          <span>Additional Users:</span>
                          <span className="font-medium">{usage.additionalCharges.formatted.additionalUsers}</span>
                        </div>
                      )}
                      {usage.additionalCharges.additionalStorage > 0 && (
                        <div className="flex justify-between">
                          <span>Additional Storage:</span>
                          <span className="font-medium">{usage.additionalCharges.formatted.additionalStorage}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold pt-2 border-t border-blue-200">
                        <span>Total Additional:</span>
                        <span>{usage.additionalCharges.formatted.total}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Users</Label>
                    <div className="text-sm">
                      <span className="font-medium">{subscription.currentUsers}</span> of{' '}
                      <span>{subscription.userLimit === -1 ? 'unlimited' : subscription.userLimit}</span>
                    </div>
                    {subscription.userLimit > 0 && (
                      <Progress value={userUsagePercentage} className="h-2" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Storage</Label>
                    <div className="text-sm">
                      <span className="font-medium">{Math.round(subscription.currentStorage / 1024)}GB</span> of{' '}
                      <span>{subscription.storageLimit}GB</span>
                    </div>
                    <Progress value={storageUsagePercentage} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Your Plan</CardTitle>
              <CardDescription>
                Update your subscription, cancel, or change your plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                {subscription.cancelAtPeriodEnd ? (
                  <Button
                    onClick={handleReactivateSubscription}
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    {actionLoading ? 'Processing...' : 'Reactivate Subscription'}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1">
                      Change Plan
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      {actionLoading ? 'Processing...' : 'Cancel Subscription'}
                    </Button>
                  </>
                )}
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    Your subscription is scheduled to cancel on{' '}
                    <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>.
                    You can reactivate it anytime before then.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SubscriptionDashboard;