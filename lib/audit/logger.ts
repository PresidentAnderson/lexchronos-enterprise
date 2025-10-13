/**
 * Audit Logging System for Compliance
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 */

import { NextRequest } from 'next/server';
import { SecurityEvent, SecurityEventType, SecurityEventSeverity } from '@/types/security/auth';
import { createSignature, generateSecureId } from '@/lib/encryption/crypto';

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: AuditCategory;
  signature: string;
  firmId?: string;
}

/**
 * Audit categories for legal compliance
 */
export enum AuditCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  DOCUMENT_ACCESS = 'document_access',
  CASE_ACCESS = 'case_access',
  USER_MANAGEMENT = 'user_management',
  SYSTEM_CONFIGURATION = 'system_configuration',
  SECURITY_EVENT = 'security_event',
  COMPLIANCE = 'compliance',
  BACKUP = 'backup',
  EXPORT = 'export',
  BILLING = 'billing'
}

/**
 * Actions requiring audit logging
 */
export const AUDITABLE_ACTIONS = {
  // Authentication
  LOGIN: 'user_login',
  LOGOUT: 'user_logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  MFA_ENABLE: 'mfa_enable',
  MFA_DISABLE: 'mfa_disable',
  
  // Document Management
  DOCUMENT_CREATE: 'document_create',
  DOCUMENT_READ: 'document_read',
  DOCUMENT_UPDATE: 'document_update',
  DOCUMENT_DELETE: 'document_delete',
  DOCUMENT_ENCRYPT: 'document_encrypt',
  DOCUMENT_DECRYPT: 'document_decrypt',
  DOCUMENT_SHARE: 'document_share',
  DOCUMENT_DOWNLOAD: 'document_download',
  
  // Case Management
  CASE_CREATE: 'case_create',
  CASE_READ: 'case_read',
  CASE_UPDATE: 'case_update',
  CASE_DELETE: 'case_delete',
  CASE_ASSIGN: 'case_assign',
  CASE_STATUS_CHANGE: 'case_status_change',
  
  // User Management
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_ACTIVATE: 'user_activate',
  USER_DEACTIVATE: 'user_deactivate',
  ROLE_CHANGE: 'role_change',
  PERMISSION_GRANT: 'permission_grant',
  PERMISSION_REVOKE: 'permission_revoke',
  
  // System Security
  CONFIG_CHANGE: 'config_change',
  SECURITY_SETTING_CHANGE: 'security_setting_change',
  ACCESS_DENIED: 'access_denied',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  
  // Data Operations
  DATA_EXPORT: 'data_export',
  DATA_IMPORT: 'data_import',
  BACKUP_CREATE: 'backup_create',
  BACKUP_RESTORE: 'backup_restore',
  
  // Billing
  INVOICE_CREATE: 'invoice_create',
  PAYMENT_PROCESS: 'payment_process',
  BILLING_CHANGE: 'billing_change'
};

/**
 * Logger class for audit trails
 */
export class AuditLogger {
  private static instance: AuditLogger;
  private logBuffer: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Start periodic flush to storage
    this.startPeriodicFlush();
  }
  
  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }
  
  /**
   * Log an audit entry
   */
  public async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'signature'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      id: generateSecureId(32),
      timestamp: new Date(),
      signature: this.createEntrySignature(entry)
    };
    
    // Add to buffer
    this.logBuffer.push(auditEntry);
    
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log('AUDIT LOG:', JSON.stringify(auditEntry, null, 2));
    }
    
    // Immediate flush for critical events
    if (entry.severity === 'critical') {
      await this.flushLogs();
    }
  }
  
  /**
   * Create signature for audit entry integrity
   */
  private createEntrySignature(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'signature'>): string {
    const signingData = JSON.stringify({
      action: entry.action,
      resource: entry.resource,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      timestamp: new Date().toISOString()
    });
    
    return createSignature(signingData);
  }
  
  /**
   * Start periodic flush to persistent storage
   */
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(async () => {
      if (this.logBuffer.length > 0) {
        await this.flushLogs();
      }
    }, 30000); // Flush every 30 seconds
  }
  
  /**
   * Flush logs to persistent storage
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    
    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      // In production, this would write to your database or logging service
      await this.persistLogs(logsToFlush);
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Re-add logs to buffer if persistence failed
      this.logBuffer.unshift(...logsToFlush);
    }
  }
  
  /**
   * Persist logs to storage (implement with your storage solution)
   */
  private async persistLogs(logs: AuditLogEntry[]): Promise<void> {
    // TODO: Implement persistence to your database
    // Example implementations:
    
    // MongoDB
    // await db.collection('audit_logs').insertMany(logs);
    
    // PostgreSQL
    // await db.query('INSERT INTO audit_logs ...', logs);
    
    // External logging service
    // await loggingService.batchLog(logs);
    
    // For now, log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Flushed ${logs.length} audit logs to storage`);
    }
  }
  
  /**
   * Query audit logs (implement based on your storage)
   */
  public async queryLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: string;
    firmId?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    // TODO: Implement query logic for your storage solution
    return [];
  }
  
  /**
   * Clean up on shutdown
   */
  public async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flushLogs();
  }
}

/**
 * Convenience function to log audit events
 */
export async function logAuditEvent(
  action: string,
  resource: string,
  details: Record<string, any>,
  req?: NextRequest,
  userId?: string,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  const logger = AuditLogger.getInstance();
  
  // Extract request information
  const ipAddress = req ? getClientIP(req) : 'unknown';
  const userAgent = req ? req.headers.get('user-agent') || 'unknown' : 'system';
  
  // Determine severity based on action and success
  const severity = determineSeverity(action, success);
  
  // Determine category based on action
  const category = determineCategory(action);
  
  await logger.log({
    userId,
    action,
    resource,
    resourceId: details.resourceId,
    details,
    ipAddress,
    userAgent,
    success,
    errorMessage,
    severity,
    category,
    firmId: details.firmId
  });
}

