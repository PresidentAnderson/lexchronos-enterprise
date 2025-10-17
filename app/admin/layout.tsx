"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Scale,
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  BarChart3,
  HeadphonesIcon,
  CreditCard,
  Menu,
  Bell,
  Search,
  LogOut,
  User,
  Shield,
  ChevronLeft,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/security/auth';

// Mock user data - in real app, this would come from auth context
const mockAdminUser = {
  name: 'Admin User',
  email: 'admin@lexchronos.com',
  role: UserRole.SUPER_ADMIN,
  avatar: null,
};

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  permission?: string;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'System overview and key metrics',
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users and permissions',
    badge: { text: '125', variant: 'secondary' }
  },
  {
    title: 'Organizations',
    href: '/admin/organizations',
    icon: Building2,
    description: 'Law firms and their subscriptions',
    badge: { text: '12', variant: 'secondary' }
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Revenue and usage analytics',
  },
  {
    title: 'Support',
    href: '/admin/support',
    icon: HeadphonesIcon,
    description: 'Support tickets and system logs',
    badge: { text: '3', variant: 'destructive' }
  },
  {
    title: 'Billing',
    href: '/admin/billing',
    icon: CreditCard,
    description: 'Invoices and payment processing',
  },
  {
    title: 'Priority Offences',
    href: '/admin/priority-offences',
    icon: ShieldAlert,
    description: 'Monitor G1–G12 coverage, risk, and automation signals',
    badge: { text: 'New', variant: 'outline' }
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System configuration and settings',
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // Check if user has admin permissions (in real app, this would be from auth context)
  const isAdmin = mockAdminUser.role === UserRole.SUPER_ADMIN || mockAdminUser.role === UserRole.FIRM_ADMIN;

  // Redirect non-admin users (in real app)
  useEffect(() => {
    if (!isAdmin) {
      // window.location.href = '/dashboard';
    }
  }, [isAdmin]);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">LexChronos</span>
          <Badge variant="outline" className="ml-2 text-xs">
            Admin
          </Badge>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge variant={item.badge.variant} className="ml-auto text-xs">
                  {item.badge.text}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
            {mockAdminUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{mockAdminUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{mockAdminUser.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link 
              href="/" 
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to App
            </Link>
            <span className="text-muted-foreground">•</span>
            <span className="font-medium">Admin Panel</span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* Search */}
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {notifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {notifications}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>

            {/* System Status */}
            <div className="hidden md:flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">All systems operational</span>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {mockAdminUser.avatar ? (
                      <img
                        src={mockAdminUser.avatar}
                        alt={mockAdminUser.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {mockAdminUser.name.charAt(0)}
                      </span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {mockAdminUser.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {mockAdminUser.email}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="h-3 w-3 text-primary" />
                      <span className="text-xs text-primary font-medium">
                        {mockAdminUser.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    <span>Back to Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Admin Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}