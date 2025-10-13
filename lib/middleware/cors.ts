/**
 * CORS Configuration and Middleware
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS Configuration
 */
export interface CORSOptions {
  origin: string | string[] | RegExp | ((origin: string) => boolean);
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

/**
 * Default CORS configuration for LexChronos
 */
const defaultCORSConfig: CORSOptions = {
  // Production origins - update these with your actual domains
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://lexchronos.com',
        'https://app.lexchronos.com',
        'https://api.lexchronos.com',
        /^https:\/\/.*\.lexchronos\.com$/
      ]
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ],
  
  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
    'HEAD'
  ],
  
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Client-Version',
    'X-Request-ID',
    'Accept',
    'Origin',
    'User-Agent'
  ],
  
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

/**
 * Environment-specific CORS configurations
 */
const environmentConfigs = {
  development: {
    ...defaultCORSConfig,
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://192.168.1.100:3000' // Add your local network IP if needed
    ]
  },
  
  staging: {
    ...defaultCORSConfig,
    origin: [
      'https://staging.lexchronos.com',
      'https://staging-api.lexchronos.com',
      /^https:\/\/.*\.staging\.lexchronos\.com$/
    ]
  },
  
  production: {
    ...defaultCORSConfig,
    origin: [
      'https://lexchronos.com',
      'https://app.lexchronos.com',
      'https://api.lexchronos.com',
      /^https:\/\/.*\.lexchronos\.com$/
    ]
  }
};

/**
 * Get CORS configuration based on environment
 */
function getCORSConfig(): CORSOptions {
  const env = process.env.NODE_ENV || 'development';
  return environmentConfigs[env as keyof typeof environmentConfigs] || defaultCORSConfig;
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null, allowedOrigins: CORSOptions['origin']): boolean {
  if (!origin) return false;
  
  if (typeof allowedOrigins === 'string') {
    return origin === allowedOrigins;
  }
  
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
  }
  
  if (allowedOrigins instanceof RegExp) {
    return allowedOrigins.test(origin);
  }
  
  if (typeof allowedOrigins === 'function') {
    return allowedOrigins(origin);
  }
  
  return false;
}

/**
 * CORS middleware for Next.js API routes
 */
export function withCORS(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: Partial<CORSOptions>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const config = { ...getCORSConfig(), ...options };
    const origin = req.headers.get('origin');
    const method = req.method;

    // Handle preflight OPTIONS request
    if (method === 'OPTIONS') {
      const response = new NextResponse(null, { status: config.optionsSuccessStatus || 204 });
      
      // Set CORS headers for preflight
      if (origin && isOriginAllowed(origin, config.origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
      
      response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
      response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
      
      if (config.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      if (config.maxAge) {
        response.headers.set('Access-Control-Max-Age', config.maxAge.toString());
      }
      
      return response;
    }

    // Process the actual request
    const response = await handler(req);

    // Set CORS headers for actual request
    if (origin && isOriginAllowed(origin, config.origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    if (config.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Security headers
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));

    return response;
  };
}

/**
 * Strict CORS middleware for sensitive endpoints
 */
export function withStrictCORS(
  handler: (req: NextRequest) => Promise<NextResponse>,
  allowedOrigins: string[]
) {
  const strictConfig: CORSOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 300 // 5 minutes only
  };

  return withCORS(handler, strictConfig);
}

/**
 * Public API CORS middleware (more permissive)
 */
export function withPublicCORS(handler: (req: NextRequest) => Promise<NextResponse>) {
  const publicConfig: CORSOptions = {
    origin: '*',
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key'],
    credentials: false,
    maxAge: 3600 // 1 hour
  };

  return withCORS(handler, publicConfig);
}

/**
 * Mobile app CORS middleware
 */
export function withMobileCORS(handler: (req: NextRequest) => Promise<NextResponse>) {
  const mobileConfig: CORSOptions = {
    origin: (origin) => {
      // Allow mobile apps (they might not send origin header)
      if (!origin) return true;
      
      // Allow specific mobile app schemes
      return origin.startsWith('lexchronos-mobile://') || 
             origin.startsWith('capacitor://') ||
             origin.startsWith('ionic://');
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Mobile-Version',
      'X-Device-ID'
    ],
    credentials: true,
    maxAge: 86400
  };

  return withCORS(handler, mobileConfig);
}

/**
 * Development-only CORS middleware (very permissive)
 */
export function withDevCORS(handler: (req: NextRequest) => Promise<NextResponse>) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development CORS should not be used in production');
  }

  const devConfig: CORSOptions = {
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['*'],
    credentials: true,
    maxAge: 86400
  };

  return withCORS(handler, devConfig);
}

/**
 * CORS validation utility
 */
export function validateCORSRequest(req: NextRequest): {
  valid: boolean;
  origin: string | null;
  errors: string[];
} {
  const origin = req.headers.get('origin');
  const method = req.method;
  const errors: string[] = [];
  
  const config = getCORSConfig();

  // Check origin
  if (origin && !isOriginAllowed(origin, config.origin)) {
    errors.push(`Origin '${origin}' is not allowed`);
  }

  // Check method
  if (!config.methods.includes(method)) {
    errors.push(`Method '${method}' is not allowed`);
  }

  // Check required headers for non-simple requests
  const contentType = req.headers.get('content-type');
  if (method !== 'GET' && method !== 'HEAD' && method !== 'POST') {
    if (!req.headers.get('access-control-request-method')) {
      // This is a complex request without preflight
      errors.push('Complex request requires preflight');
    }
  }

  return {
    valid: errors.length === 0,
    origin,
    errors
  };
}

/**
 * Log CORS violations
 */
export async function logCORSViolation(req: NextRequest, violation: string) {
  const origin = req.headers.get('origin');
  const method = req.method;
  const userAgent = req.headers.get('user-agent');
  
  console.warn('CORS Violation:', {
    violation,
    origin,
    method,
    userAgent,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  // In production, you might want to send this to your logging service
  if (process.env.NODE_ENV === 'production') {
    // await sendToLoggingService({
    //   type: 'cors_violation',
    //   violation,
    //   origin,
    //   method,
    //   userAgent,
    //   url: req.url
    // });
  }
}

/**
 * Security-enhanced CORS middleware with violation logging
 */
export function withSecureCORS(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const validation = validateCORSRequest(req);
    
    if (!validation.valid) {
      // Log the violation
      await logCORSViolation(req, validation.errors.join(', '));
      
      // Return error response
      return NextResponse.json(
        { error: 'CORS policy violation', details: validation.errors },
        { status: 403 }
      );
    }

    return withCORS(handler)(req);
  };
}