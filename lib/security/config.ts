/**
 * Security Configuration
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 */

import { UserRole, Permission } from '@/types/security/auth';

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  jwt: {
    secret: string;
    refreshSecret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    issuer: string;
    audience: string;
  };
  
  encryption: {
    key: string;
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
  
  session: {
    secret: string;
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  
  cors: {
    origins: string[];
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
  
  security: {
    enableCSP: boolean;
    enableHSTS: boolean;
    enableXFrameOptions: boolean;
    enableXContentTypeOptions: boolean;
    passwordMinLength: number;
    passwordRequireSpecialChar: boolean;
    passwordRequireNumber: boolean;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    mfaRequired: boolean;
  };
  
  audit: {
    enabled: boolean;
    retention: number; // days
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    destinations: string[];
  };
}

/**
 * Default security configuration
 */
export const defaultSecurityConfig: SecurityConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production',
    accessTokenExpiry: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'lexchronos',
    audience: 'lexchronos-users'
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'fallback-encryption-key-change-in-production',
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'fallback-session-secret-change-in-production',
    maxAge: 60 * 60 * 1000, // 1 hour
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false
  },
  
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  },
  
  security: {
    enableCSP: true,
    enableHSTS: process.env.NODE_ENV === 'production',
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
    passwordMinLength: 8,
    passwordRequireSpecialChar: true,
    passwordRequireNumber: true,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 60 * 60 * 1000, // 1 hour
    mfaRequired: process.env.MFA_REQUIRED === 'true'
  },
  
  audit: {
    enabled: true,
    retention: 365, // 1 year
    logLevel: process.env.LOG_LEVEL as any || 'info',
    destinations: ['database', 'console']
  }
};

/**
 * Environment-specific configurations
 */
export const environmentConfigs = {
  development: {
    ...defaultSecurityConfig,
    security: {
      ...defaultSecurityConfig.security,
      enableHSTS: false,
      mfaRequired: false
    },
    cors: {
      ...defaultSecurityConfig.cors,
      origins: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
    },
    audit: {
      ...defaultSecurityConfig.audit,
      destinations: ['console']
    }
  },
  
  staging: {
    ...defaultSecurityConfig,
    cors: {
      ...defaultSecurityConfig.cors,
      origins: ['https://staging.lexchronos.com', 'https://staging-app.lexchronos.com']
    }
  },
  
  production: {
    ...defaultSecurityConfig,
    security: {
      ...defaultSecurityConfig.security,
      mfaRequired: true,
      maxLoginAttempts: 3,
      sessionTimeout: 30 * 60 * 1000 // 30 minutes in production
    },
    cors: {
      ...defaultSecurityConfig.cors,
      origins: ['https://lexchronos.com', 'https://app.lexchronos.com']
    },
    audit: {
      ...defaultSecurityConfig.audit,
      destinations: ['database', 'external-service']
    }
  }
};

/**
 * Get security configuration based on environment
 */
export function getSecurityConfig(): SecurityConfig {
  const env = process.env.NODE_ENV || 'development';
  return environmentConfigs[env as keyof typeof environmentConfigs] || defaultSecurityConfig;
}

/**
 * Security policies per user role
 */
export const ROLE_SECURITY_POLICIES = {
  [UserRole.SUPER_ADMIN]: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    mfaRequired: true,
    ipRestrictions: false,
    auditLevel: 'detailed',
    passwordExpiryDays: 90,
    maxConcurrentSessions: 3
  },
  
  [UserRole.FIRM_ADMIN]: {
    sessionTimeout: 60 * 60 * 1000, // 1 hour
    mfaRequired: true,
    ipRestrictions: false,
    auditLevel: 'detailed',
    passwordExpiryDays: 90,
    maxConcurrentSessions: 3
  },
  
  [UserRole.SENIOR_LAWYER]: {
    sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours
    mfaRequired: false,
    ipRestrictions: false,
    auditLevel: 'standard',
    passwordExpiryDays: 120,
    maxConcurrentSessions: 2
  },
  
  [UserRole.LAWYER]: {
    sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours
    mfaRequired: false,
    ipRestrictions: false,
    auditLevel: 'standard',
    passwordExpiryDays: 120,
    maxConcurrentSessions: 2
  },
  
  [UserRole.PARALEGAL]: {
    sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours
    mfaRequired: false,
    ipRestrictions: true,
    auditLevel: 'basic',
    passwordExpiryDays: 180,
    maxConcurrentSessions: 1
  },
  
  [UserRole.CLIENT]: {
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
    mfaRequired: false,
    ipRestrictions: false,
    auditLevel: 'basic',
    passwordExpiryDays: 365,
    maxConcurrentSessions: 2
  },
  
  [UserRole.GUEST]: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    mfaRequired: false,
    ipRestrictions: true,
    auditLevel: 'minimal',
    passwordExpiryDays: 365,
    maxConcurrentSessions: 1
  }
};

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  contentSecurityPolicy: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Adjust based on needs
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'wss:', 'https:'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': []
  },
  
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  xXSSProtection: '1; mode=block',
  referrerPolicy: 'strict-origin-when-cross-origin'
};

