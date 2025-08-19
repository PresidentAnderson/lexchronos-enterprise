/**
 * Role-Based Access Control (RBAC) System
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 */

import { UserRole, Permission, RolePermissions, User, JWTPayload } from '@/types/security/auth';

/**
 * Define permissions for each role
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  [UserRole.SUPER_ADMIN]: [
    // All permissions - super admin has access to everything
    Permission.CREATE_CASE, Permission.READ_CASE, Permission.UPDATE_CASE, Permission.DELETE_CASE, Permission.ASSIGN_CASE,
    Permission.CREATE_DOCUMENT, Permission.READ_DOCUMENT, Permission.UPDATE_DOCUMENT, Permission.DELETE_DOCUMENT,
    Permission.ENCRYPT_DOCUMENT, Permission.DECRYPT_DOCUMENT,
    Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER, Permission.DELETE_USER, Permission.MANAGE_ROLES,
    Permission.VIEW_BILLING, Permission.MANAGE_BILLING, Permission.CREATE_INVOICE,
    Permission.VIEW_AUDIT_LOGS, Permission.MANAGE_SETTINGS, Permission.EXPORT_DATA,
    Permission.ACCESS_CLIENT_PORTAL, Permission.VIEW_OWN_CASES, Permission.UPLOAD_DOCUMENTS
  ],

  [UserRole.FIRM_ADMIN]: [
    // Firm-level administrative permissions
    Permission.CREATE_CASE, Permission.READ_CASE, Permission.UPDATE_CASE, Permission.DELETE_CASE, Permission.ASSIGN_CASE,
    Permission.CREATE_DOCUMENT, Permission.READ_DOCUMENT, Permission.UPDATE_DOCUMENT, Permission.DELETE_DOCUMENT,
    Permission.ENCRYPT_DOCUMENT, Permission.DECRYPT_DOCUMENT,
    Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER, Permission.DELETE_USER,
    Permission.VIEW_BILLING, Permission.MANAGE_BILLING, Permission.CREATE_INVOICE,
    Permission.VIEW_AUDIT_LOGS, Permission.MANAGE_SETTINGS, Permission.EXPORT_DATA,
    Permission.ACCESS_CLIENT_PORTAL, Permission.VIEW_OWN_CASES, Permission.UPLOAD_DOCUMENTS
  ],

  [UserRole.SENIOR_LAWYER]: [
    // Senior lawyer permissions
    Permission.CREATE_CASE, Permission.READ_CASE, Permission.UPDATE_CASE, Permission.ASSIGN_CASE,
    Permission.CREATE_DOCUMENT, Permission.READ_DOCUMENT, Permission.UPDATE_DOCUMENT, Permission.DELETE_DOCUMENT,
    Permission.ENCRYPT_DOCUMENT, Permission.DECRYPT_DOCUMENT,
    Permission.READ_USER, Permission.UPDATE_USER,
    Permission.VIEW_BILLING, Permission.CREATE_INVOICE,
    Permission.ACCESS_CLIENT_PORTAL, Permission.VIEW_OWN_CASES, Permission.UPLOAD_DOCUMENTS
  ],

  [UserRole.LAWYER]: [
    // Lawyer permissions
    Permission.CREATE_CASE, Permission.READ_CASE, Permission.UPDATE_CASE,
    Permission.CREATE_DOCUMENT, Permission.READ_DOCUMENT, Permission.UPDATE_DOCUMENT,
    Permission.ENCRYPT_DOCUMENT, Permission.DECRYPT_DOCUMENT,
    Permission.READ_USER,
    Permission.VIEW_BILLING,
    Permission.ACCESS_CLIENT_PORTAL, Permission.VIEW_OWN_CASES, Permission.UPLOAD_DOCUMENTS
  ],

  [UserRole.PARALEGAL]: [
    // Paralegal permissions
    Permission.READ_CASE, Permission.UPDATE_CASE,
    Permission.CREATE_DOCUMENT, Permission.READ_DOCUMENT, Permission.UPDATE_DOCUMENT,
    Permission.READ_USER,
    Permission.ACCESS_CLIENT_PORTAL, Permission.UPLOAD_DOCUMENTS
  ],

  [UserRole.CLIENT]: [
    // Client permissions - limited to their own data
    Permission.ACCESS_CLIENT_PORTAL,
    Permission.VIEW_OWN_CASES,
    Permission.UPLOAD_DOCUMENTS,
    Permission.READ_DOCUMENT // Only their own documents
  ],

  [UserRole.GUEST]: [
    // Very limited guest permissions
    Permission.ACCESS_CLIENT_PORTAL
  ]
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | JWTPayload, permission: Permission): boolean {
  if (!user || !user.role) {
    return false;
  }

  const userPermissions = getUserPermissions(user.role);
  return userPermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: User | JWTPayload, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: User | JWTPayload, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Get all permissions for a specific role
 */
export function getUserPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role is hierarchically higher than another
 */
export function isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
  const hierarchy = {
    [UserRole.SUPER_ADMIN]: 7,
    [UserRole.FIRM_ADMIN]: 6,
    [UserRole.SENIOR_LAWYER]: 5,
    [UserRole.LAWYER]: 4,
    [UserRole.PARALEGAL]: 3,
    [UserRole.CLIENT]: 2,
    [UserRole.GUEST]: 1
  };

  return hierarchy[role1] > hierarchy[role2];
}

/**
 * Check if user can access a specific case
 * Implements Zero Trust - each access is verified
 */
