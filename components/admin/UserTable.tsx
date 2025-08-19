"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/security/auth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  firmId?: string;
  firmName?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  loginAttempts: number;
  mfaEnabled: boolean;
}

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  onUserEdit?: (user: User) => void;
  onUserToggleStatus?: (userId: string, isActive: boolean) => void;
  onUserChangeRole?: (userId: string, role: UserRole) => void;
  onUserResetPassword?: (userId: string) => void;
  currentUserRole?: UserRole;
  className?: string;
}

const getRoleBadgeColor = (role: UserRole): string => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'bg-red-100 text-red-800 border-red-200';
    case UserRole.FIRM_ADMIN:
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case UserRole.SENIOR_LAWYER:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case UserRole.LAWYER:
      return 'bg-green-100 text-green-800 border-green-200';
    case UserRole.PARALEGAL:
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case UserRole.CLIENT:
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatDate = (date: Date | undefined): string => {
  if (!date) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'Super Admin';
    case UserRole.FIRM_ADMIN:
      return 'Firm Admin';
    case UserRole.SENIOR_LAWYER:
      return 'Senior Lawyer';
    case UserRole.LAWYER:
      return 'Lawyer';
    case UserRole.PARALEGAL:
      return 'Paralegal';
    case UserRole.CLIENT:
      return 'Client';
    case UserRole.GUEST:
      return 'Guest';
    default:
      return role;
  }
};

export function UserTable({
  users,
  isLoading = false,
  onUserEdit,
  onUserToggleStatus,
  onUserChangeRole,
  onUserResetPassword,
  currentUserRole = UserRole.FIRM_ADMIN,
  className
}: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firmName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const canEditUser = (user: User): boolean => {
    if (currentUserRole === UserRole.SUPER_ADMIN) return true;
    if (currentUserRole === UserRole.FIRM_ADMIN) {
      return user.role !== UserRole.SUPER_ADMIN;
    }
    return false;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-32" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                </div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage users, roles, and permissions across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[120px]">
                <Filter className="mr-2 h-4 w-4" />
                Role: {roleFilter === 'all' ? 'All' : getRoleDisplayName(roleFilter)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setRoleFilter('all')}>
                All Roles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.values(UserRole).map((role) => (
                <DropdownMenuItem key={role} onClick={() => setRoleFilter(role)}>
                  {getRoleDisplayName(role)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[120px]">
                <Filter className="mr-2 h-4 w-4" />
                Status: {statusFilter === 'all' ? 'All' : statusFilter === 'active' ? 'Active' : 'Inactive'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                Active Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                Inactive Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <span className="text-sm font-medium">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </h4>
                      {user.mfaEnabled && (
                        <Shield className="h-3 w-3 text-green-600" title="MFA Enabled" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                      {user.firmName && (
                        <>
                          <span>•</span>
                          <Building className="h-3 w-3" />
                          <span>{user.firmName}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Last login: {formatDate(user.lastLogin)}</span>
                    </div>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center space-x-3">
                  {/* Role Badge */}
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getRoleBadgeColor(user.role))}
                  >
                    {getRoleDisplayName(user.role)}
                  </Badge>

                  {/* Status */}
                  <div className="flex items-center space-x-1">
                    {user.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={cn(
                      "text-xs",
                      user.isActive ? "text-green-600" : "text-red-600"
                    )}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Actions Menu */}
                  {canEditUser(user) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {onUserEdit && (
                          <DropdownMenuItem onClick={() => onUserEdit(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                        )}
                        
                        {onUserToggleStatus && (
                          <DropdownMenuItem 
                            onClick={() => onUserToggleStatus(user.id, !user.isActive)}
                          >
                            {user.isActive ? (
                              <>
                                <Ban className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        
                        {onUserResetPassword && (
                          <DropdownMenuItem onClick={() => onUserResetPassword(user.id)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </CardContent>
    </Card>
  );
}