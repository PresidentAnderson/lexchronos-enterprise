'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Clock, Search, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface ConflictCheck {
  id: string;
  checkType: string;
  status: string;
  conflictLevel: string;
  searchTerms: string[];
  createdAt: string;
  performedBy: {
    firstName: string;
    lastName: string;
  };
  case?: {
    caseNumber: string;
    title: string;
    clientName: string;
  };
  entity?: {
    name: string;
    type: string;
  };
  potentialConflicts: any[];
}

export function ConflictCheckHistory() {
  const [checks, setChecks] = useState<ConflictCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadChecks();
  }, [page, statusFilter, levelFilter]);

  const loadChecks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
      });

      if (statusFilter) params.append('status', statusFilter);
      if (levelFilter) params.append('level', levelFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/conflicts/check?${params}`);
      if (response.ok) {
        const data = await response.json();
        setChecks(data.checks);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading conflict checks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { variant: 'secondary' as const, icon: Clock },
      IN_PROGRESS: { variant: 'secondary' as const, icon: Clock },
      CLEARED: { variant: 'success' as const, icon: CheckCircle },
      CONFLICT_IDENTIFIED: { variant: 'destructive' as const, icon: AlertTriangle },
      WAIVER_REQUIRED: { variant: 'secondary' as const, icon: AlertTriangle },
      WAIVER_OBTAINED: { variant: 'outline' as const, icon: CheckCircle },
      DECLINED: { variant: 'outline' as const, icon: AlertTriangle },
    };

    const { variant, icon: Icon } = config[status as keyof typeof config] || { variant: 'secondary' as const, icon: Clock };

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getConflictLevelBadge = (level: string) => {
    const config = {
      NONE: { variant: 'outline' as const, color: 'text-gray-500' },
      LOW: { variant: 'secondary' as const, color: 'text-yellow-600' },
      MEDIUM: { variant: 'secondary' as const, color: 'text-orange-600' },
      HIGH: { variant: 'destructive' as const, color: 'text-red-600' },
      CRITICAL: { variant: 'destructive' as const, color: 'text-red-700' },
    };

    const { variant, color } = config[level as keyof typeof config] || { variant: 'secondary' as const, color: 'text-gray-500' };

    return (
      <Badge variant={variant} className={color}>
        {level}
      </Badge>
    );
  };

  const handleSearch = () => {
    setPage(1);
    loadChecks();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setLevelFilter('');
    setPage(1);
    loadChecks();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conflict Check History</CardTitle>
        <CardDescription>
          Review all performed conflict checks and their results
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by case, client, or entity name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="CLEARED">Cleared</SelectItem>
              <SelectItem value="CONFLICT_IDENTIFIED">Conflict Found</SelectItem>
              <SelectItem value="WAIVER_REQUIRED">Waiver Required</SelectItem>
              <SelectItem value="WAIVER_OBTAINED">Waiver Obtained</SelectItem>
              <SelectItem value="DECLINED">Declined</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Levels</SelectItem>
              <SelectItem value="NONE">No Conflict</SelectItem>
              <SelectItem value="LOW">Low Risk</SelectItem>
              <SelectItem value="MEDIUM">Medium Risk</SelectItem>
              <SelectItem value="HIGH">High Risk</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button onClick={resetFilters} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Conflicts</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    Loading conflict checks...
                  </TableCell>
                </TableRow>
              ) : checks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    No conflict checks found
                  </TableCell>
                </TableRow>
              ) : (
                checks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(check.createdAt), 'MMM d, yyyy')}</div>
                        <div className="text-muted-foreground">
                          {format(new Date(check.createdAt), 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {check.checkType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {check.case && (
                          <div className="text-sm font-medium">
                            {check.case.caseNumber} - {check.case.clientName}
                          </div>
                        )}
                        {check.entity && (
                          <div className="text-sm font-medium">
                            {check.entity.name} ({check.entity.type})
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Terms: {check.searchTerms.join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(check.status)}
                    </TableCell>
                    <TableCell>
                      {getConflictLevelBadge(check.conflictLevel)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {check.potentialConflicts?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {check.performedBy.firstName} {check.performedBy.lastName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} checks
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}