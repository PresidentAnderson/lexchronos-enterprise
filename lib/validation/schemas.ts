/**
 * Input Validation Schemas
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 */

import { z } from 'zod';
import { UserRole } from '@/types/security/auth';

/**
 * Common validation rules
 */
export const commonValidation = {
  email: z.string().email({ message: 'Invalid email address' }).max(255),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must be less than 128 characters' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  name: z.string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name must be less than 100 characters' })
    .regex(/^[a-zA-Z\s\-'.]+$/, { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' }),
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)\.]{10,}$/, { message: 'Invalid phone number format' })
    .optional(),
  id: z.string().uuid({ message: 'Invalid ID format' }),
  text: z.string().max(10000, { message: 'Text too long' }),
  url: z.string().url({ message: 'Invalid URL format' }).optional(),
  date: z.coerce.date({ message: 'Invalid date format' }),
  firmId: z.string().uuid({ message: 'Invalid firm ID format' }).optional(),
  role: z.nativeEnum(UserRole, { message: 'Invalid user role' })
};

/**
 * Authentication schemas
 */
export const authSchemas = {
  login: z.object({
    email: commonValidation.email,
    password: z.string().min(1, { message: 'Password is required' }),
    mfaCode: z.string().regex(/^\d{6}$/, { message: 'MFA code must be 6 digits' }).optional(),
    rememberMe: z.boolean().optional()
  }),

  register: z.object({
    email: commonValidation.email,
    password: commonValidation.password,
    confirmPassword: z.string(),
    firstName: commonValidation.name,
    lastName: commonValidation.name,
    role: commonValidation.role,
    firmId: commonValidation.firmId,
    phone: commonValidation.phone,
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions'
    })
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }),

  passwordReset: z.object({
    email: commonValidation.email
  }),

  passwordResetConfirm: z.object({
    token: z.string().min(1, { message: 'Reset token is required' }),
    password: commonValidation.password,
    confirmPassword: z.string()
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: commonValidation.password,
    confirmPassword: z.string()
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, { message: 'Refresh token is required' })
  })
};

/**
 * User management schemas
 */
export const userSchemas = {
  createUser: z.object({
    email: commonValidation.email,
    firstName: commonValidation.name,
    lastName: commonValidation.name,
    role: commonValidation.role,
    firmId: commonValidation.firmId,
    phone: commonValidation.phone,
    isActive: z.boolean().default(true),
    sendWelcomeEmail: z.boolean().default(true)
  }),

  updateUser: z.object({
    firstName: commonValidation.name.optional(),
    lastName: commonValidation.name.optional(),
    phone: commonValidation.phone,
    role: commonValidation.role.optional(),
    isActive: z.boolean().optional(),
    firmId: commonValidation.firmId
  }),

  updateProfile: z.object({
    firstName: commonValidation.name.optional(),
    lastName: commonValidation.name.optional(),
    phone: commonValidation.phone,
    bio: z.string().max(500, { message: 'Bio must be less than 500 characters' }).optional(),
    timezone: z.string().optional(),
    language: z.enum(['en', 'es', 'fr'], { message: 'Invalid language' }).optional()
  })
};

/**
 * Case management schemas
 */
export const caseSchemas = {
  createCase: z.object({
    title: z.string()
      .min(1, { message: 'Case title is required' })
      .max(200, { message: 'Case title must be less than 200 characters' }),
    description: z.string()
      .max(5000, { message: 'Description must be less than 5000 characters' })
      .optional(),
    caseType: z.enum(['civil', 'criminal', 'corporate', 'family', 'immigration', 'other'], {
      message: 'Invalid case type'
    }),
    priority: z.enum(['low', 'medium', 'high', 'urgent'], { message: 'Invalid priority' }).default('medium'),
    clientId: commonValidation.id,
    assignedLawyerId: commonValidation.id.optional(),
    dueDate: commonValidation.date.optional(),
    status: z.enum(['active', 'pending', 'closed', 'archived'], {
      message: 'Invalid case status'
    }).default('pending'),
    tags: z.array(z.string().max(50)).max(10).optional(),
    isConfidential: z.boolean().default(false)
  }),

  updateCase: z.object({
    title: z.string()
      .min(1, { message: 'Case title is required' })
      .max(200, { message: 'Case title must be less than 200 characters' })
      .optional(),
    description: z.string()
      .max(5000, { message: 'Description must be less than 5000 characters' })
      .optional(),
    caseType: z.enum(['civil', 'criminal', 'corporate', 'family', 'immigration', 'other'], {
      message: 'Invalid case type'
    }).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent'], { message: 'Invalid priority' }).optional(),
    assignedLawyerId: commonValidation.id.optional(),
    dueDate: commonValidation.date.optional(),
    status: z.enum(['active', 'pending', 'closed', 'archived'], {
      message: 'Invalid case status'
    }).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    isConfidential: z.boolean().optional()
  }),

  caseQuery: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
    caseType: z.enum(['civil', 'criminal', 'corporate', 'family', 'immigration', 'other']).optional(),
    status: z.enum(['active', 'pending', 'closed', 'archived']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    clientId: commonValidation.id.optional(),
    assignedLawyerId: commonValidation.id.optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'priority', 'dueDate']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
};

