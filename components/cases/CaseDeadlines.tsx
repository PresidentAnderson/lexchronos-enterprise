'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Calendar, Check, Clock, Filter, Plus, RefreshCcw, TimerReset, XCircle } from 'lucide-react';
import { format, isAfter, isBefore, isSameDay, parseISO } from 'date-fns';
import { useToast } from '@/hooks/useToast';

interface CaseDeadline {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
}

interface CaseDeadlinesProps {
  caseId: string;
  deadlines: CaseDeadline[];
  onUpdate: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  UPCOMING: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
};

export function CaseDeadlines({ caseId, deadlines, onUpdate }: CaseDeadlinesProps) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | string>('ALL');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newDeadline, setNewDeadline] = useState({
    title: '',
    dueDate: '',
    priority: 'MEDIUM',
  });

  const getStatus = (deadline: CaseDeadline) => {
    const due = parseISO(deadline.dueDate);
    if (deadline.status?.toUpperCase() === 'COMPLETED') {
      return 'COMPLETED';
    }
    if (!isNaN(due.getTime())) {
      if (isBefore(due, new Date()) && !isSameDay(due, new Date())) {
        return 'OVERDUE';
      }
      if (isSameDay(due, new Date())) {
        return 'OPEN';
      }
      if (isAfter(due, new Date())) {
        return 'UPCOMING';
      }
    }
    return deadline.status?.toUpperCase() || 'OPEN';
  };

  const computedDeadlines = useMemo(() => {
    return deadlines
      .map(deadline => ({ ...deadline, computedStatus: getStatus(deadline) }))
      .filter(deadline => {
        if (search && !deadline.title.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        if (statusFilter !== 'ALL' && deadline.computedStatus !== statusFilter) {
          return false;
        }
        if (priorityFilter !== 'ALL' && deadline.priority?.toUpperCase() !== priorityFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [deadlines, getStatus, priorityFilter, search, statusFilter]);

  const handleCreate = async () => {
    if (!newDeadline.title || !newDeadline.dueDate) {
      toast.warning('Please provide a title and due date for the deadline.');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/deadlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDeadline,
          priority: newDeadline.priority,
        }),
      });

      if (response.ok) {
        toast.success('Deadline created successfully');
        setNewDeadline({ title: '', dueDate: '', priority: 'MEDIUM' });
        onUpdate();
      } else {
        toast.warning('Deadline API is unavailable in demo mode.');
      }
    } catch (error) {
      console.error('Failed to create deadline', error);
      toast.error('Unable to create deadline in demo environment');
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (deadlineId: string) => {
    try {
      const response = await fetch(`/api/cases/${caseId}/deadlines/${deadlineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (response.ok) {
        toast.success('Deadline marked as complete');
        onUpdate();
      } else {
        toast.warning('Deadline completion is unavailable in demo mode.');
      }
    } catch (error) {
      console.error('Failed to complete deadline', error);
      toast.error('Unable to update deadline in demo environment');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Critical Deadlines
            </CardTitle>
            <CardDescription>
              Track statute expirations, court dates, and internal commitments.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onUpdate} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              {creating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Saving
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  New Deadline
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <label className="text-xs font-medium text-muted-foreground">Deadline title</label>
              <Input
                className="mt-1 h-9"
                value={newDeadline.title}
                placeholder="e.g. Discovery cutoff"
                onChange={event => setNewDeadline(prev => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div className="rounded-lg border p-3">
              <label className="text-xs font-medium text-muted-foreground">Due date</label>
              <Input
                type="date"
                className="mt-1 h-9"
                value={newDeadline.dueDate}
                onChange={event => setNewDeadline(prev => ({ ...prev, dueDate: event.target.value }))}
              />
            </div>
            <Select
              value={newDeadline.priority}
              onValueChange={value => setNewDeadline(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(priority => (
                  <SelectItem key={priority} value={priority}>
                    <Badge className={`${PRIORITY_COLORS[priority]} uppercase`}>{priority}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-3 gap-2 rounded-lg border p-3 text-sm text-muted-foreground">
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{deadlines.length}</span>
                <span>Total</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">
                  {deadlines.filter(deadline => getStatus(deadline) === 'OVERDUE').length}
                </span>
                <span>Overdue</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">
                  {deadlines.filter(deadline => getStatus(deadline) === 'COMPLETED').length}
                </span>
                <span>Completed</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Search deadlines"
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="h-9"
            />
            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    All statuses
                  </div>
                </SelectItem>
                {['UPCOMING', 'OPEN', 'OVERDUE', 'COMPLETED'].map(status => (
                  <SelectItem key={status} value={status}>
                    <Badge className={`${STATUS_COLORS[status]} uppercase`}>{status}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={value => setPriorityFilter(value as typeof priorityFilter)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    All priorities
                  </div>
                </SelectItem>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(priority => (
                  <SelectItem key={priority} value={priority}>
                    <Badge className={`${PRIORITY_COLORS[priority]} uppercase`}>{priority}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded-lg border p-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <TimerReset className="h-4 w-4" />
                <span>Next deadline:</span>
              </div>
              <div className="mt-1 font-medium text-gray-900">
                {computedDeadlines[0]
                  ? `${computedDeadlines[0].title} (${format(new Date(computedDeadlines[0].dueDate), 'MMM d, yyyy')})`
                  : 'No upcoming deadlines'}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computedDeadlines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                      No deadlines match the current filters.
                    </TableCell>
                  </TableRow>
                )}
                {computedDeadlines.map(deadline => (
                  <TableRow key={deadline.id}>
                    <TableCell className="font-medium text-gray-900">{deadline.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {deadline.dueDate ? format(new Date(deadline.dueDate), 'MMM d, yyyy') : 'TBD'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_COLORS[deadline.computedStatus]} uppercase`}>
                        {deadline.computedStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${PRIORITY_COLORS[deadline.priority?.toUpperCase() || 'MEDIUM']} uppercase`}>
                        {deadline.priority?.toUpperCase() || 'MEDIUM'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleComplete(deadline.id)}
                          disabled={deadline.computedStatus === 'COMPLETED'}
                        >
                          <Check className="h-4 w-4" />
                          Complete
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          Dismiss
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
