'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, DollarSign, Filter, LineChart, Plus, RefreshCcw, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/useToast';

interface BillingEntry {
  id: string;
  description: string;
  hours: number;
  amount: number;
  date: string;
  phase?: string;
  category?: string;
}

interface CaseBillingProps {
  caseId: string;
  billingEntries: BillingEntry[];
  estimatedValue?: number;
  actualValue?: number;
  onUpdate: () => void;
}

const CATEGORIES = ['Research', 'Drafting', 'Court Appearance', 'Client Meeting', 'Administrative', 'Other'];

export function CaseBilling({ caseId, billingEntries, estimatedValue, actualValue, onUpdate }: CaseBillingProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState('summary');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | string>('ALL');
  const [newEntry, setNewEntry] = useState({
    description: '',
    hours: '',
    rate: '325',
    category: 'Other',
    phase: 'General',
  });
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const totalAmount = billingEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const totalHours = billingEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    return { totalAmount, totalHours };
  }, [billingEntries]);

  const burnRate = useMemo(() => {
    if (!estimatedValue || estimatedValue === 0) {
      return null;
    }
    return Math.min(100, Math.round((totals.totalAmount / estimatedValue) * 100));
  }, [estimatedValue, totals.totalAmount]);

  const filteredEntries = useMemo(() => {
    return billingEntries.filter(entry => {
      if (categoryFilter !== 'ALL' && entry.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [billingEntries, categoryFilter]);

  const handleAddEntry = async () => {
    if (!newEntry.description || !newEntry.hours) {
      toast.warning('Please provide a description and number of hours.');
      return;
    }

    const hours = Number(newEntry.hours);
    if (Number.isNaN(hours) || hours <= 0) {
      toast.warning('Hours must be a positive number.');
      return;
    }

    const rate = Number(newEntry.rate) || 0;

    setSaving(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newEntry.description,
          hours,
          amount: hours * rate,
          rate,
          category: newEntry.category,
          phase: newEntry.phase,
        }),
      });

      if (response.ok) {
        toast.success('Billing entry added successfully');
        setNewEntry({ description: '', hours: '', rate: newEntry.rate, category: newEntry.category, phase: newEntry.phase });
        onUpdate();
      } else {
        toast.warning('Billing API is unavailable in demo mode.');
      }
    } catch (error) {
      console.error('Failed to add billing entry', error);
      toast.error('Unable to add billing entry in demo environment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Overview
            </CardTitle>
            <CardDescription>
              Monitor realization, budgets, and work-in-progress to prevent overruns.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onUpdate} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Total billed</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.totalAmount)}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Hours recorded</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{totals.totalHours.toFixed(1)}h</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Budget utilization</div>
              <div className="mt-2 flex items-baseline gap-2 text-2xl font-semibold text-gray-900">
                {burnRate !== null ? `${burnRate}%` : 'N/A'}
                {burnRate !== null && (
                  <Badge variant="secondary" className={burnRate > 100 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {burnRate > 100 ? 'Over budget' : 'On track'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Realized value</div>
              <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(actualValue ?? totals.totalAmount)}
                <Badge variant="outline" className="gap-1 text-green-700">
                  <TrendingUp className="h-4 w-4" />
                  Forecast
                </Badge>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-3 lg:w-1/2">
              <TabsTrigger value="summary" className="gap-2">
                <LineChart className="h-4 w-4" /> Summary
              </TabsTrigger>
              <TabsTrigger value="entries" className="gap-2">
                <Filter className="h-4 w-4" /> Entries
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2">
                <Plus className="h-4 w-4" /> New Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" /> Revenue Projection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      Estimated matter value:{' '}
                      <span className="font-semibold text-gray-900">
                        {estimatedValue
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(estimatedValue)
                          : 'Not set'}
                      </span>
                    </p>
                    <p>
                      Actual collected to date:{' '}
                      <span className="font-semibold text-gray-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(actualValue ?? 0)}
                      </span>
                    </p>
                    <p>
                      Work in progress:{' '}
                      <span className="font-semibold text-gray-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.totalAmount - (actualValue ?? 0))}
                      </span>
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingDown className="h-5 w-5 text-amber-600" /> Efficiency Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Average hourly rate: ${(totals.totalAmount / Math.max(totals.totalHours, 1)).toFixed(2)}</p>
                    <p>Blended rate target: ${Number(newEntry.rate).toFixed(2)}</p>
                    <p>Top spending phase: {billingEntries[0]?.phase ?? 'General'}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="entries" className="pt-4">
              <div className="flex flex-wrap items-center gap-3 pb-4">
                <Select value={categoryFilter} onValueChange={value => setCategoryFilter(value as typeof categoryFilter)}>
                  <SelectTrigger className="h-9 w-[240px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All categories</SelectItem>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                          No billing entries found for the selected filters.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredEntries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{entry.description}</div>
                          <div className="text-xs text-muted-foreground">#{entry.id}</div>
                        </TableCell>
                        <TableCell>{entry.date ? format(new Date(entry.date), 'MMM d, yyyy') : 'Not set'}</TableCell>
                        <TableCell>{entry.hours?.toFixed(1) ?? '0.0'}h</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(entry.amount || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {entry.category || 'General'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="new" className="pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <Label className="text-xs font-medium text-muted-foreground">Narrative</Label>
                  <Input
                    className="mt-1 h-10"
                    placeholder="e.g. Drafted motion for summary judgment"
                    value={newEntry.description}
                    onChange={event => setNewEntry(prev => ({ ...prev, description: event.target.value }))}
                  />
                </div>
                <div className="rounded-lg border p-4">
                  <Label className="text-xs font-medium text-muted-foreground">Hours</Label>
                  <Input
                    className="mt-1 h-10"
                    type="number"
                    min="0"
                    step="0.1"
                    value={newEntry.hours}
                    onChange={event => setNewEntry(prev => ({ ...prev, hours: event.target.value }))}
                  />
                </div>
                <div className="rounded-lg border p-4">
                  <Label className="text-xs font-medium text-muted-foreground">Hourly rate</Label>
                  <Input
                    className="mt-1 h-10"
                    type="number"
                    min="0"
                    step="5"
                    value={newEntry.rate}
                    onChange={event => setNewEntry(prev => ({ ...prev, rate: event.target.value }))}
                  />
                </div>
                <div className="rounded-lg border p-4">
                  <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                  <Select value={newEntry.category} onValueChange={value => setNewEntry(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="mt-1 h-10">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-lg border p-4">
                  <Label className="text-xs font-medium text-muted-foreground">Phase</Label>
                  <Input
                    className="mt-1 h-10"
                    value={newEntry.phase}
                    onChange={event => setNewEntry(prev => ({ ...prev, phase: event.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddEntry} disabled={saving} className="w-full gap-2">
                    {saving ? 'Saving...' : 'Add Entry'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
