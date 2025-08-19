"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserTable } from '@/components/admin/UserTable';
import { MetricCard } from '@/components/admin/MetricCard';
import {
  Users,
  UserPlus,
  Download,
  Upload,
  Filter,
  Search,
  Shield,
  AlertTriangle,
  CheckCircle,
  Mail,
  Calendar
} from 'lucide-react';
import { UserRole } from '@/types/security/auth';

// Mock user data
const generateMockUsers = (count: number) => {
  const roles = Object.values(UserRole);
  const firmNames = ['Smith & Associates', 'Johnson Law Group', 'Brown Legal', 'Davis & Partners', 'Wilson LLC'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    email: `user${i + 1}@example.com`,
    firstName: `First${i + 1}`,
    lastName: `Last${i + 1}`,
    role: roles[Math.floor(Math.random() * roles.length)],
    firmId: `firm-${Math.floor(Math.random() * 5) + 1}`,
    firmName: firmNames[Math.floor(Math.random() * firmNames.length)],
    isActive: Math.random() > 0.2, // 80% active
    lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    loginAttempts: Math.floor(Math.random() * 3),
    mfaEnabled: Math.random() > 0.4 // 60% have MFA
  }));
};

interface NewUserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  firmId?: string;
  sendInvite: boolean;
}

export default function UsersManagement() {
  const [users, setUsers] = useState(generateMockUsers(125));
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUserForm, setNewUserForm] = useState<NewUserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: UserRole.CLIENT,
    firmId: undefined,
    sendInvite: true
  });

  // Calculate user metrics
  const userMetrics = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    newThisMonth: users.filter(u => {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return u.createdAt > monthAgo;
    }).length,
    mfaEnabled: users.filter(u => u.mfaEnabled).length,
    recentLogin: users.filter(u => {
      if (!u.lastLogin) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return u.lastLogin > weekAgo;
    }).length
  };

  const roleDistribution = Object.values(UserRole).map(role => ({
    role,
    count: users.filter(u => u.role === role).length,
    percentage: (users.filter(u => u.role === role).length / users.length * 100).toFixed(1)
  }));

  const handleCreateUser = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser = {
      id: `user-${users.length + 1}`,
      ...newUserForm,
      firmName: 'New Law Firm',
      isActive: true,
      lastLogin: undefined,
      createdAt: new Date(),
      loginAttempts: 0,
      mfaEnabled: false
    };
    
    setUsers([newUser, ...users]);
    setNewUserForm({
      email: '',
      firstName: '',
      lastName: '',
      role: UserRole.CLIENT,
      firmId: undefined,
      sendInvite: true
    });
    setShowCreateDialog(false);
    setIsLoading(false);
  };

  const handleUserEdit = (user: any) => {
    setSelectedUser(user);
    // In real app, open edit dialog
    console.log('Edit user:', user);
  };

  const handleUserToggleStatus = async (userId: string, isActive: boolean) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUsers(users.map(user => 
      user.id === userId ? { ...user, isActive } : user
    ));
    setIsLoading(false);
  };

  const handleUserResetPassword = async (userId: string) => {
    // Simulate password reset
    console.log('Reset password for user:', userId);
    // In real app, send password reset email
  };

  const handleBulkExport = () => {
    // In real app, export user data
    console.log('Exporting user data...');
  };

  const handleBulkImport = () => {
    // In real app, open import dialog
    console.log('Opening bulk import...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions across the platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleBulkExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handleBulkImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. They will receive an invitation email.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUserForm.firstName}
                      onChange={(e) => setNewUserForm({...newUserForm, firstName: e.target.value})}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUserForm.lastName}
                      onChange={(e) => setNewUserForm({...newUserForm, lastName: e.target.value})}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUserForm.role}
                    onValueChange={(value: UserRole) => setNewUserForm({...newUserForm, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRole).map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendInvite"
                    checked={newUserForm.sendInvite}
                    onChange={(e) => setNewUserForm({...newUserForm, sendInvite: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="sendInvite" className="text-sm">
                    Send invitation email
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreateUser} disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* User Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={userMetrics.total}
          format="number"
          icon={Users}
          description={`${userMetrics.active} active, ${userMetrics.inactive} inactive`}
        />
        <MetricCard
          title="New This Month"
          value={userMetrics.newThisMonth}
          format="number"
          icon={UserPlus}
          description="New user registrations"
        />
        <MetricCard
          title="MFA Enabled"
          value={`${((userMetrics.mfaEnabled / userMetrics.total) * 100).toFixed(1)}%`}
          icon={Shield}
          description={`${userMetrics.mfaEnabled} of ${userMetrics.total} users`}
        />
        <MetricCard
          title="Recent Activity"
          value={userMetrics.recentLogin}
          format="number"
          icon={Calendar}
          description="Logged in last 7 days"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="roles">Role Distribution</TabsTrigger>
          <TabsTrigger value="security">Security Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserTable
            users={users}
            isLoading={isLoading}
            onUserEdit={handleUserEdit}
            onUserToggleStatus={handleUserToggleStatus}
            onUserResetPassword={handleUserResetPassword}
            currentUserRole={UserRole.SUPER_ADMIN}
          />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
              <CardDescription>
                Breakdown of users by role across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleDistribution.map(({ role, count, percentage }) => (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {role.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {count} users ({percentage}%)
                      </span>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">MFA Adoption</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      {((userMetrics.mfaEnabled / userMetrics.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Users with Failed Logins</span>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">
                      {users.filter(u => u.loginAttempts > 0).length}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Sessions</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      {userMetrics.recentLogin}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Security Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      {users.filter(u => !u.mfaEnabled && u.role !== UserRole.CLIENT).length} admin users without MFA
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Recommend enabling MFA for admin accounts
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {users.filter(u => !u.lastLogin).length} users never logged in
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Consider resending invitation emails
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}