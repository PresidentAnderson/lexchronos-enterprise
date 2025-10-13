/**
 * Input Sanitization Utilities
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 */

import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

/**
 * HTML Sanitization options for different contexts
 */
const sanitizerOptions = {
  strict: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  },
  basic: {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  },
  rich: {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true
  }
};

/**
 * Sanitize HTML content based on context
 */
export function sanitizeHTML(input: string, level: 'strict' | 'basic' | 'rich' = 'basic'): string {
  if (!input || typeof input !== 'string') return '';
  
  return DOMPurify.sanitize(input, sanitizerOptions[level]);
}

/**
 * Sanitize plain text input - removes all HTML and potentially harmful content
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return validator.escape(input)
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  return validator.normalizeEmail(email, {
    gmail_lowercase: true,
    gmail_remove_dots: false,
    outlookdotcom_lowercase: true,
    yahoo_lowercase: true,
    icloud_lowercase: true
  }) || '';
}

/**
 * Sanitize URLs
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  // Remove potentially dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  const lowerUrl = url.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }
  
  // Only allow http and https
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  }) ? url : '';
}

/**
 * Sanitize phone numbers
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all non-digit characters except +, spaces, hyphens, parentheses, and dots
  return phone.replace(/[^\d+\s\-\(\)\.]/g, '').trim();
}

/**
 * Sanitize file names
 */
export function sanitizeFileName(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  
  // Remove or replace dangerous characters
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Replace dangerous chars with underscore
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 255) // Limit length
    .toLowerCase();
}

/**
 * Sanitize JSON input - prevents JSON injection
 */
export function sanitizeJSON(input: string): any {
  if (!input || typeof input !== 'string') return null;
  
  try {
    // First sanitize the string
    const sanitized = input.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    // Parse and stringify to ensure valid JSON
    const parsed = JSON.parse(sanitized);
    return JSON.parse(JSON.stringify(parsed)); // Double parse to ensure safety
  } catch (error) {
    return null;
  }
}

/**
 * Sanitize SQL-like input (for search queries, etc.)
 */
export function sanitizeQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  
  // Remove SQL injection patterns
  return query
    .replace(/[';--]/g, '') // Remove SQL comment and statement terminators
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '') // Remove SQL keywords
    .replace(/[<>'"]/g, '') // Remove potentially harmful characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Sanitize legal document content
 */
export function sanitizeLegalContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  
  // For legal documents, we want to preserve formatting but remove dangerous content
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot',
      'div', 'span', 'section', 'article'
    ],
    ALLOWED_ATTR: ['class', 'id', 'style'],
    ALLOWED_URI_REGEXP: /^https?:\/\//,
    KEEP_CONTENT: true
  });
  
  return sanitized;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any, depth: number = 0): any {
  // Prevent deep recursion
  if (depth > 10) return obj;
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeText(key);
      sanitized[sanitizedKey] = sanitizeObject(value, depth + 1);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Validate and sanitize IP address
 */
export function sanitizeIP(ip: string): string {
  if (!ip || typeof ip !== 'string') return '';
  
  // Handle IPv6 and IPv4
  if (validator.isIP(ip)) {
    return ip;
  }
  
  // Extract IPv4 from IPv6 mapping
  const ipv4Match = ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
  if (ipv4Match && validator.isIP(ipv4Match[1], 4)) {
    return ipv4Match[1];
  }
  
  return '';
}

/**
 * Sanitize user agent string
 */
export function sanitizeUserAgent(userAgent: string): string {
  if (!userAgent || typeof userAgent !== 'string') return '';
  
  return userAgent
    .replace(/[<>'"]/g, '') // Remove potentially harmful characters
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .substring(0, 500) // Limit length
    .trim();
}

/**
 * Sanitize database field name
 */
export function sanitizeFieldName(fieldName: string): string {
  if (!fieldName || typeof fieldName !== 'string') return '';
  
  // Only allow alphanumeric characters and underscores
  return fieldName.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 64);
}

/**
 * Sanitize sort direction
 */
export function sanitizeSortDirection(direction: string): 'asc' | 'desc' {
  if (!direction || typeof direction !== 'string') return 'desc';
  
  const normalized = direction.toLowerCase().trim();
  return normalized === 'asc' ? 'asc' : 'desc';
}

/**
 * Remove null bytes and control characters
 */
export function removeControlCharacters(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate and sanitize pagination parameters
 */
export function sanitizePagination(page?: string | number, limit?: string | number) {
  let sanitizedPage = 1;
  let sanitizedLimit = 20;
  
  if (page) {
    const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
    if (!isNaN(parsedPage) && parsedPage > 0) {
      sanitizedPage = Math.min(parsedPage, 1000); // Max page limit
    }
  }
  
  if (limit) {
    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      sanitizedLimit = Math.min(parsedLimit, 100); // Max limit
    }
  }
  
  return { page: sanitizedPage, limit: sanitizedLimit };
}

/**
 * Content Security Policy nonce generator
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}