export function canAccessCase(user: User | JWTPayload, caseId: string, ownedCases?: string[]): boolean {
  // Super admins and firm admins can access any case within their firm
  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.FIRM_ADMIN) {
    return true;
  }

  // Lawyers and senior lawyers can access cases they're assigned to
  if (user.role === UserRole.SENIOR_LAWYER || user.role === UserRole.LAWYER) {
    return ownedCases ? ownedCases.includes(caseId) : false;
  }

  // Paralegals can access cases they're assigned to (read-only mostly)
  if (user.role === UserRole.PARALEGAL) {
    return ownedCases ? ownedCases.includes(caseId) : false;
  }

  // Clients can only access their own cases
  if (user.role === UserRole.CLIENT) {
    return ownedCases ? ownedCases.includes(caseId) : false;
  }

  return false;
}

/**
 * Check if user can access a specific document
 */
export function canAccessDocument(user: User | JWTPayload, documentId: string, documentOwnerId?: string, caseId?: string, ownedCases?: string[]): boolean {
  // Super admins can access any document
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Firm admins can access documents within their firm
  if (user.role === UserRole.FIRM_ADMIN) {
    return true; // Assuming firm-level access control is handled elsewhere
  }

  // Check case-level access first
  if (caseId && !canAccessCase(user, caseId, ownedCases)) {
    return false;
  }

  // Check document ownership
  if (documentOwnerId === user.userId) {
    return true;
  }

  // Lawyers and senior lawyers can access documents in cases they're assigned to
  if ((user.role === UserRole.SENIOR_LAWYER || user.role === UserRole.LAWYER) && caseId) {
    return canAccessCase(user, caseId, ownedCases);
  }

  // Paralegals can read documents in cases they're assigned to
  if (user.role === UserRole.PARALEGAL && caseId) {
    return canAccessCase(user, caseId, ownedCases) && hasPermission(user, Permission.READ_DOCUMENT);
  }

  // Clients can only access their own documents
  if (user.role === UserRole.CLIENT) {
    return documentOwnerId === user.userId;
  }

  return false;
}

/**
 * Check if user can perform action on another user
 */
export function canManageUser(actor: User | JWTPayload, targetUser: User | JWTPayload): boolean {
  // Super admins can manage anyone
  if (actor.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Firm admins can manage users within their firm (except super admins)
  if (actor.role === UserRole.FIRM_ADMIN) {
    return targetUser.role !== UserRole.SUPER_ADMIN && 
           actor.firmId === targetUser.firmId;
  }

  // Users can only manage themselves (limited actions)
  return actor.userId === targetUser.userId;
}

/**
 * Validate that a user can assign a specific role
 */
export function canAssignRole(actor: User | JWTPayload, targetRole: UserRole): boolean {
  // Super admins can assign any role
  if (actor.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Firm admins can assign roles below super admin within their firm
  if (actor.role === UserRole.FIRM_ADMIN) {
    return targetRole !== UserRole.SUPER_ADMIN;
  }

  return false;
}

/**
 * Get maximum allowed role for a user to assign
 */
export function getMaxAssignableRole(actor: User | JWTPayload): UserRole {
  if (actor.role === UserRole.SUPER_ADMIN) {
    return UserRole.SUPER_ADMIN;
  }

  if (actor.role === UserRole.FIRM_ADMIN) {
    return UserRole.FIRM_ADMIN;
  }

  return UserRole.GUEST; // Most restrictive by default
}

/**
 * Resource-level access control
 */
export interface ResourceAccess {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

/**
 * Check resource-level access with conditions
 */
export function checkResourceAccess(
  user: User | JWTPayload, 
  resource: string, 
  action: string, 
  conditions: Record<string, any> = {}
): boolean {
  // Zero Trust: every access must be explicitly authorized
  
  // Check basic permission first
  const requiredPermission = getRequiredPermissionForAction(resource, action);
  if (!hasPermission(user, requiredPermission)) {
    return false;
  }

  // Apply additional conditions based on resource and role
  return applyResourceConditions(user, resource, action, conditions);
}

/**
 * Map resource actions to permissions
 */
function getRequiredPermissionForAction(resource: string, action: string): Permission {
  const resourceActionMap: Record<string, Record<string, Permission>> = {
    case: {
      create: Permission.CREATE_CASE,
      read: Permission.READ_CASE,
      update: Permission.UPDATE_CASE,
      delete: Permission.DELETE_CASE,
      assign: Permission.ASSIGN_CASE
    },
    document: {
      create: Permission.CREATE_DOCUMENT,
      read: Permission.READ_DOCUMENT,
      update: Permission.UPDATE_DOCUMENT,
      delete: Permission.DELETE_DOCUMENT,
      encrypt: Permission.ENCRYPT_DOCUMENT,
      decrypt: Permission.DECRYPT_DOCUMENT
    },
    user: {
      create: Permission.CREATE_USER,
      read: Permission.READ_USER,
      update: Permission.UPDATE_USER,
      delete: Permission.DELETE_USER
    }
  };

  return resourceActionMap[resource]?.[action] || Permission.READ_CASE; // Default to most restrictive
}

/**
 * Apply resource-specific conditions
 */
function applyResourceConditions(
  user: User | JWTPayload, 
  resource: string, 
  action: string, 
  conditions: Record<string, any>
): boolean {
  // Firm-level isolation
  if (conditions.firmId && user.firmId && conditions.firmId !== user.firmId) {
    // Only super admins can cross firm boundaries
    return user.role === UserRole.SUPER_ADMIN;
  }

  // Ownership checks
  if (conditions.ownerId && conditions.ownerId !== user.userId) {
    // Check if user has elevated permissions to access others' resources
    return isRoleHigherThan(user.role, UserRole.PARALEGAL);
  }

  return true;
}