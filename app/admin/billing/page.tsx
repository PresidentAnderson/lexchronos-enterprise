"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MetricCard } from '@/components/admin/MetricCard';
import {
  CreditCard,
  DollarSign,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Building2,
  User,
  Eye,
  RotateCcw,
  Send
} from 'lucide-react';

// Mock billing data
interface Invoice {
  id: string;
  number: string;
  organization: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'failed';
  dueDate: Date;
  paidDate?: Date;
  createdDate: Date;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subscription: {
    plan: string;
    period: string;
  };
}

interface PaymentMethod {
  id: string;
  organizationId: string;
  organizationName: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  status: 'active' | 'expired' | 'failed';
}

interface Refund {
  id: string;
  invoiceId: string;
  organizationName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processed' | 'failed';
  requestedDate: Date;
  processedDate?: Date;
}

const generateMockInvoices = (): Invoice[] => {
  const statuses = ['paid', 'pending', 'overdue', 'failed'] as const;
  const plans = ['Basic', 'Professional', 'Enterprise'];
  
  return Array.from({ length: 25 }, (_, i) => ({
    id: `inv-${i + 1}`,
    number: `INV-2024-${String(i + 1).padStart(4, '0')}`,
    organization: {
      id: `org-${i + 1}`,
      name: `Law Firm ${i + 1}`,
      email: `billing@lawfirm${i + 1}.com`
    },
    amount: Math.floor(Math.random() * 1000) + 100,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    paidDate: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) : undefined,
    createdDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
    items: [
      {
        description: `${plans[Math.floor(Math.random() * plans.length)]} Plan - Monthly`,
        quantity: 1,
        unitPrice: Math.floor(Math.random() * 1000) + 100,
        total: Math.floor(Math.random() * 1000) + 100
      }
    ],
    subscription: {
      plan: plans[Math.floor(Math.random() * plans.length)],
      period: 'monthly'
    }
  }));
};

const generateMockPaymentMethods = (): PaymentMethod[] => {
  const brands = ['visa', 'mastercard', 'amex'];
  const statuses = ['active', 'expired', 'failed'] as const;
  
  return Array.from({ length: 15 }, (_, i) => ({
    id: `pm-${i + 1}`,
    organizationId: `org-${i + 1}`,
    organizationName: `Law Firm ${i + 1}`,
    type: 'card' as const,
    last4: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
    brand: brands[Math.floor(Math.random() * brands.length)],
    expiryMonth: Math.floor(Math.random() * 12) + 1,
    expiryYear: 2024 + Math.floor(Math.random() * 5),
    isDefault: Math.random() > 0.7,
    status: statuses[Math.floor(Math.random() * statuses.length)]
  }));
};

