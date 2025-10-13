'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import SubscriptionPlans from '@/components/subscription-plans';
import SubscriptionDashboard from '@/components/subscription-dashboard';
import PaymentForm from '@/components/payment-form';
import { 
  CreditCard, 
  FileText, 
  Users, 
  DollarSign, 
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Mock data - in a real app, this would come from your API
const mockData = {
  lawFirm: {
    id: 'firm_123',
    name: 'Smith & Associates Law Firm',
    subscription: 'PROFESSIONAL',
    status: 'ACTIVE'
  },
  stats: {
    totalRevenue: 45000,
    activeClients: 38,
    pendingInvoices: 12,
    overdueInvoices: 3
  },
  recentInvoices: [
    {
      id: 'inv_001',
      invoiceNumber: 'INV-202408-0001',
      client: 'Acme Corp',
      amount: 2500,
      status: 'PAID',
      dueDate: '2024-08-15'
    },
    {
      id: 'inv_002',
      invoiceNumber: 'INV-202408-0002',
      client: 'Tech Solutions Inc',
      amount: 3200,
      status: 'OVERDUE',
      dueDate: '2024-08-10'
    },
    {
      id: 'inv_003',
      invoiceNumber: 'INV-202408-0003',
      client: 'Global Enterprises',
      amount: 1800,
      status: 'SENT',
      dueDate: '2024-08-25'
    }
  ]
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentForm(true);
    toast.success(`Selected ${planId} plan`);
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    setShowPaymentForm(false);
    toast.success('Subscription created successfully!');
    // Redirect to subscription dashboard or refresh data
    setActiveTab('subscription');
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description,
    trend 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    description?: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend.isPositive ? '+' : ''}{trend.value}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">LexChronos Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {mockData.lawFirm.name}
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Revenue"
                value={formatCurrency(mockData.stats.totalRevenue)}
                icon={DollarSign}
                description="This month"
                trend={{ value: 12.5, isPositive: true }}
              />
              <StatCard
                title="Active Clients"
                value={mockData.stats.activeClients}
                icon={Users}
                description="Currently active"
                trend={{ value: 8.2, isPositive: true }}
              />
              <StatCard
                title="Pending Invoices"
                value={mockData.stats.pendingInvoices}
                icon={FileText}
                description="Awaiting payment"
              />
              <StatCard
                title="Overdue Invoices"
                value={mockData.stats.overdueInvoices}
                icon={AlertCircle}
                description="Requires attention"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Invoices</CardTitle>
                  <CardDescription>Latest billing activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.recentInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">{invoice.client}</p>
                          <p className="text-xs text-gray-500">Due: {formatDate(invoice.dueDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                          <Badge 
                            variant={invoice.status === 'PAID' ? 'default' : 
                                   invoice.status === 'OVERDUE' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View All Invoices
                  </Button>
                </CardContent>
              </Card>

              {/* Subscription Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Status</CardTitle>
                  <CardDescription>Current plan and usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Current Plan</span>
                      <Badge className="bg-purple-100 text-purple-800">
                        {mockData.lawFirm.subscription}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <Badge className="bg-green-100 text-green-800">
                        {mockData.lawFirm.status}
                      </Badge>
                    </div>
                    <div className="pt-4">
                      <Button 
                        className="w-full" 
                        onClick={() => setActiveTab('subscription')}
                      >
                        Manage Subscription
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <SubscriptionDashboard lawFirmId={mockData.lawFirm.id} />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Management</CardTitle>
                <CardDescription>
                  Manage your invoices, payments, and billing history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Billing Dashboard Coming Soon</h3>
                  <p className="text-gray-600 mb-4">
                    Full billing management features will be available here.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" disabled>Invoice Generation</Button>
                    <Button variant="outline" disabled>Payment History</Button>
                    <Button variant="outline" disabled>Tax Reports</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Management</CardTitle>
                <CardDescription>
                  Manage payment methods, process refunds, and view payment history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Payment Dashboard Coming Soon</h3>
                  <p className="text-gray-600 mb-4">
                    Full payment management features will be available here.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" disabled>Payment Methods</Button>
                    <Button variant="outline" disabled>Process Refunds</Button>
                    <Button variant="outline" disabled>Transaction History</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Choose Your Plan</h2>
              <p className="text-gray-600">
                Select the perfect plan for your law firm's needs.
              </p>
            </div>

            {showPaymentForm && selectedPlan ? (
              <div className="max-w-2xl mx-auto">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Complete Your Subscription</CardTitle>
                    <CardDescription>
                      You selected the {selectedPlan} plan. Enter your payment details below.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <PaymentForm
                  amount={selectedPlan === 'BASIC' ? 99 : selectedPlan === 'PROFESSIONAL' ? 199 : 499}
                  description={`${selectedPlan} Plan Subscription`}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />

                <div className="text-center mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPaymentForm(false)}
                  >
                    Back to Plans
                  </Button>
                </div>
              </div>
            ) : (
              <SubscriptionPlans
                onSelectPlan={handlePlanSelection}
                currentPlan={mockData.lawFirm.subscription}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}