/**
 * Compliance requirements configuration
 */
export const COMPLIANCE_CONFIG = {
  // Legal industry compliance requirements
  dataRetention: {
    auditLogs: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years in milliseconds
    documents: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    communications: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
    financialRecords: 7 * 365 * 24 * 60 * 60 * 1000 // 7 years
  },
  
  encryption: {
    documentsAtRest: true,
    documentsInTransit: true,
    databaseFields: ['ssn', 'bankAccount', 'creditCard', 'personalNotes'],
    keyRotationDays: 90
  },
  
  access: {
    minimumPasswordComplexity: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true
    },
    
    auditRequirements: {
      allDataAccess: true,
      allModifications: true,
      allDeletions: true,
      allAdminActions: true,
      allLoginAttempts: true
    },
    
    accessReviews: {
      frequency: 90 * 24 * 60 * 60 * 1000, // Every 90 days
      requireApproval: ['SUPER_ADMIN', 'FIRM_ADMIN'],
      documentAccess: true
    }
  },
  
  backup: {
    frequency: 24 * 60 * 60 * 1000, // Daily
    retention: 90 * 24 * 60 * 60 * 1000, // 90 days
    encryption: true,
    offsite: true,
    testRecovery: 30 * 24 * 60 * 60 * 1000 // Monthly
  }
};

/**
 * API endpoint security configuration
 */
export const API_SECURITY_CONFIG = {
  '/api/auth/login': {
    rateLimit: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
    requireHTTPS: true,
    logAllRequests: true,
    blockAfterFailures: 5
  },
  
  '/api/auth/register': {
    rateLimit: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
    requireHTTPS: true,
    logAllRequests: true,
    requireInvitation: true
  },
  
  '/api/auth/password-reset': {
    rateLimit: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
    requireHTTPS: true,
    logAllRequests: true
  },
  
  '/api/documents/*': {
    rateLimit: { windowMs: 5 * 60 * 1000, maxRequests: 50 },
    requireAuth: true,
    requirePermissions: [Permission.READ_DOCUMENT],
    logAllAccess: true,
    encryptResponse: true
  },
  
  '/api/cases/*': {
    rateLimit: { windowMs: 5 * 60 * 1000, maxRequests: 100 },
    requireAuth: true,
    requirePermissions: [Permission.READ_CASE],
    logAllAccess: true
  },
  
  '/api/admin/*': {
    rateLimit: { windowMs: 5 * 60 * 1000, maxRequests: 20 },
    requireAuth: true,
    requirePermissions: [Permission.MANAGE_SETTINGS],
    requireMFA: true,
    logAllRequests: true,
    requireSecureConnection: true
  },
  
  '/api/upload/*': {
    rateLimit: { windowMs: 5 * 60 * 1000, maxRequests: 10 },
    requireAuth: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png'],
    scanForMalware: true
  }
};

/**
 * Security monitoring thresholds
 */
export const SECURITY_THRESHOLDS = {
  failedLogins: {
    warningCount: 3,
    alertCount: 5,
    blockCount: 10
  },
  
  requestRate: {
    warningRPS: 20,
    alertRPS: 50,
    blockRPS: 100
  },
  
  sessionAnomalies: {
    maxConcurrentSessions: 5,
    maxSessionDuration: 8 * 60 * 60 * 1000, // 8 hours
    suspiciousIPChange: true
  },
  
  dataAccess: {
    unusualPatterns: true,
    massDownloads: 50,
    outsideBusinessHours: true
  }
};

/**
 * Validate security configuration
 */
export function validateSecurityConfig(config: SecurityConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate JWT secrets
  if (!config.jwt.secret || config.jwt.secret.includes('fallback')) {
    errors.push('JWT secret must be set and not use fallback value');
  }
  
  if (config.jwt.secret.length < 32) {
    errors.push('JWT secret must be at least 32 characters long');
  }
  
  // Validate encryption key
  if (!config.encryption.key || config.encryption.key.includes('fallback')) {
    errors.push('Encryption key must be set and not use fallback value');
  }
  
  // Validate session secret
  if (!config.session.secret || config.session.secret.includes('fallback')) {
    errors.push('Session secret must be set and not use fallback value');
  }
  
  // Validate CORS origins in production
  if (process.env.NODE_ENV === 'production') {
    if (config.cors.origins.includes('*') || 
        config.cors.origins.some(origin => origin.includes('localhost'))) {
      errors.push('CORS origins must be specific domains in production');
    }
  }
  
  // Validate password requirements
  if (config.security.passwordMinLength < 8) {
    errors.push('Password minimum length should be at least 8 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Initialize security configuration with validation
 */
export function initializeSecurityConfig(): SecurityConfig {
  const config = getSecurityConfig();
  const validation = validateSecurityConfig(config);
  
  if (!validation.valid) {
    console.error('Security configuration validation failed:');
    validation.errors.forEach(error => console.error(`- ${error}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid security configuration in production environment');
    }
  }
  
  return config;
}