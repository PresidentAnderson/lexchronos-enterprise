/**
 * Authentication and Authorization Types
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  FIRM_ADMIN = 'firm_admin',
  SENIOR_LAWYER = 'senior_lawyer',
  LAWYER = 'lawyer',
  PARALEGAL = 'paralegal',
  CLIENT = 'client',
  GUEST = 'guest'
}

export enum Permission {
  // Case Management
  CREATE_CASE = 'create_case',
  READ_CASE = 'read_case',
  UPDATE_CASE = 'update_case',
  DELETE_CASE = 'delete_case',
  ASSIGN_CASE = 'assign_case',
  
  // Document Management
  CREATE_DOCUMENT = 'create_document',
  READ_DOCUMENT = 'read_document',
  UPDATE_DOCUMENT = 'update_document',
  DELETE_DOCUMENT = 'delete_document',
  ENCRYPT_DOCUMENT = 'encrypt_document',
  DECRYPT_DOCUMENT = 'decrypt_document',
  
  // User Management
  CREATE_USER = 'create_user',
  READ_USER = 'read_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  MANAGE_ROLES = 'manage_roles',
  
  // Financial
  VIEW_BILLING = 'view_billing',
  MANAGE_BILLING = 'manage_billing',
  CREATE_INVOICE = 'create_invoice',
  
  // Administrative
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_SETTINGS = 'manage_settings',
  EXPORT_DATA = 'export_data',
  
  // Client Portal
  ACCESS_CLIENT_PORTAL = 'access_client_portal',
  VIEW_OWN_CASES = 'view_own_cases',
  UPLOAD_DOCUMENTS = 'upload_documents'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  firmId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  permissions: Permission[];
  mfaEnabled: boolean;
  loginAttempts: number;
  lockedUntil?: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  firmId?: string;
  permissions: Permission[];
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  firmId?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
}

export interface SessionData {
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  eventType: SecurityEventType;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  timestamp: Date;
  severity: SecurityEventSeverity;
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  PERMISSION_DENIED = 'permission_denied',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_EXPORT = 'data_export',
  DOCUMENT_ACCESS = 'document_access',
  CASE_ACCESS = 'case_access'
}

export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface RolePermissions {
  [UserRole.SUPER_ADMIN]: Permission[];
  [UserRole.FIRM_ADMIN]: Permission[];
  [UserRole.SENIOR_LAWYER]: Permission[];
  [UserRole.LAWYER]: Permission[];
  [UserRole.PARALEGAL]: Permission[];
  [UserRole.CLIENT]: Permission[];
  [UserRole.GUEST]: Permission[];
}