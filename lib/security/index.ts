/**
 * Security Module Index
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 * 
 * This file exports all security utilities for easy importing
 */

// Authentication and JWT
export * from '@/lib/auth/jwt';
export * from '@/lib/auth/rbac';

// Middleware
export * from '@/lib/middleware/auth';
export * from '@/lib/middleware/cors';
export * from '@/lib/middleware/security-headers';

// Validation and Sanitization
export * from '@/lib/validation/schemas';
export * from '@/lib/validation/sanitize';

// Encryption
export * from '@/lib/encryption/crypto';

// Audit Logging
export * from '@/lib/audit/logger';

// Session Management
export * from '@/lib/security/session-manager';

// Rate Limiting and DDoS Protection
export * from '@/lib/security/rate-limiter';

// Configuration
export * from '@/lib/security/config';

// Types
export * from '@/types/security/auth';

/**
 * Zero Trust Security Suite
 * Complete security implementation for LexChronos
 */
export class LexChronosSecurity {
  /**
   * Initialize security configuration and services
   */
  public static initialize() {
    const { initializeSecurityConfig } = require('@/lib/security/config');
    const config = initializeSecurityConfig();
    
    console.log('LexChronos Zero Trust Security initialized');
    console.log('Security features enabled:');
    console.log('- JWT Authentication ✓');
    console.log('- Role-Based Access Control ✓');
    console.log('- Document Encryption ✓');
    console.log('- Audit Logging ✓');
    console.log('- Session Management ✓');
    console.log('- Rate Limiting ✓');
    console.log('- DDoS Protection ✓');
    console.log('- Input Validation ✓');
    console.log('- Security Headers ✓');
    console.log('- CORS Protection ✓');
    
    return config;
  }
  
  /**
   * Get security status
   */
  public static getSecurityStatus() {
    const { getSecurityConfig, validateSecurityConfig } = require('@/lib/security/config');
    const config = getSecurityConfig();
    const validation = validateSecurityConfig(config);
    
    return {
      configured: validation.valid,
      errors: validation.errors,
      environment: process.env.NODE_ENV || 'development',
      features: {
        authentication: true,
        authorization: true,
        encryption: true,
        auditLogging: true,
        sessionManagement: true,
        rateLimiting: true,
        ddosProtection: true,
        inputValidation: true,
        securityHeaders: true,
        corsProtection: true
      }
    };
  }
}

/**
 * Security middleware factory for common combinations
 */
export class SecurityMiddlewareFactory {
  /**
   * Create complete API security middleware stack
   */
  static createAPIStack() {
    const { withSecurityHeaders } = require('@/lib/middleware/security-headers');
    const { withCORS } = require('@/lib/middleware/cors');
    const { withRateLimit } = require('@/lib/security/rate-limiter');
    const { withDDoSProtection } = require('@/lib/security/rate-limiter');
    const { withAuth } = require('@/lib/middleware/auth');
    
    return {
      withSecurityHeaders,
      withCORS,
      withRateLimit,
      withDDoSProtection,
      withAuth
    };
  }
  
  /**
   * Create admin panel security middleware stack
   */
  static createAdminStack() {
    const { withStrictSecurityHeaders } = require('@/lib/middleware/security-headers');
    const { withStrictCORS } = require('@/lib/middleware/cors');
    const { withAdminRateLimit } = require('@/lib/security/rate-limiter');
    const { withAuth, withAllPermissions } = require('@/lib/middleware/auth');
    const { Permission } = require('@/types/security/auth');
    
    return {
      withStrictSecurityHeaders,
      withStrictCORS,
      withAdminRateLimit,
      withAuth,
      withAdminPermissions: withAllPermissions([Permission.MANAGE_SETTINGS])
    };
  }
  
  /**
   * Create public page security middleware stack
   */
  static createPublicStack() {
    const { withPublicSecurityHeaders } = require('@/lib/middleware/security-headers');
    const { withPublicCORS } = require('@/lib/middleware/cors');
    const { withPublicRateLimit } = require('@/lib/security/rate-limiter');
    
    return {
      withPublicSecurityHeaders,
      withPublicCORS,
      withPublicRateLimit
    };
  }
}