/**
 * Document management schemas
 */
export const documentSchemas = {
  uploadDocument: z.object({
    name: z.string()
      .min(1, { message: 'Document name is required' })
      .max(255, { message: 'Document name must be less than 255 characters' }),
    description: z.string()
      .max(1000, { message: 'Description must be less than 1000 characters' })
      .optional(),
    caseId: commonValidation.id,
    category: z.enum([
      'contract', 'evidence', 'correspondence', 'court_filing', 
      'research', 'client_document', 'internal_memo', 'other'
    ], { message: 'Invalid document category' }),
    isConfidential: z.boolean().default(false),
    tags: z.array(z.string().max(50)).max(10).optional(),
    accessLevel: z.enum(['public', 'firm', 'case_team', 'restricted'], {
      message: 'Invalid access level'
    }).default('case_team')
  }),

  updateDocument: z.object({
    name: z.string()
      .min(1, { message: 'Document name is required' })
      .max(255, { message: 'Document name must be less than 255 characters' })
      .optional(),
    description: z.string()
      .max(1000, { message: 'Description must be less than 1000 characters' })
      .optional(),
    category: z.enum([
      'contract', 'evidence', 'correspondence', 'court_filing', 
      'research', 'client_document', 'internal_memo', 'other'
    ], { message: 'Invalid document category' }).optional(),
    isConfidential: z.boolean().optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    accessLevel: z.enum(['public', 'firm', 'case_team', 'restricted'], {
      message: 'Invalid access level'
    }).optional()
  })
};

/**
 * Audit and logging schemas
 */
export const auditSchemas = {
  auditQuery: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(1000).default(50),
    userId: commonValidation.id.optional(),
    eventType: z.string().max(100).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    startDate: commonValidation.date.optional(),
    endDate: commonValidation.date.optional(),
    ipAddress: z.string().ip().optional(),
    resource: z.string().max(100).optional()
  })
};

/**
 * Security settings schemas
 */
export const securitySchemas = {
  mfaSetup: z.object({
    secret: z.string().min(1, { message: 'MFA secret is required' }),
    token: z.string().regex(/^\d{6}$/, { message: 'MFA token must be 6 digits' })
  }),

  mfaVerify: z.object({
    token: z.string().regex(/^\d{6}$/, { message: 'MFA token must be 6 digits' })
  }),

  securitySettings: z.object({
    mfaEnabled: z.boolean(),
    sessionTimeout: z.number().min(5).max(480).default(60), // 5 minutes to 8 hours
    allowedIpAddresses: z.array(z.string().ip()).max(10).optional(),
    passwordExpiryDays: z.number().min(30).max(365).default(90)
  })
};

/**
 * Firm management schemas
 */
export const firmSchemas = {
  createFirm: z.object({
    name: z.string()
      .min(1, { message: 'Firm name is required' })
      .max(200, { message: 'Firm name must be less than 200 characters' }),
    address: z.object({
      street: z.string().max(200),
      city: z.string().max(100),
      state: z.string().max(100),
      zipCode: z.string().max(20),
      country: z.string().max(100)
    }),
    phone: commonValidation.phone,
    email: commonValidation.email,
    website: commonValidation.url,
    licenseNumber: z.string().max(100).optional(),
    taxId: z.string().max(50).optional()
  }),

  updateFirm: z.object({
    name: z.string()
      .min(1, { message: 'Firm name is required' })
      .max(200, { message: 'Firm name must be less than 200 characters' })
      .optional(),
    address: z.object({
      street: z.string().max(200),
      city: z.string().max(100),
      state: z.string().max(100),
      zipCode: z.string().max(20),
      country: z.string().max(100)
    }).optional(),
    phone: commonValidation.phone,
    email: commonValidation.email.optional(),
    website: commonValidation.url,
    licenseNumber: z.string().max(100).optional(),
    taxId: z.string().max(50).optional()
  })
};

