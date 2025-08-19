/**
 * Admin Middleware for LexChronos
 * Zero Trust Security Implementation for Admin Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { hasPermission } from '@/lib/auth/rbac';
import { UserRole, Permission } from '@/types/security/auth';

/**
 * Admin middleware to protect admin routes
 */
export async function adminMiddleware(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          message: 'Admin access requires authentication' 
        },
        { status: 401 }
      );
    }

    // Verify JWT token
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        { 
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
          message: 'Authentication token is invalid or expired' 
        },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    const isAdmin = payload.role === UserRole.SUPER_ADMIN || 
                   payload.role === UserRole.FIRM_ADMIN;

    if (!isAdmin) {
      return NextResponse.json(
        { 
          error: 'Insufficient privileges',
          code: 'INSUFFICIENT_PRIVILEGES',
          message: 'Admin access is required for this resource' 
        },
        { status: 403 }
      );
    }

    // Route-specific permission checks
    const pathname = request.nextUrl.pathname;
    const requiredPermission = getRequiredPermissionForRoute(pathname);
    
    if (requiredPermission && !hasPermission(payload, requiredPermission)) {
      return NextResponse.json(
        { 
          error: 'Permission denied',
          code: 'PERMISSION_DENIED',
          message: `Missing required permission: ${requiredPermission}` 
        },
        { status: 403 }
      );
    }

    // Add user info to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set('X-User-ID', payload.userId);
    response.headers.set('X-User-Role', payload.role);
    response.headers.set('X-Firm-ID', payload.firmId || '');

    return response;

  } catch (error) {
    console.error('Admin middleware error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication error',
        code: 'AUTH_ERROR',
        message: 'An error occurred during authentication' 
      },
      { status: 500 }
    );
  }
}

/**
 * Get required permission for specific admin routes
 */
function getRequiredPermissionForRoute(pathname: string): Permission | null {
  const routePermissions: Record<string, Permission> = {
    '/admin/users': Permission.READ_USER,
    '/admin/organizations': Permission.READ_USER,
    '/admin/settings': Permission.MANAGE_SETTINGS,
    '/admin/analytics': Permission.VIEW_AUDIT_LOGS,
    '/admin/support': Permission.VIEW_AUDIT_LOGS,
    '/admin/billing': Permission.MANAGE_BILLING,
  };

  // Check for specific route patterns
  for (const [route, permission] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route)) {
      return permission;
    }
  }

  // Default admin routes require basic admin access
  if (pathname.startsWith('/admin')) {
    return Permission.READ_USER; // Basic admin permission
  }

  return null;
}

/**
 * Check if user can perform specific admin actions
 */
export function canPerformAdminAction(
  userRole: UserRole, 
  action: 'create' | 'read' | 'update' | 'delete',
  resource: 'user' | 'organization' | 'settings' | 'billing'
): boolean {
  // Super admins can do everything
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Firm admins have limited permissions
  if (userRole === UserRole.FIRM_ADMIN) {
    // Can manage users within their firm
    if (resource === 'user') {
      return ['create', 'read', 'update'].includes(action);
    }
    
    // Can view organization settings but not modify system-wide settings
    if (resource === 'organization') {
      return ['read', 'update'].includes(action);
    }
    
    // Can view billing but not modify system billing settings
    if (resource === 'billing') {
      return action === 'read';
    }
    
    // Cannot modify system settings
    if (resource === 'settings') {
      return action === 'read';
    }
  }

  return false;
}

/**
 * Validate firm-level access for firm admins
 */
export function validateFirmAccess(
  userRole: UserRole,
  userFirmId: string | undefined,
  targetFirmId: string | undefined
): boolean {
  // Super admins can access any firm
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Firm admins can only access their own firm
  if (userRole === UserRole.FIRM_ADMIN) {
    return userFirmId === targetFirmId;
  }

  return false;
}

/**
 * Admin route configuration
 */
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  USERS: '/admin/users',
  ORGANIZATIONS: '/admin/organizations',
  SETTINGS: '/admin/settings',
  ANALYTICS: '/admin/analytics',
  SUPPORT: '/admin/support',
  BILLING: '/admin/billing',
} as const;

/**
 * Check if a path is an admin route
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

/**
 * Get admin navigation items based on user role
 */
export function getAdminNavItems(userRole: UserRole) {
  const baseItems = [
    {
      title: 'Dashboard',
      href: ADMIN_ROUTES.DASHBOARD,
      permission: Permission.READ_USER,
    },
    {
      title: 'Users',
      href: ADMIN_ROUTES.USERS,
      permission: Permission.READ_USER,
    },
    {
      title: 'Organizations',
      href: ADMIN_ROUTES.ORGANIZATIONS,
      permission: Permission.READ_USER,
    },
  ];

  const superAdminItems = [
    {
      title: 'System Settings',
      href: ADMIN_ROUTES.SETTINGS,
      permission: Permission.MANAGE_SETTINGS,
    },
    {
      title: 'Analytics',
      href: ADMIN_ROUTES.ANALYTICS,
      permission: Permission.VIEW_AUDIT_LOGS,
    },
    {
      title: 'Support',
      href: ADMIN_ROUTES.SUPPORT,
      permission: Permission.VIEW_AUDIT_LOGS,
    },
    {
      title: 'Billing',
      href: ADMIN_ROUTES.BILLING,
      permission: Permission.MANAGE_BILLING,
    },
  ];

  // Return appropriate items based on role
  if (userRole === UserRole.SUPER_ADMIN) {
    return [...baseItems, ...superAdminItems];
  }

  if (userRole === UserRole.FIRM_ADMIN) {
    return [
      ...baseItems,
      {
        title: 'Analytics',
        href: ADMIN_ROUTES.ANALYTICS,
        permission: Permission.VIEW_AUDIT_LOGS,
      },
    ];
  }

  return baseItems;
}