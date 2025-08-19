/**
 * Rate Limiting and DDoS Protection
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 */

import { NextRequest, NextResponse } from 'next/server';
import { logSecurityEvent } from '@/lib/audit/logger';
import { SecurityEventType, SecurityEventSeverity } from '@/types/security/auth';

/**
 * Rate limit configuration for different endpoints
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests in the window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  handler?: (req: NextRequest) => Promise<NextResponse>;
  onLimitReached?: (req: NextRequest, key: string) => Promise<void>;
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

/**
 * Suspicious activity patterns
 */
interface SuspiciousActivityTracker {
  rapidRequests: Map<string, { count: number; firstRequest: number }>;
  failedLogins: Map<string, { count: number; firstRequest: number }>;
  unusualEndpoints: Map<string, { endpoints: Set<string>; count: number }>;
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication endpoints (strict)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 login attempts per 15 minutes
  },
  
  // Password reset (very strict)
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3 // 3 reset attempts per hour
  },
  
  // API endpoints (moderate)
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // 100 requests per 15 minutes
  },
  
  // Document upload (strict)
  UPLOAD: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10 // 10 uploads per 5 minutes
  },
  
  // Search endpoints (moderate)
  SEARCH: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30 // 30 searches per minute
  },
  
  // Public endpoints (lenient)
  PUBLIC: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute
  },
  
  // Admin endpoints (very strict)
  ADMIN: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20 // 20 admin actions per 5 minutes
  }
};