const generateMockRefunds = (): Refund[] => {
  const statuses = ['pending', 'processed', 'failed'] as const;
  const reasons = [
    'Customer request',
    'Billing error',
    'Service issue',
    'Duplicate charge',
    'Cancellation'
  ];
  
  return Array.from({ length: 8 }, (_, i) => ({
    id: `ref-${i + 1}`,
    invoiceId: `inv-${i + 1}`,
    organizationName: `Law Firm ${i + 1}`,
    amount: Math.floor(Math.random() * 500) + 50,
    reason: reasons[Math.floor(Math.random() * reasons.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    requestedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    processedDate: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) : undefined
  }));
};

export default function BillingManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>(generateMockInvoices());
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(generateMockPaymentMethods());
  const [refunds, setRefunds] = useState<Refund[]>(generateMockRefunds());
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Calculate billing metrics
  const billingMetrics = {
    totalRevenue: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pendingAmount: invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
    overdueAmount: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0),
    failedAmount: invoices.filter(inv => inv.status === 'failed').reduce((sum, inv) => sum + inv.amount, 0),
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
    pendingInvoices: invoices.filter(inv => inv.status === 'pending').length,
    overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length,
    refundAmount: refunds.filter(ref => ref.status === 'processed').reduce((sum, ref) => sum + ref.amount, 0)
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.organization.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleRetryPayment = (invoiceId: string) => {
    console.log('Retrying payment for invoice:', invoiceId);
    // In real app, trigger payment retry
  };

  const handleSendReminder = (invoiceId: string) => {
    console.log('Sending reminder for invoice:', invoiceId);
    // In real app, send payment reminder email
  };

  const handleProcessRefund = (refundId: string) => {
    setRefunds(refunds.map(refund => 
      refund.id === refundId 
        ? { ...refund, status: 'processed', processedDate: new Date() }
        : refund
    ));
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Management</h1>
          <p className="text-muted-foreground">
            Manage invoices, payments, and refund processing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Billing Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={billingMetrics.totalRevenue}
          format="currency"
          icon={DollarSign}
          description={`${billingMetrics.paidInvoices} paid invoices`}
        />
        <MetricCard
          title="Pending Amount"
          value={billingMetrics.pendingAmount}
          format="currency"
          icon={CreditCard}
          description={`${billingMetrics.pendingInvoices} pending invoices`}
        />
        <MetricCard
          title="Overdue Amount"
          value={billingMetrics.overdueAmount}
          format="currency"
          icon={AlertTriangle}
          description={`${billingMetrics.overdueInvoices} overdue invoices`}
        />
        <MetricCard
          title="Refund Amount"
          value={billingMetrics.refundAmount}
          format="currency"
          icon={RotateCcw}
          description="Total refunds processed"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices ({filteredInvoices.length})</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="refunds">Refunds ({refunds.length})</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Invoices */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                Manage customer invoices and payment processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{invoice.number}</h4>
                        <Badge variant="outline" className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Building2 className="h-3 w-3" />
                          <span>{invoice.organization.name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3" />
                          <span>${invoice.amount.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {invoice.dueDate.toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {invoice.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSendReminder(invoice.id)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Remind
                        </Button>
                      )}
                      
                      {invoice.status === 'failed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRetryPayment(invoice.id)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Retry
                        </Button>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Invoice {selectedInvoice?.number}</DialogTitle>
                            <DialogDescription>
                              Invoice details and line items
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Organization</label>
                                <div className="mt-1 p-2 bg-muted rounded">
                                  <div className="text-sm font-medium">{selectedInvoice?.organization.name}</div>
                                  <div className="text-xs text-muted-foreground">{selectedInvoice?.organization.email}</div>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Amount</label>
                                <div className="mt-1 p-2 bg-muted rounded">
                                  <div className="text-lg font-bold">${selectedInvoice?.amount.toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <div className="mt-1">
                                  <Badge variant="outline" className={getStatusColor(selectedInvoice?.status || '')}>
                                    {selectedInvoice?.status}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Due Date</label>
                                <div className="mt-1 text-sm">{selectedInvoice?.dueDate.toLocaleDateString()}</div>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Line Items</label>
                              <div className="mt-1 border rounded">
                                {selectedInvoice?.items.map((item, index) => (
                                  <div key={index} className="flex justify-between p-3 border-b last:border-b-0">
                                    <div>
                                      <div className="text-sm font-medium">{item.description}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Qty: {item.quantity} × ${item.unitPrice}
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium">${item.total.toLocaleString()}</div>
                                  </div>
                                ))}
                                <div className="flex justify-between p-3 bg-muted font-bold">
                                  <span>Total</span>
                                  <span>${selectedInvoice?.amount.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage customer payment methods and cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="font-medium">•••• •••• •••• {method.last4}</span>
                        {method.brand && (
                          <Badge variant="outline">{method.brand.toUpperCase()}</Badge>
                        )}
                        {method.isDefault && (
                          <Badge variant="default">Default</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {method.organizationName} • Expires {method.expiryMonth}/{method.expiryYear}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getStatusColor(method.status)}>
                        {method.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refunds */}
        <TabsContent value="refunds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Refund Requests</CardTitle>
              <CardDescription>
                Process and manage customer refunds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {refunds.map((refund) => (
                  <div
                    key={refund.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{refund.organizationName}</span>
                        <Badge variant="outline" className={getStatusColor(refund.status)}>
                          {refund.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${refund.amount.toLocaleString()} • {refund.reason} • Invoice {refund.invoiceId}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Requested: {refund.requestedDate.toLocaleDateString()}
                        {refund.processedDate && ` • Processed: ${refund.processedDate.toLocaleDateString()}`}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {refund.status === 'pending' && (
                        <Button 
                          size="sm"
                          onClick={() => handleProcessRefund(refund.id)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Process
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Reports</CardTitle>
              <CardDescription>
                Generate financial reports and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Revenue Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Revenue:</span>
                      <span className="font-medium">${billingMetrics.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <span className="text-yellow-600">${billingMetrics.pendingAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overdue:</span>
                      <span className="text-red-600">${billingMetrics.overdueAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Refunds:</span>
                      <span className="text-red-600">-${billingMetrics.refundAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Collection Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Collection Rate:</span>
                      <span className="font-medium">
                        {((billingMetrics.paidInvoices / billingMetrics.totalInvoices) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Days to Pay:</span>
                      <span className="font-medium">12.3 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed Payments:</span>
                      <span className="text-red-600">{invoices.filter(inv => inv.status === 'failed').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Churn Rate:</span>
                      <span className="text-yellow-600">2.1%</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Metrics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}