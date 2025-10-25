import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// SECURITY: Validate JWT secrets on module load
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is not set in production. Application cannot start without a secure JWT secret.');
  }
  console.warn('⚠️  WARNING: JWT_SECRET not set. Using insecure default for development only.');
}

if (!process.env.JWT_REFRESH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_REFRESH_SECRET environment variable is not set in production.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-DO-NOT-USE-IN-PRODUCTION'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m' // Changed from 7d to 15m for better security
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role?: string
  organizationId?: string
  firmId?: string
  firstName?: string
  lastName?: string
  permissions?: string[]
  id?: string
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'lexchrono',
      audience: 'lexchrono-users',
    })
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'lexchrono',
        audience: 'lexchrono-users',
      }) as JWTPayload
      
      return decoded
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'lexchrono',
      audience: 'lexchrono-refresh',
    })
  }

  static verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'lexchrono',
        audience: 'lexchrono-refresh',
      }) as { userId: string; type: string }
      
      if (decoded.type !== 'refresh') {
        return null
      }
      
      return { userId: decoded.userId }
    } catch (error) {
      console.error('Refresh token verification failed:', error)
      return null
    }
  }

  static extractTokenFromHeader(authorization: string): string | null {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null
    }
    
    return authorization.substring(7)
  }
}

// Export convenience functions for backward compatibility
export const hashPassword = AuthService.hashPassword
export const verifyPassword = AuthService.verifyPassword
export const generateToken = AuthService.generateToken
export const verifyToken = AuthService.verifyToken
export const generateRefreshToken = AuthService.generateRefreshToken
export const verifyRefreshToken = AuthService.verifyRefreshToken
export const extractTokenFromHeader = AuthService.extractTokenFromHeader

// Alias for common use cases
export const verifyAccessToken = AuthService.verifyToken
export const generateAccessToken = AuthService.generateToken

// Export auth middleware wrapper for API routes
export async function auth(req: Request): Promise<JWTPayload | null> {
  const authHeader = req.headers.get('authorization')
  const token = AuthService.extractTokenFromHeader(authHeader || '')
  
  if (!token) {
    return null
  }
  
  return AuthService.verifyToken(token)
}