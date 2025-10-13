/**
 * Session Management System
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionData, User, JWTPayload } from '@/types/security/auth';
import { generateSecureId, createSignature, verifySignature } from '@/lib/encryption/crypto';
import { logAuditEvent } from '@/lib/audit/logger';

/**
 * Session configuration
 */
const SESSION_CONFIG = {
  maxSessions: 5, // Maximum concurrent sessions per user
  sessionTimeout: 60 * 60 * 1000, // 1 hour in milliseconds
  renewalThreshold: 15 * 60 * 1000, // Renew if less than 15 minutes remaining
  cleanupInterval: 5 * 60 * 1000, // Clean up expired sessions every 5 minutes
  cookieName: 'lexchronos-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 // 1 hour
  }
};

/**
 * Session storage interface
 */
interface SessionStore {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, data: SessionData): Promise<void>;
  delete(sessionId: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  getByUserId(userId: string): Promise<SessionData[]>;
  cleanup(): Promise<void>;
}

/**
 * In-memory session store (for development)
 * In production, use Redis or database
 */
class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, SessionData>();
  
  async get(sessionId: string): Promise<SessionData | null> {
    return this.sessions.get(sessionId) || null;
  }
  
  async set(sessionId: string, data: SessionData): Promise<void> {
    this.sessions.set(sessionId, data);
  }
  
  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
  
  async deleteByUserId(userId: string): Promise<void> {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }
  
  async getByUserId(userId: string): Promise<SessionData[]> {
    const userSessions: SessionData[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    }
    return userSessions;
  }
  
  async cleanup(): Promise<void> {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

/**
 * Session Manager class
 */
export class SessionManager {
  private static instance: SessionManager;
  private store: SessionStore;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Initialize session store based on environment
    this.store = this.initializeStore();
    this.startCleanupInterval();
  }
  
  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
  
  private initializeStore(): SessionStore {
    // In production, you would use Redis or database
    // if (process.env.REDIS_URL) {
    //   return new RedisSessionStore(process.env.REDIS_URL);
    // }
    
    return new MemorySessionStore();
  }
  
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.store.cleanup();
      } catch (error) {
        console.error('Session cleanup failed:', error);
      }
    }, SESSION_CONFIG.cleanupInterval);
  }
  
  /**
   * Create a new session
   */
  public async createSession(
    user: User | JWTPayload,
    req: NextRequest
  ): Promise<{ sessionId: string; response: NextResponse }> {
    const sessionId = generateSecureId(64);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_CONFIG.sessionTimeout);
    
    // Check for existing sessions and enforce limit
    const existingSessions = await this.store.getByUserId(user.userId);
    if (existingSessions.length >= SESSION_CONFIG.maxSessions) {
      // Remove oldest session
      const oldestSession = existingSessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      await this.store.delete(oldestSession.sessionId);
      
      await logAuditEvent(
        'session_limit_exceeded',
        'session',
        { sessionId: oldestSession.sessionId, action: 'oldest_removed' },
        req,
        user.userId
      );
    }
    
    const sessionData: SessionData = {
      userId: user.userId,
      sessionId,
      ipAddress: this.getClientIP(req),
      userAgent: req.headers.get('user-agent') || 'unknown',
      createdAt: now,
      expiresAt,
      isActive: true
    };
    
    await this.store.set(sessionId, sessionData);
    
    // Create secure cookie
    const response = new NextResponse();
    this.setSessionCookie(response, sessionId);
    
    await logAuditEvent(
      'session_created',
      'session',
      { sessionId, expiresAt },
      req,
      user.userId
    );
    
    return { sessionId, response };
  }
  
  /**
   * Validate and get session
   */
  public async getSession(sessionId: string): Promise<SessionData | null> {
    if (!sessionId) return null;
    
    const session = await this.store.get(sessionId);
    if (!session) return null;
    
    // Check if session is expired
    if (session.expiresAt < new Date() || !session.isActive) {
      await this.store.delete(sessionId);
      return null;
    }
    
    return session;
  }
  
  /**
   * Renew session if close to expiry
   */
  public async renewSession(sessionId: string, req?: NextRequest): Promise<SessionData | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;
    
    const now = new Date();
    const timeToExpiry = session.expiresAt.getTime() - now.getTime();
    
    // Renew if less than threshold remaining
    if (timeToExpiry < SESSION_CONFIG.renewalThreshold) {
      session.expiresAt = new Date(now.getTime() + SESSION_CONFIG.sessionTimeout);
      await this.store.set(sessionId, session);
      
      if (req) {
        await logAuditEvent(
          'session_renewed',
          'session',
          { sessionId, newExpiresAt: session.expiresAt },
          req,
          session.userId
        );
      }
    }
    
    return session;
  }
  
  /**
   * Destroy session
   */
  public async destroySession(
    sessionId: string, 
    req?: NextRequest
  ): Promise<NextResponse> {
    const session = await this.store.get(sessionId);
    await this.store.delete(sessionId);
    
    const response = new NextResponse();
    this.clearSessionCookie(response);
    
    if (session && req) {
      await logAuditEvent(
        'session_destroyed',
        'session',
        { sessionId },
        req,
        session.userId
      );
    }
    
    return response;
  }
  
  /**
   * Destroy all sessions for a user
   */
  public async destroyAllUserSessions(userId: string, req?: NextRequest): Promise<void> {
    const sessions = await this.store.getByUserId(userId);
    await this.store.deleteByUserId(userId);
    
    if (req) {
      await logAuditEvent(
        'all_sessions_destroyed',
        'session',
        { sessionCount: sessions.length },
        req,
        userId
      );
    }
  }
  
  /**
   * Get all active sessions for a user
   */
  public async getUserSessions(userId: string): Promise<SessionData[]> {
    return this.store.getByUserId(userId);
  }
  
  /**
   * Set session cookie
   */
  private setSessionCookie(response: NextResponse, sessionId: string): void {
    const cookieValue = this.createSecureCookieValue(sessionId);
    
    response.cookies.set(SESSION_CONFIG.cookieName, cookieValue, {
      ...SESSION_CONFIG.cookieOptions,
      expires: new Date(Date.now() + SESSION_CONFIG.sessionTimeout)
    });
  }
  
  /**
   * Clear session cookie
   */
  private clearSessionCookie(response: NextResponse): void {
    response.cookies.delete(SESSION_CONFIG.cookieName);
  }
  
  /**
   * Create secure cookie value with signature
   */
  private createSecureCookieValue(sessionId: string): string {
    const timestamp = Date.now().toString();
    const signature = createSignature(`${sessionId}.${timestamp}`);
    return `${sessionId}.${timestamp}.${signature}`;
  }
  
  /**
   * Parse and verify secure cookie value
   */
  private parseSecureCookieValue(cookieValue: string): string | null {
    const parts = cookieValue.split('.');
    if (parts.length !== 3) return null;
    
    const [sessionId, timestamp, signature] = parts;
    const expectedSignature = createSignature(`${sessionId}.${timestamp}`);
    
    if (!verifySignature(`${sessionId}.${timestamp}`, signature)) {
      return null;
    }
    
    // Check if cookie timestamp is too old (potential replay attack)
    const cookieAge = Date.now() - parseInt(timestamp, 10);
    if (cookieAge > SESSION_CONFIG.sessionTimeout) {
      return null;
    }
    
    return sessionId;
  }
  
  /**
   * Get client IP address
   */
  private getClientIP(req: NextRequest): string {
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
   * Shutdown cleanup
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Session middleware for Next.js
 */
export function withSession(
  handler: (req: NextRequest, session?: SessionData) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const sessionManager = SessionManager.getInstance();
    let session: SessionData | null = null;
    
    // Get session ID from cookie
    const cookieValue = req.cookies.get(SESSION_CONFIG.cookieName)?.value;
    if (cookieValue) {
      const sessionId = sessionManager['parseSecureCookieValue'](cookieValue);
      if (sessionId) {
        session = await sessionManager.renewSession(sessionId, req);
      }
    }
    
    const response = await handler(req, session);
    
    // Update session cookie if session was renewed
    if (session) {
      const renewedSession = await sessionManager.getSession(session.sessionId);
      if (renewedSession && renewedSession.expiresAt.getTime() !== session.expiresAt.getTime()) {
        sessionManager['setSessionCookie'](response, session.sessionId);
      }
    }
    
    return response;
  };
}

