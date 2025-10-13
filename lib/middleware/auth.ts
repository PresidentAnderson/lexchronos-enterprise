/**
 * Authentication Middleware
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { hasPermission, checkResourceAccess } from '@/lib/auth/rbac';
import { logSecurityEvent } from '@/lib/audit/logger';
import { Permission, SecurityEventType, SecurityEventSeverity, JWTPayload } from '@/types/security/auth';

/**
 * Authentication middleware to verify JWT tokens
 */
export function withAuth(handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader || '');

      if (!token) {
        await logSecurityEvent({
          eventType: SecurityEventType.PERMISSION_DENIED,
          severity: SecurityEventSeverity.MEDIUM,
          ipAddress: getClientIP(req),
          userAgent: req.headers.get('user-agent') || '',
          metadata: { reason: 'No token provided', path: req.nextUrl.pathname }
        });

        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const user = verifyAccessToken(token);
      if (!user) {
        await logSecurityEvent({
          eventType: SecurityEventType.PERMISSION_DENIED,
          severity: SecurityEventSeverity.HIGH,
          ipAddress: getClientIP(req),
          userAgent: req.headers.get('user-agent') || '',
          metadata: { reason: 'Invalid token', path: req.nextUrl.pathname }
        });

        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Verify user is still active (Zero Trust principle)
      if (!await isUserActive(user.userId)) {
        await logSecurityEvent({
          eventType: SecurityEventType.PERMISSION_DENIED,
          severity: SecurityEventSeverity.HIGH,
          userId: user.userId,
          ipAddress: getClientIP(req),
          userAgent: req.headers.get('user-agent') || '',
          metadata: { reason: 'User account inactive', path: req.nextUrl.pathname }
        });

        return NextResponse.json(
          { error: 'Account is inactive' },
          { status: 401 }
        );
      }

      return handler(req, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      await logSecurityEvent({
        eventType: SecurityEventType.PERMISSION_DENIED,
        severity: SecurityEventSeverity.CRITICAL,
        ipAddress: getClientIP(req),
        userAgent: req.headers.get('user-agent') || '',
        metadata: { error: String(error), path: req.nextUrl.pathname }
      });

      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Authorization middleware to check permissions
 */
export function withPermission(permission: Permission) {
  return function (handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
    return withAuth(async (req: NextRequest, user: JWTPayload) => {
      if (!hasPermission(user, permission)) {
        await logSecurityEvent({
          eventType: SecurityEventType.PERMISSION_DENIED,
          severity: SecurityEventSeverity.MEDIUM,
          userId: user.userId,
          ipAddress: getClientIP(req),
          userAgent: req.headers.get('user-agent') || '',
          metadata: { 
            requiredPermission: permission, 
            userRole: user.role,
            path: req.nextUrl.pathname 
          }
        });

        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req, user);
    });
  };
}

/**
 * Resource-based authorization middleware
 */
export function withResourceAccess(resource: string, action: string) {
  return function (handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
    return withAuth(async (req: NextRequest, user: JWTPayload) => {
      // Extract resource conditions from request
      const conditions = await extractResourceConditions(req, resource, action);

      if (!checkResourceAccess(user, resource, action, conditions)) {
        await logSecurityEvent({
          eventType: SecurityEventType.PERMISSION_DENIED,
          severity: SecurityEventSeverity.MEDIUM,
          userId: user.userId,
          ipAddress: getClientIP(req),
          userAgent: req.headers.get('user-agent') || '',
          metadata: { 
            resource, 
            action, 
            conditions,
            userRole: user.role,
            path: req.nextUrl.pathname 
          }
        });

        return NextResponse.json(
          { error: 'Access denied to this resource' },
          { status: 403 }
        );
      }

      return handler(req, user);
    });
  };
}

/**
 * Multiple permissions middleware (user must have ALL permissions)
 */
export function withAllPermissions(permissions: Permission[]) {
  return function (handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
    return withAuth(async (req: NextRequest, user: JWTPayload) => {
      const missingPermissions = permissions.filter(permission => !hasPermission(user, permission));
      
      if (missingPermissions.length > 0) {
        await logSecurityEvent({
          eventType: SecurityEventType.PERMISSION_DENIED,
          severity: SecurityEventSeverity.MEDIUM,
          userId: user.userId,
          ipAddress: getClientIP(req),
          userAgent: req.headers.get('user-agent') || '',
          metadata: { 
            requiredPermissions: permissions,
            missingPermissions,
            userRole: user.role,
            path: req.nextUrl.pathname 
          }
        });

        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req, user);
    });
  };
}

/**
 * Any permission middleware (user must have AT LEAST ONE permission)
 */
export function withAnyPermission(permissions: Permission[]) {
  return function (handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
    return withAuth(async (req: NextRequest, user: JWTPayload) => {
      const hasAnyPermission = permissions.some(permission => hasPermission(user, permission));
      
      if (!hasAnyPermission) {
        await logSecurityEvent({
          eventType: SecurityEventType.PERMISSION_DENIED,
          severity: SecurityEventSeverity.MEDIUM,
          userId: user.userId,
          ipAddress: getClientIP(req),
          userAgent: req.headers.get('user-agent') || '',
          metadata: { 
            requiredPermissions: permissions,
            userRole: user.role,
            path: req.nextUrl.pathname 
          }
        });

        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req, user);
    });
  };
}

/**
 * Firm isolation middleware - ensures users can only access their firm's data
 */
export function withFirmIsolation(handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return withAuth(async (req: NextRequest, user: JWTPayload) => {
    if (!user.firmId) {
      await logSecurityEvent({
        eventType: SecurityEventType.PERMISSION_DENIED,
        severity: SecurityEventSeverity.HIGH,
        userId: user.userId,
        ipAddress: getClientIP(req),
        userAgent: req.headers.get('user-agent') || '',
        metadata: { reason: 'User not associated with any firm', path: req.nextUrl.pathname }
      });

      return NextResponse.json(
        { error: 'User not associated with any firm' },
        { status: 403 }
      );
    }

    // Add firm ID to the request for downstream handlers to use
    const requestWithFirm = req.clone();
    (requestWithFirm as any).firmId = user.firmId;

    return handler(requestWithFirm, user);
  });
}

/**
 * Rate limiting check middleware
 */
export function withRateLimit(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return function (handler: (req: NextRequest, user?: JWTPayload) => Promise<NextResponse>) {
    return async (req: NextRequest, user?: JWTPayload) => {
      const clientIP = getClientIP(req);
      const key = user ? `user:${user.userId}` : `ip:${clientIP}`;
      const now = Date.now();
      
      const current = attempts.get(key);
      
      if (current && now < current.resetTime) {
        if (current.count >= maxRequests) {
          await logSecurityEvent({
            eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
            severity: SecurityEventSeverity.MEDIUM,
            userId: user?.userId,
            ipAddress: clientIP,
            userAgent: req.headers.get('user-agent') || '',
            metadata: { 
              attempts: current.count, 
              limit: maxRequests, 
              windowMs,
              path: req.nextUrl.pathname 
            }
          });

          return NextResponse.json(
            { error: 'Rate limit exceeded', retryAfter: Math.ceil((current.resetTime - now) / 1000) },
            { status: 429, headers: { 'Retry-After': String(Math.ceil((current.resetTime - now) / 1000)) } }
          );
        }
        current.count++;
      } else {
        attempts.set(key, { count: 1, resetTime: now + windowMs });
      }

      return handler(req, user);
    };
  };
}

/**
 * Extract client IP address from request
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }

  return req.ip || 'unknown';
}

/**
 * Check if user account is still active
 */
async function isUserActive(userId: string): Promise<boolean> {
  // This would typically query your database
  // For now, return true - implement with your user service
  try {
    // TODO: Implement database query
    // const user = await getUserById(userId);
    // return user?.isActive === true && !user.lockedUntil || user.lockedUntil < new Date();
    return true;
  } catch (error) {
    console.error('Error checking user active status:', error);
    return false;
  }
}

/**
 * Extract resource-specific conditions from request
 */
async function extractResourceConditions(req: NextRequest, resource: string, action: string): Promise<Record<string, any>> {
  const conditions: Record<string, any> = {};

  // Extract conditions from URL parameters
  const url = new URL(req.url);
  
  // Common resource identifiers
  if (url.searchParams.get('caseId')) {
    conditions.caseId = url.searchParams.get('caseId');
  }
  
  if (url.searchParams.get('documentId')) {
    conditions.documentId = url.searchParams.get('documentId');
  }
  
  if (url.searchParams.get('firmId')) {
    conditions.firmId = url.searchParams.get('firmId');
  }

  // Extract from request body for POST/PUT requests
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const body = await req.json();
      if (body.firmId) conditions.firmId = body.firmId;
      if (body.caseId) conditions.caseId = body.caseId;
      if (body.ownerId) conditions.ownerId = body.ownerId;
    } catch (error) {
      // Body might not be JSON or might be consumed already
    }
  }

  return conditions;
}