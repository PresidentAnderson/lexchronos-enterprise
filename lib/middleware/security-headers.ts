/**
 * Security Headers Middleware
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateNonce } from '@/lib/validation/sanitize';

/**
 * Security Headers Configuration
 */
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    directives: Record<string, string[]>;
    reportOnly?: boolean;
  };
  strictTransportSecurity?: {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  xContentTypeOptions?: boolean;
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  xXssProtection?: '0' | '1' | '1; mode=block';
  referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  permissionsPolicy?: Record<string, string[]>;
  crossOriginEmbedderPolicy?: 'unsafe-none' | 'require-corp' | 'credentialless';
  crossOriginOpenerPolicy?: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin';
  crossOriginResourcePolicy?: 'same-site' | 'same-origin' | 'cross-origin';
}

/**
 * Default security headers configuration for LexChronos
 */
const defaultSecurityConfig: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Next.js requires this for development
        "'unsafe-eval'", // Next.js requires this for development
        'https://vercel.live',
        'https://vercel.com',
        'https://cdn.jsdelivr.net',
        'https://unpkg.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS
        'https://fonts.googleapis.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://vercel.com',
        'https://avatars.githubusercontent.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com'
      ],
      'connect-src': [
        "'self'",
        'https://api.lexchronos.com',
        'https://vercel.live',
        'wss://ws-us3.pusher.com', // If using Pusher for real-time features
        'https://vitals.vercel-analytics.com'
      ],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'child-src': ["'none'"],
      'worker-src': ["'self'", 'blob:'],
      'manifest-src': ["'self'"],
      'upgrade-insecure-requests': []
    },
    reportOnly: process.env.NODE_ENV === 'development'
  },
  
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  xContentTypeOptions: true,
  xFrameOptions: 'DENY',
  xXssProtection: '1; mode=block',
  referrerPolicy: 'strict-origin-when-cross-origin',
  
  permissionsPolicy: {
    'accelerometer': [],
    'ambient-light-sensor': [],
    'autoplay': ["'self'"],
    'battery': [],
    'camera': [],
    'cross-origin-isolated': [],
    'display-capture': [],
    'document-domain': [],
    'encrypted-media': [],
    'execution-while-not-rendered': ["'self'"],
    'execution-while-out-of-viewport': ["'self'"],
    'fullscreen': ["'self'"],
    'geolocation': [],
    'gyroscope': [],
    'keyboard-map': [],
    'magnetometer': [],
    'microphone': [],
    'midi': [],
    'navigation-override': [],
    'payment': ["'self'"],
    'picture-in-picture': [],
    'publickey-credentials-get': [],
    'screen-wake-lock': [],
    'sync-xhr': [],
    'usb': [],
    'web-share': [],
    'xr-spatial-tracking': []
  },
  
  crossOriginEmbedderPolicy: 'unsafe-none', // Required for some Next.js features
  crossOriginOpenerPolicy: 'same-origin-allow-popups',
  crossOriginResourcePolicy: 'same-origin'
};

/**
 * Environment-specific security configurations
 */
const environmentConfigs = {
  development: {
    ...defaultSecurityConfig,
    contentSecurityPolicy: {
      ...defaultSecurityConfig.contentSecurityPolicy!,
      directives: {
        ...defaultSecurityConfig.contentSecurityPolicy!.directives,
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://vercel.live',
          'https://vercel.com'
        ],
        'connect-src': [
          "'self'",
          'ws://localhost:*',
          'http://localhost:*',
          'https://vercel.live'
        ]
      },
      reportOnly: true
    }
  },
  
  production: {
    ...defaultSecurityConfig,
    contentSecurityPolicy: {
      ...defaultSecurityConfig.contentSecurityPolicy!,
      directives: {
        ...defaultSecurityConfig.contentSecurityPolicy!.directives,
        'script-src': [
          "'self'",
          // Remove unsafe-inline and unsafe-eval in production
          'https://vercel.live',
          'https://vercel.com'
        ],
        'upgrade-insecure-requests': [] // Force HTTPS
      },
      reportOnly: false
    },
    strictTransportSecurity: {
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true
    }
  }
};

/**
 * Get security configuration based on environment
 */
function getSecurityConfig(): SecurityHeadersConfig {
  const env = process.env.NODE_ENV || 'development';
  return environmentConfigs[env as keyof typeof environmentConfigs] || defaultSecurityConfig;
}

/**
 * Generate Content Security Policy header value
 */
function generateCSPHeader(directives: Record<string, string[]>, nonce?: string): string {
  const cspParts: string[] = [];
  
  for (const [directive, sources] of Object.entries(directives)) {
    if (sources.length === 0) {
      cspParts.push(directive);
    } else {
      let sourcesWithNonce = sources;
      
      // Add nonce to script-src if provided
      if (directive === 'script-src' && nonce) {
        sourcesWithNonce = [...sources, `'nonce-${nonce}'`];
      }
      
      cspParts.push(`${directive} ${sourcesWithNonce.join(' ')}`);
    }
  }
  
  return cspParts.join('; ');
}

/**
 * Generate Permissions Policy header value
 */