/**
 * Rate limiter class
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private limitStore = new Map<string, RateLimitEntry>();
  private suspiciousActivity: SuspiciousActivityTracker;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.suspiciousActivity = {
      rapidRequests: new Map(),
      failedLogins: new Map(),
      unusualEndpoints: new Map()
    };
    this.startCleanup();
  }
  
  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }
  
  /**
   * Check if request should be rate limited
   */
  public async checkRateLimit(
    req: NextRequest, 
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = config.keyGenerator ? config.keyGenerator(req) : this.getDefaultKey(req);
    const now = Date.now();
    
    let entry = this.limitStore.get(key);
    
    // Initialize or reset if window has passed
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        firstRequest: now
      };
    }
    
    entry.count++;
    this.limitStore.set(key, entry);
    
    // Check for suspicious rapid requests
    await this.checkSuspiciousActivity(req, key, entry);
    
    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);
    
    if (!allowed) {
      if (config.onLimitReached) {
        await config.onLimitReached(req, key);
      } else {
        await this.defaultLimitReachedHandler(req, key, config);
      }
    }
    
    return {
      allowed,
      remaining,
      resetTime: entry.resetTime
    };
  }
  
  /**
   * Generate default key for rate limiting
   */
  private getDefaultKey(req: NextRequest): string {
    // Try to get user ID from auth header if available
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      // Extract user ID from JWT token if needed
      // For now, use IP + user agent combination
    }
    
    const ip = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    return `${ip}:${this.hashUserAgent(userAgent)}`;
  }
  
  /**
   * Get client IP address
   */
  private getClientIP(req: NextRequest): string {
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
   * Hash user agent for privacy
   */
  private hashUserAgent(userAgent: string): string {
    let hash = 0;
    for (let i = 0; i < userAgent.length; i++) {
      const char = userAgent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
  
  /**
   * Check for suspicious activity patterns
   */
  private async checkSuspiciousActivity(req: NextRequest, key: string, entry: RateLimitEntry): Promise<void> {
    const ip = this.getClientIP(req);
    const now = Date.now();
    
    // Check for rapid requests (potential bot behavior)
    if (entry.count > 10 && (now - entry.firstRequest) < 10000) { // 10 requests in 10 seconds
      await logSecurityEvent({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecurityEventSeverity.MEDIUM,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || '',
        metadata: {
          pattern: 'rapid_requests',
          count: entry.count,
          timeSpan: now - entry.firstRequest,
          path: req.nextUrl.pathname
        }
      });
    }
    
    // Track unusual endpoint access patterns
    const endpointKey = `${ip}:endpoints`;
    let endpointTracker = this.suspiciousActivity.unusualEndpoints.get(endpointKey);
    
    if (!endpointTracker) {
      endpointTracker = { endpoints: new Set(), count: 0 };
      this.suspiciousActivity.unusualEndpoints.set(endpointKey, endpointTracker);
    }
    
    endpointTracker.endpoints.add(req.nextUrl.pathname);
    endpointTracker.count++;
    
    // Alert if accessing too many different endpoints rapidly
    if (endpointTracker.endpoints.size > 20 && endpointTracker.count > 50) {
      await logSecurityEvent({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecurityEventSeverity.HIGH,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || '',
        metadata: {
          pattern: 'endpoint_scanning',
          uniqueEndpoints: endpointTracker.endpoints.size,
          totalRequests: endpointTracker.count,
          endpoints: Array.from(endpointTracker.endpoints).slice(0, 10) // Log first 10
        }
      });
    }
  }
  
  /**
   * Default handler when rate limit is reached
   */
  private async defaultLimitReachedHandler(req: NextRequest, key: string, config: RateLimitConfig): Promise<void> {
    await logSecurityEvent({
      eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: SecurityEventSeverity.MEDIUM,
      ipAddress: this.getClientIP(req),
      userAgent: req.headers.get('user-agent') || '',
      metadata: {
        key,
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        path: req.nextUrl.pathname
      }
    });
  }
  
  /**
   * Track failed authentication attempts
   */
  public async trackFailedAuth(req: NextRequest): Promise<void> {
    const ip = this.getClientIP(req);
    const now = Date.now();
    
    let failedAttempts = this.suspiciousActivity.failedLogins.get(ip);
    
    if (!failedAttempts || (now - failedAttempts.firstRequest) > 60 * 60 * 1000) { // Reset after 1 hour
      failedAttempts = { count: 0, firstRequest: now };
    }
    
    failedAttempts.count++;
    this.suspiciousActivity.failedLogins.set(ip, failedAttempts);
    
    // Alert on suspicious failed login patterns
    if (failedAttempts.count >= 10) {
      await logSecurityEvent({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecurityEventSeverity.HIGH,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || '',
        metadata: {
          pattern: 'repeated_failed_logins',
          attempts: failedAttempts.count,
          timeSpan: now - failedAttempts.firstRequest
        }
      });
    }
  }
  
  /**
   * Check if IP should be temporarily blocked
   */
  public isBlocked(req: NextRequest): boolean {
    const ip = this.getClientIP(req);
    const failedAttempts = this.suspiciousActivity.failedLogins.get(ip);
    
    // Block if more than 20 failed attempts in the last hour
    if (failedAttempts && failedAttempts.count >= 20) {
      const timeSinceFirst = Date.now() - failedAttempts.firstRequest;
      return timeSinceFirst < 60 * 60 * 1000; // 1 hour block
    }
    
    return false;
  }
  
  /**
   * Clean up expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      // Clean up rate limit entries
      for (const [key, entry] of this.limitStore.entries()) {
        if (now > entry.resetTime) {
          this.limitStore.delete(key);
        }
      }
      
      // Clean up suspicious activity tracking
      for (const [key, data] of this.suspiciousActivity.failedLogins.entries()) {
        if (now - data.firstRequest > 60 * 60 * 1000) { // 1 hour
          this.suspiciousActivity.failedLogins.delete(key);
        }
      }
      
      for (const [key, data] of this.suspiciousActivity.unusualEndpoints.entries()) {
        if (data.count === 0) { // Reset counters periodically
          this.suspiciousActivity.unusualEndpoints.delete(key);
        } else {
          data.count = Math.floor(data.count * 0.9); // Decay
        }
      }
      
    }, 5 * 60 * 1000); // Clean every 5 minutes
  }
  
  /**
   * Shutdown cleanup
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  config: Partial<RateLimitConfig> & { windowMs: number; maxRequests: number }
) {
  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const rateLimiter = RateLimiter.getInstance();
      
      // Check if IP is blocked
      if (rateLimiter.isBlocked(req)) {
        return NextResponse.json(
          { error: 'IP temporarily blocked due to suspicious activity' },
          { status: 429 }
        );
      }
      
      const { allowed, remaining, resetTime } = await rateLimiter.checkRateLimit(req, {
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        ...config
      });
      
      if (!allowed) {
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded', 
            retryAfter,
            limit: config.maxRequests,
            remaining: 0,
            resetTime: new Date(resetTime).toISOString()
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': resetTime.toString(),
              'Retry-After': retryAfter.toString()
            }
          }
        );
      }
      
      const response = await handler(req);
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', resetTime.toString());
      
      return response;
    };
  };
}

/**
 * Authentication rate limiting
 */
export const withAuthRateLimit = withRateLimit(RATE_LIMITS.AUTH);

/**
 * Password reset rate limiting
 */
export const withPasswordResetRateLimit = withRateLimit(RATE_LIMITS.PASSWORD_RESET);

/**
 * API rate limiting
 */
export const withAPIRateLimit = withRateLimit(RATE_LIMITS.API);

/**
 * Upload rate limiting
 */
export const withUploadRateLimit = withRateLimit(RATE_LIMITS.UPLOAD);

/**
 * Search rate limiting
 */
export const withSearchRateLimit = withRateLimit(RATE_LIMITS.SEARCH);

/**
 * Public endpoint rate limiting
 */
export const withPublicRateLimit = withRateLimit(RATE_LIMITS.PUBLIC);

/**
 * Admin rate limiting
 */
export const withAdminRateLimit = withRateLimit(RATE_LIMITS.ADMIN);

/**
 * Custom rate limiting for specific user types
 */
export function withUserTypeRateLimit(
  userTypeConfig: Record<string, { windowMs: number; maxRequests: number }>
) {
  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      // Extract user type from JWT token or session
      // For now, use default API rate limits
      const config = userTypeConfig['default'] || RATE_LIMITS.API;
      
      return withRateLimit(config)(handler)(req);
    };
  };
}

/**
 * DDoS detection and response
 */
export class DDoSProtection {
  private static instance: DDoSProtection;
  private requestCounts = new Map<string, { count: number; firstRequest: number }>();
  
  public static getInstance(): DDoSProtection {
    if (!DDoSProtection.instance) {
      DDoSProtection.instance = new DDoSProtection();
    }
    return DDoSProtection.instance;
  }
  
  /**
   * Analyze request patterns for DDoS attacks
   */
  public async analyzeRequest(req: NextRequest): Promise<{
    isDDoS: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    action: 'allow' | 'throttle' | 'block';
  }> {
    const ip = this.getClientIP(req);
    const now = Date.now();
    
    let requests = this.requestCounts.get(ip);
    
    if (!requests || (now - requests.firstRequest) > 60000) { // Reset every minute
      requests = { count: 0, firstRequest: now };
    }
    
    requests.count++;
    this.requestCounts.set(ip, requests);
    
    const requestsPerSecond = requests.count / ((now - requests.firstRequest) / 1000);
    
    // Determine severity and action based on request patterns
    if (requestsPerSecond > 100) { // More than 100 requests per second
      await logSecurityEvent({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecurityEventSeverity.CRITICAL,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || '',
        metadata: {
          pattern: 'ddos_attack_suspected',
          requestsPerSecond: Math.round(requestsPerSecond),
          totalRequests: requests.count,
          timeSpan: now - requests.firstRequest
        }
      });
      
      return { isDDoS: true, severity: 'critical', action: 'block' };
    }
    
    if (requestsPerSecond > 50) { // More than 50 requests per second
      return { isDDoS: true, severity: 'high', action: 'throttle' };
    }
    
    if (requestsPerSecond > 20) { // More than 20 requests per second
      return { isDDoS: true, severity: 'medium', action: 'throttle' };
    }
    
    return { isDDoS: false, severity: 'low', action: 'allow' };
  }
  
  private getClientIP(req: NextRequest): string {
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
}

/**
 * DDoS protection middleware
 */
export function withDDoSProtection(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ddosProtection = DDoSProtection.getInstance();
    const analysis = await ddosProtection.analyzeRequest(req);
    
    if (analysis.action === 'block') {
      return NextResponse.json(
        { error: 'Request blocked due to suspicious activity' },
        { status: 429 }
      );
    }
    
    if (analysis.action === 'throttle') {
      // Add artificial delay for throttling
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return handler(req);
  };
}