/**
 * File upload validation
 */
export const fileValidation = {
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ],
  maxSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10
};

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!fileValidation.allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  if (file.size > fileValidation.maxSize) {
    return { valid: false, error: 'File size exceeds limit' };
  }

  return { valid: true };
}

/**
 * Validate and sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[<>'"]/g, '') // Remove potentially harmful characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Conflict of Interest schemas
 */
export const conflictSchemas = {
  entity: z.object({
    name: z.string()
      .min(1, { message: 'Entity name is required' })
      .max(200, { message: 'Entity name must be less than 200 characters' }),
    type: z.enum(['PERSON', 'COMPANY', 'ORGANIZATION', 'GOVERNMENT', 'OTHER'], {
      message: 'Invalid entity type'
    }),
    email: commonValidation.email.optional(),
    phone: commonValidation.phone.optional(),
    address: z.string().max(500).optional(),
    aliases: z.array(z.string().max(100)).max(10).optional(),
    identifiers: z.array(z.object({
      type: z.string().max(50),
      value: z.string().max(100),
    })).max(5).optional(),
    description: z.string().max(1000).optional(),
    notes: z.string().max(2000).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
  }),

  entityUpdate: z.object({
    name: z.string()
      .min(1, { message: 'Entity name is required' })
      .max(200, { message: 'Entity name must be less than 200 characters' })
      .optional(),
    type: z.enum(['PERSON', 'COMPANY', 'ORGANIZATION', 'GOVERNMENT', 'OTHER'], {
      message: 'Invalid entity type'
    }).optional(),
    email: commonValidation.email.optional(),
    phone: commonValidation.phone.optional(),
    address: z.string().max(500).optional(),
    aliases: z.array(z.string().max(100)).max(10).optional(),
    identifiers: z.array(z.object({
      type: z.string().max(50),
      value: z.string().max(100),
    })).max(5).optional(),
    description: z.string().max(1000).optional(),
    notes: z.string().max(2000).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    isActive: z.boolean().optional(),
  }),

  relationship: z.object({
    fromEntityId: commonValidation.id,
    toEntityId: commonValidation.id,
    type: z.enum([
      'BUSINESS', 'PERSONAL', 'FAMILY', 'EMPLOYMENT', 'INVESTMENT', 
      'LEGAL', 'OPPOSING_PARTY', 'FORMER_CLIENT', 'VENDOR', 'OTHER'
    ], { message: 'Invalid relationship type' }),
    description: z.string().max(500).optional(),
    startDate: commonValidation.date.optional(),
    endDate: commonValidation.date.optional(),
    strength: z.enum(['WEAK', 'MEDIUM', 'STRONG', 'CRITICAL'], {
      message: 'Invalid relationship strength'
    }),
    notes: z.string().max(1000).optional(),
    tags: z.array(z.string().max(50)).max(5).optional(),
  }),

  check: z.object({
    checkType: z.enum([
      'NEW_CASE', 'NEW_CLIENT', 'NEW_MATTER', 'LATERAL_HIRE', 'ROUTINE_CHECK', 'OTHER'
    ], { message: 'Invalid check type' }),
    entityId: commonValidation.id.optional(),
    caseId: commonValidation.id.optional(),
    searchTerms: z.array(z.string().min(1).max(100)).min(1).max(20),
    searchScope: z.enum(['ENTITY_ONLY', 'RELATED_ENTITIES', 'FULL'], {
      message: 'Invalid search scope'
    }).optional(),
  }),

  waiver: z.object({
    conflictCheckId: commonValidation.id,
    clientName: z.string().min(1).max(200),
    clientEmail: commonValidation.email.optional(),
    waiverType: z.enum([
      'INFORMED_CONSENT', 'ADVANCE_WAIVER', 'LIMITED_WAIVER', 'JOINT_REPRESENTATION'
    ], { message: 'Invalid waiver type' }),
    description: z.string().min(10).max(2000),
    riskExplanation: z.string().min(10).max(2000),
    clientAcknowledgment: z.string().min(10).max(2000),
    signatureData: z.object({
      signature: z.string(),
      timestamp: z.string(),
      ip: z.string().ip(),
    }).optional(),
    expiresAt: commonValidation.date.optional(),
  }),
};

