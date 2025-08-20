'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, DollarSign, AlertTriangle, TrendingUp, Plus, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { TrustAccountForm } from './TrustAccountForm';
import { TrustTransactionForm } from './TrustTransactionForm';
import { TrustAccountList } from './TrustAccountList';
import { TrustTransactionList } from './TrustTransactionList';
import { TrustReconciliation } from './TrustReconciliation';
import { format } from 'date-fns';

interface TrustDashboardProps {
  organizationId: string;
}

interface TrustStats {
  totalAccounts: number;
  activeAccounts: number;
  totalBalance: number;
  reconciledBalance: number;
  pendingTransactions: number;
  overdueReconciliations: number;
  totalTransactions: number;
  monthlyTransactions: number;
  complianceScore: number;
}

export function TrustDashboard({ organizationId }: TrustDashboardProps) {
  const [stats, setStats] = useState<TrustStats>({
    totalAccounts: 0,
    activeAccounts: 0,
    totalBalance: 0,
    reconciledBalance: 0,
    pendingTransactions: 0,
    overdueReconciliations: 0,
    totalTransactions: 0,
    monthlyTransactions: 0,
    complianceScore: 0,
  });

  const [loading, setLoading] = useState(true);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, [organizationId]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trust/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading trust stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getComplianceColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceIcon = (score: number) => {
    if (score >= 95) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (score >= 85) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trust Account Management</h1>
          <p className="text-muted-foreground">
            IOLTA compliant trust accounting and client fund management
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                New Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Trust Account</DialogTitle>
                <DialogDescription>
                  Set up a new IOLTA or trust account for client fund management.
                </DialogDescription>
              </DialogHeader>
              <TrustAccountForm 
                onSuccess={() => {
                  setShowAccountDialog(false);
                  loadDashboardStats();
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Record Trust Transaction</DialogTitle>
                <DialogDescription>
                  Record deposits, withdrawals, and transfers for trust accounts.
                </DialogDescription>
              </DialogHeader>
              <TrustTransactionForm
                accountId={selectedAccount}
                onSuccess={() => {
                  setShowTransactionDialog(false);
                  loadDashboardStats();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAccounts}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalAccounts} total accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Reconciled: {formatCurrency(stats.reconciledBalance)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Transactions awaiting clearance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            {getComplianceIcon(stats.complianceScore)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplianceColor(stats.complianceScore)}`}>
              {stats.complianceScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              IOLTA compliance rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(stats.overdueReconciliations > 0 || stats.complianceScore < 85) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Compliance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700">
            <div className="space-y-2">
              {stats.overdueReconciliations > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{stats.overdueReconciliations} accounts have overdue reconciliations</span>
                </div>
              )}
              {stats.complianceScore < 85 && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Compliance score below threshold - review required</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Trust Accounts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <TrustAccountList onAccountSelect={setSelectedAccount} />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TrustTransactionList accountId={selectedAccount} />
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <TrustReconciliation />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trust Account Reports</CardTitle>
              <CardDescription>
                Generate compliance and financial reports for trust accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col">
                  <Shield className="h-6 w-6 mb-2" />
                  <span>IOLTA Report</span>
                  <span className="text-xs text-muted-foreground">Monthly compliance</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  <span>Balance Report</span>
                  <span className="text-xs text-muted-foreground">Account balances</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  <span>Transaction Report</span>
                  <span className="text-xs text-muted-foreground">Activity summary</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}