/**
 * Require valid session middleware
 */
export function requireSession(
  handler: (req: NextRequest, session: SessionData) => Promise<NextResponse>
) {
  return withSession(async (req: NextRequest, session?: SessionData): Promise<NextResponse> => {
    if (!session) {
      await logAuditEvent(
        'unauthorized_access_attempt',
        'session',
        { path: req.nextUrl.pathname },
        req
      );
      
      return NextResponse.json(
        { error: 'Valid session required' },
        { status: 401 }
      );
    }
    
    // Verify session is still valid by checking IP (optional security measure)
    const currentIP = SessionManager.getInstance()['getClientIP'](req);
    if (session.ipAddress !== currentIP) {
      await logAuditEvent(
        'session_ip_mismatch',
        'session',
        { 
          sessionIP: session.ipAddress, 
          requestIP: currentIP,
          sessionId: session.sessionId 
        },
        req,
        session.userId
      );
      
      // Optionally destroy session on IP mismatch
      // await SessionManager.getInstance().destroySession(session.sessionId, req);
      // return NextResponse.json({ error: 'Session security violation' }, { status: 401 });
    }
    
    return handler(req, session);
  });
}

/**
 * Create login response with session
 */
export async function createLoginResponse(
  user: User | JWTPayload,
  req: NextRequest
): Promise<NextResponse> {
  const sessionManager = SessionManager.getInstance();
  const { sessionId, response } = await sessionManager.createSession(user, req);
  
  // Return success response with user info
  response.headers.set('Content-Type', 'application/json');
  
  const responseData = {
    success: true,
    user: {
      id: user.userId,
      email: 'email' in user ? user.email : undefined,
      role: user.role,
      firmId: user.firmId
    },
    sessionId,
    expiresAt: new Date(Date.now() + SESSION_CONFIG.sessionTimeout).toISOString()
  };
  
  return NextResponse.json(responseData, { 
    status: 200,
    headers: response.headers 
  });
}

/**
 * Create logout response
 */
export async function createLogoutResponse(
  req: NextRequest
): Promise<NextResponse> {
  const sessionManager = SessionManager.getInstance();
  const cookieValue = req.cookies.get(SESSION_CONFIG.cookieName)?.value;
  
  if (cookieValue) {
    const sessionId = sessionManager['parseSecureCookieValue'](cookieValue);
    if (sessionId) {
      return sessionManager.destroySession(sessionId, req);
    }
  }
  
  const response = new NextResponse();
  sessionManager['clearSessionCookie'](response);
  
  return NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200, headers: response.headers }
  );
}

/**
 * Get session info endpoint
 */
export async function getSessionInfo(req: NextRequest): Promise<NextResponse> {
  return withSession(async (req: NextRequest, session?: SessionData): Promise<NextResponse> => {
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    return NextResponse.json({
      authenticated: true,
      userId: session.userId,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString()
    });
  })(req);
}