/**
 * Log security events
 */
export async function logSecurityEvent(event: {
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
}): Promise<void> {
  await logAuditEvent(
    event.eventType,
    'security',
    event.metadata,
    undefined,
    event.userId,
    !event.eventType.includes('FAILED') && !event.eventType.includes('DENIED'),
    event.metadata.error
  );
}

/**
 * Extract client IP from request
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
 * Determine severity based on action and success
 */
function determineSeverity(action: string, success: boolean): 'low' | 'medium' | 'high' | 'critical' {
  if (!success) {
    if (action.includes('LOGIN') || action.includes('AUTH')) {
      return 'high';
    }
    if (action.includes('DELETE') || action.includes('SECURITY')) {
      return 'critical';
    }
    return 'medium';
  }
  
  // Successful actions
  if (action.includes('DELETE') || action.includes('SECURITY_SETTING') || action.includes('ROLE')) {
    return 'high';
  }
  
  if (action.includes('CREATE') || action.includes('UPDATE') || action.includes('EXPORT')) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Determine category based on action
 */
function determineCategory(action: string): AuditCategory {
  if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('PASSWORD')) {
    return AuditCategory.AUTHENTICATION;
  }
  
  if (action.includes('ACCESS_DENIED') || action.includes('PERMISSION')) {
    return AuditCategory.AUTHORIZATION;
  }
  
  if (action.includes('DOCUMENT')) {
    return AuditCategory.DOCUMENT_ACCESS;
  }
  
  if (action.includes('CASE')) {
    return AuditCategory.CASE_ACCESS;
  }
  
  if (action.includes('USER') || action.includes('ROLE')) {
    return AuditCategory.USER_MANAGEMENT;
  }
  
  if (action.includes('CONFIG') || action.includes('SECURITY')) {
    return AuditCategory.SYSTEM_CONFIGURATION;
  }
  
  if (action.includes('EXPORT') || action.includes('BACKUP')) {
    return AuditCategory.EXPORT;
  }
  
  if (action.includes('BILLING') || action.includes('INVOICE') || action.includes('PAYMENT')) {
    return AuditCategory.BILLING;
  }
  
  return AuditCategory.SECURITY_EVENT;
}

/**
 * Audit middleware for automatic logging
 */
export function withAuditLogging(
  handler: (req: NextRequest) => Promise<Response>,
  action: string,
  resource: string
) {
  return async (req: NextRequest): Promise<Response> => {
    const startTime = Date.now();
    let success = true;
    let errorMessage: string | undefined;
    
    try {
      const response = await handler(req);
      success = response.status < 400;
      
      if (!success) {
        errorMessage = `HTTP ${response.status}`;
      }
      
      return response;
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      // Log the audit event
      const duration = Date.now() - startTime;
      
      await logAuditEvent(
        action,
        resource,
        {
          method: req.method,
          url: req.url,
          duration,
          timestamp: new Date().toISOString()
        },
        req,
        undefined, // userId would be extracted from auth middleware
        success,
        errorMessage
      );
    }
  };
}

/**
 * Legal document access audit
 */
export async function auditDocumentAccess(
  documentId: string,
  userId: string,
  action: 'read' | 'download' | 'share' | 'encrypt' | 'decrypt',
  req?: NextRequest,
  additionalDetails?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    `document_${action}`,
    'document',
    {
      documentId,
      ...additionalDetails,
      timestamp: new Date().toISOString()
    },
    req,
    userId
  );
}

/**
 * Case access audit
 */
export async function auditCaseAccess(
  caseId: string,
  userId: string,
  action: 'read' | 'update' | 'assign' | 'status_change',
  req?: NextRequest,
  additionalDetails?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    `case_${action}`,
    'case',
    {
      caseId,
      ...additionalDetails,
      timestamp: new Date().toISOString()
    },
    req,
    userId
  );
}

/**
 * User management audit
 */
export async function auditUserManagement(
  targetUserId: string,
  actorUserId: string,
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'role_change',
  req?: NextRequest,
  additionalDetails?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    `user_${action}`,
    'user',
    {
      targetUserId,
      actorUserId,
      ...additionalDetails,
      timestamp: new Date().toISOString()
    },
    req,
    actorUserId
  );
}

/**
 * Compliance report generation
 */
export async function generateComplianceReport(
  startDate: Date,
  endDate: Date,
  firmId?: string
): Promise<{
  totalEvents: number;
  criticalEvents: number;
  failedLogins: number;
  documentAccesses: number;
  userChanges: number;
  securityEvents: number;
  summary: Record<string, number>;
}> {
  const logger = AuditLogger.getInstance();
  
  // This would query your actual storage
  const logs = await logger.queryLogs({
    startDate,
    endDate,
    firmId
  });
  
  const summary = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalEvents: logs.length,
    criticalEvents: logs.filter(log => log.severity === 'critical').length,
    failedLogins: logs.filter(log => log.action === 'user_login' && !log.success).length,
    documentAccesses: logs.filter(log => log.category === AuditCategory.DOCUMENT_ACCESS).length,
    userChanges: logs.filter(log => log.category === AuditCategory.USER_MANAGEMENT).length,
    securityEvents: logs.filter(log => log.category === AuditCategory.SECURITY_EVENT).length,
    summary
  };
}