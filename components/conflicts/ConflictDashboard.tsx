'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Shield, Search, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ConflictCheckForm } from './ConflictCheckForm';
import { ConflictEntityForm } from './ConflictEntityForm';
import { ConflictCheckHistory } from './ConflictCheckHistory';
import { ConflictEntityList } from './ConflictEntityList';

interface ConflictDashboardProps {
  organizationId: string;
}

export function ConflictDashboard({ organizationId }: ConflictDashboardProps) {
  const [stats, setStats] = useState({
    totalChecks: 0,
    pendingChecks: 0,
    conflictsIdentified: 0,
    waiversPending: 0,
    entitiesCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [showCheckDialog, setShowCheckDialog] = useState(false);
  const [showEntityDialog, setShowEntityDialog] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, [organizationId]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conflicts/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading conflict stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConflictStatusColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'orange';
      case 'LOW':
        return 'yellow';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conflict Management</h1>
          <p className="text-muted-foreground">
            Manage conflict of interest checks and maintain ethical compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showEntityDialog} onOpenChange={setShowEntityDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Entity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Conflict Entity</DialogTitle>
                <DialogDescription>
                  Add a new entity to the conflict database for checking against future matters.
                </DialogDescription>
              </DialogHeader>
              <ConflictEntityForm 
                onSuccess={() => {
                  setShowEntityDialog(false);
                  loadDashboardStats();
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showCheckDialog} onOpenChange={setShowCheckDialog}>
            <DialogTrigger asChild>
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Run Conflict Check
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Perform Conflict Check</DialogTitle>
                <DialogDescription>
                  Run a comprehensive conflict of interest check for a new matter, client, or entity.
                </DialogDescription>
              </DialogHeader>
              <ConflictCheckForm 
                onSuccess={() => {
                  setShowCheckDialog(false);
                  loadDashboardStats();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChecks}</div>
            <p className="text-xs text-muted-foreground">
              Conflict checks performed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingChecks}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflicts Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conflictsIdentified}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waivers Needed</CardTitle>
            <XCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waiversPending}</div>
            <p className="text-xs text-muted-foreground">
              Client waivers pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entities</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.entitiesCount}</div>
            <p className="text-xs text-muted-foreground">
              In conflict database
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="checks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checks">Conflict Checks</TabsTrigger>
          <TabsTrigger value="entities">Entity Database</TabsTrigger>
          <TabsTrigger value="waivers">Waivers</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="checks" className="space-y-4">
          <ConflictCheckHistory />
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <ConflictEntityList />
        </TabsContent>

        <TabsContent value="waivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Waivers</CardTitle>
              <CardDescription>
                Manage client conflict waivers and informed consent documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Waiver management interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conflict Reports</CardTitle>
              <CardDescription>
                Generate reports and analytics on conflict checking activities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Conflict reporting interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}