function generatePermissionsPolicyHeader(permissions: Record<string, string[]>): string {
  const policyParts: string[] = [];
  
  for (const [permission, allowlist] of Object.entries(permissions)) {
    if (allowlist.length === 0) {
      policyParts.push(`${permission}=()`);
    } else {
      policyParts.push(`${permission}=(${allowlist.join(' ')})`);
    }
  }
  
  return policyParts.join(', ');
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(
  handler: (req: NextRequest, nonce?: string) => Promise<NextResponse>,
  config?: Partial<SecurityHeadersConfig>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const securityConfig = { ...getSecurityConfig(), ...config };
    const nonce = generateNonce();
    
    // Execute the handler
    const response = await handler(req, nonce);
    
    // Set security headers
    setSecurityHeaders(response, securityConfig, nonce);
    
    return response;
  };
}

/**
 * Set security headers on response
 */
export function setSecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig,
  nonce?: string
): void {
  // Content Security Policy
  if (config.contentSecurityPolicy) {
    const cspValue = generateCSPHeader(config.contentSecurityPolicy.directives, nonce);
    const headerName = config.contentSecurityPolicy.reportOnly 
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
    response.headers.set(headerName, cspValue);
  }
  
  // Strict Transport Security
  if (config.strictTransportSecurity) {
    const hsts = config.strictTransportSecurity;
    let hstsValue = `max-age=${hsts.maxAge}`;
    if (hsts.includeSubDomains) hstsValue += '; includeSubDomains';
    if (hsts.preload) hstsValue += '; preload';
    response.headers.set('Strict-Transport-Security', hstsValue);
  }
  
  // X-Content-Type-Options
  if (config.xContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }
  
  // X-Frame-Options
  if (config.xFrameOptions) {
    response.headers.set('X-Frame-Options', config.xFrameOptions);
  }
  
  // X-XSS-Protection
  if (config.xXssProtection) {
    response.headers.set('X-XSS-Protection', config.xXssProtection);
  }
  
  // Referrer Policy
  if (config.referrerPolicy) {
    response.headers.set('Referrer-Policy', config.referrerPolicy);
  }
  
  // Permissions Policy
  if (config.permissionsPolicy) {
    const permissionsValue = generatePermissionsPolicyHeader(config.permissionsPolicy);
    response.headers.set('Permissions-Policy', permissionsValue);
  }
  
  // Cross-Origin-Embedder-Policy
  if (config.crossOriginEmbedderPolicy) {
    response.headers.set('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy);
  }
  
  // Cross-Origin-Opener-Policy
  if (config.crossOriginOpenerPolicy) {
    response.headers.set('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy);
  }
  
  // Cross-Origin-Resource-Policy
  if (config.crossOriginResourcePolicy) {
    response.headers.set('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy);
  }
  
  // Additional security headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  
  // Cache control for sensitive pages
  if (req.nextUrl.pathname.includes('/admin') || req.nextUrl.pathname.includes('/api/')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
}

/**
 * Strict security headers for admin pages
 */
export function withStrictSecurityHeaders(
  handler: (req: NextRequest, nonce?: string) => Promise<NextResponse>
) {
  const strictConfig: SecurityHeadersConfig = {
    ...getSecurityConfig(),
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"], // Minimal CSS allowance
        'img-src': ["'self'", 'data:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'object-src': ["'none'"],
        'media-src': ["'none'"],
        'child-src': ["'none'"],
        'worker-src': ["'none'"],
        'manifest-src': ["'none'"]
      },
      reportOnly: false
    },
    xFrameOptions: 'DENY',
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin'
  };
  
  return withSecurityHeaders(handler, strictConfig);
}

/**
 * API-specific security headers
 */
export function withAPISecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req);
    
    // API-specific headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // Remove potentially sensitive headers
    response.headers.delete('X-Powered-By');
    response.headers.delete('Server');
    
    // Add security headers
    response.headers.set('X-API-Version', '1.0');
    response.headers.set('X-Rate-Limit-Policy', 'enforced');
    
    return response;
  };
}

/**
 * Public page security headers (more permissive)
 */
export function withPublicSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  const publicConfig: SecurityHeadersConfig = {
    ...getSecurityConfig(),
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://www.google-analytics.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'img-src': ["'self'", 'https:', 'data:'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'connect-src': ["'self'", 'https://www.google-analytics.com'],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"]
      },
      reportOnly: false
    },
    xFrameOptions: 'SAMEORIGIN' // Allow embedding on same origin
  };
  
  return withSecurityHeaders(handler, publicConfig);
}

/**
 * Security headers validation
 */
export function validateSecurityHeaders(response: Response): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const required = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Referrer-Policy'
  ];
  
  const recommended = [
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'Permissions-Policy'
  ];
  
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check required headers
  for (const header of required) {
    if (!response.headers.get(header)) {
      missing.push(header);
    }
  }
  
  // Check recommended headers
  for (const header of recommended) {
    if (!response.headers.get(header)) {
      warnings.push(`Recommended header missing: ${header}`);
    }
  }
  
  // Additional security checks
  const csp = response.headers.get('Content-Security-Policy');
  if (csp && csp.includes("'unsafe-eval'")) {
    warnings.push("CSP contains 'unsafe-eval' which may be insecure");
  }
  
  const frameOptions = response.headers.get('X-Frame-Options');
  if (frameOptions && frameOptions.toUpperCase() === 'ALLOWALL') {
    warnings.push('X-Frame-Options set to ALLOWALL may allow clickjacking');
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}