// Export individual schemas for easier imports
export const ConflictEntitySchema = conflictSchemas.entity;
export const ConflictEntityUpdateSchema = conflictSchemas.entityUpdate;
export const ConflictRelationshipSchema = conflictSchemas.relationship;
export const ConflictCheckSchema = conflictSchemas.check;
export const ConflictWaiverSchema = conflictSchemas.waiver;

/**
 * Trust Account schemas
 */
export const trustSchemas = {
  account: z.object({
    accountNumber: z.string().min(1).max(50),
    accountName: z.string().min(1).max(200),
    bankName: z.string().min(1).max(200),
    routingNumber: z.string().regex(/^\d{9}$/, 'Routing number must be 9 digits'),
    accountType: z.enum(['IOLTA', 'NON_IOLTA', 'IOLTA_EXEMPT', 'SETTLEMENT', 'OTHER']),
    openingDate: commonValidation.date.optional(),
    isInterestBearing: z.boolean().default(true),
    interestRate: z.number().min(0).max(100).optional(),
    minimumBalance: z.number().min(0).default(0),
    primarySignatory: commonValidation.id.optional(),
    signatories: z.array(commonValidation.id).optional(),
    settings: z.object({}).optional(),
    restrictions: z.object({}).optional(),
  }),

  transaction: z.object({
    trustAccountId: commonValidation.id,
    type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'FEE', 'INTEREST', 'ADJUSTMENT', 'REFUND']),
    amount: z.number().refine(val => Math.abs(val) > 0, 'Amount must be greater than 0'),
    currency: z.string().length(3).default('USD'),
    description: z.string().min(1).max(500),
    reference: z.string().max(100).optional(),
    caseId: commonValidation.id.optional(),
    clientId: z.string().max(100).optional(),
    transactionDate: commonValidation.date,
    effectiveDate: commonValidation.date.optional(),
    status: z.enum(['PENDING', 'AUTHORIZED', 'CLEARED', 'FAILED', 'CANCELLED', 'RECONCILED']).default('PENDING'),
    paymentMethod: z.enum(['CHECK', 'WIRE_TRANSFER', 'ACH', 'CREDIT_CARD', 'CASH', 'MONEY_ORDER', 'CASHIERS_CHECK', 'OTHER']),
    checkNumber: z.string().max(50).optional(),
    wireDetails: z.object({}).optional(),
    cardDetails: z.object({}).optional(),
    achDetails: z.object({}).optional(),
    purpose: z.enum(['CLIENT_ADVANCE', 'SETTLEMENT_FUNDS', 'COURT_DEPOSIT', 'THIRD_PARTY_FUNDS', 'EXPENSE_ADVANCE', 'RETAINER', 'OTHER']),
    purposeDetails: z.object({}).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    notes: z.string().max(2000).optional(),
  }),

  reconciliation: z.object({
    trustAccountId: commonValidation.id,
    periodStart: commonValidation.date,
    periodEnd: commonValidation.date,
    bankStatementDate: commonValidation.date,
    bankBalance: z.number(),
    outstandingDeposits: z.number().min(0).default(0),
    outstandingChecks: z.number().min(0).default(0),
    bankFees: z.number().min(0).default(0),
    interestEarned: z.number().min(0).default(0),
    adjustments: z.array(z.object({
      description: z.string().max(200),
      amount: z.number(),
      type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'FEE', 'INTEREST', 'ADJUSTMENT']),
    })).optional(),
    discrepancyNotes: z.string().max(2000).optional(),
    notes: z.string().max(2000).optional(),
  }),

  ledgerEntry: z.object({
    trustAccountId: commonValidation.id,
    entryType: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'EARNED_FEES', 'COST_PAYMENT', 'INTEREST_CREDIT', 'BANK_FEE', 'ADJUSTMENT']),
    amount: z.number().refine(val => val !== 0, 'Amount cannot be zero'),
    clientName: z.string().min(1).max(200),
    description: z.string().min(1).max(500),
    entryDate: commonValidation.date,
    effectiveDate: commonValidation.date.optional(),
    caseId: commonValidation.id.optional(),
    transactionId: commonValidation.id.optional(),
    notes: z.string().max(1000).optional(),
    tags: z.array(z.string().max(50)).max(5).optional(),
  }),
};

// Export individual trust schemas
export const TrustAccountSchema = trustSchemas.account;
export const TrustTransactionSchema = trustSchemas.transaction;
export const TrustReconciliationSchema = trustSchemas.reconciliation;
export const TrustLedgerEntrySchema = trustSchemas.ledgerEntry;