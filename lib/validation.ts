import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format')

export const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one lowercase letter, one uppercase letter, and one number')

export const userSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: phoneSchema.optional(),
  dateOfBirth: z.date().optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const timeEntrySchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  startTime: z.date(),
  endTime: z.date(),
  billableHours: z.number().min(0, 'Billable hours cannot be negative').max(24, 'Billable hours cannot exceed 24'),
  hourlyRate: z.number().min(0, 'Hourly rate cannot be negative').optional(),
}).refine(data => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  clientId: z.string().min(1, 'Client ID is required'),
  hourlyRate: z.number().min(0, 'Hourly rate cannot be negative'),
  isActive: z.boolean(),
  startDate: z.date(),
  endDate: z.date().optional(),
}).refine(data => !data.endDate || data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

export const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100, 'Client name too long'),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string().max(200, 'Address too long').optional(),
  company: z.string().max(100, 'Company name too long').optional(),
  isActive: z.boolean(),
})

export const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  issueDate: z.date(),
  dueDate: z.date(),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    rate: z.number().min(0, 'Rate cannot be negative'),
    amount: z.number().min(0, 'Amount cannot be negative'),
  })).min(1, 'At least one item is required'),
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  tax: z.number().min(0, 'Tax cannot be negative'),
  total: z.number().min(0, 'Total cannot be negative'),
  notes: z.string().max(500, 'Notes too long').optional(),
}).refine(data => data.dueDate >= data.issueDate, {
  message: 'Due date cannot be before issue date',
  path: ['dueDate'],
})

// Validation helper functions
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  try {
    emailSchema.parse(email)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message }
    }
    return { isValid: false, error: 'Unknown validation error' }
  }
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  try {
    passwordSchema.parse(password)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message }
    }
    return { isValid: false, error: 'Unknown validation error' }
  }
}

export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  try {
    phoneSchema.parse(phone)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message }
    }
    return { isValid: false, error: 'Unknown validation error' }
  }
}

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
}

export function isStrongPassword(password: string): boolean {
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const hasMinLength = password.length >= 8

  return hasLower && hasUpper && hasNumber && hasSpecial && hasMinLength
}

export function calculatePasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Use at least 8 characters')
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add lowercase letters')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add uppercase letters')
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Add numbers')
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add special characters')
  }

  if (password.length >= 12) {
    score += 1
  }

  return { score, feedback }
}

// Generic request validation function
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
  try {
    const validatedData = await schema.parseAsync(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}

// Synchronous version of validateRequest
export function validateRequestSync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}