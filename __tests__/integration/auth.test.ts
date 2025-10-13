import { NextRequest } from 'next/server'
import { POST as loginPost } from '../../app/api/auth/login/route'
import { POST as usersPost, GET as usersGet } from '../../app/api/users/route'
import { AuthService } from '../../lib/auth/jwt'

// Mock the NextRequest
function createMockRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: (name: string) => headers[name] || null,
    },
  } as NextRequest
}

// Mock console methods for cleaner test output
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('Authentication API Integration Tests', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123',
      }

      const request = createMockRequest(loginData)
      const response = await loginPost(request)
      
      expect(response.status).toBe(200)
      
      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('user')
      expect(responseBody).toHaveProperty('accessToken')
      expect(responseBody).toHaveProperty('refreshToken')
      expect(responseBody.user).not.toHaveProperty('password')
      expect(responseBody.user.email).toBe(loginData.email)
    })

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'wrongpassword',
      }

      const request = createMockRequest(loginData)
      const response = await loginPost(request)
      
      expect(response.status).toBe(401)
      
      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('error')
      expect(responseBody.error).toBe('Invalid credentials')
    })

    it('should reject non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      }

      const request = createMockRequest(loginData)
      const response = await loginPost(request)
      
      expect(response.status).toBe(401)
      
      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('error')
      expect(responseBody.error).toBe('Invalid credentials')
    })

    it('should validate request body', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '',
      }

      const request = createMockRequest(invalidData)
      const response = await loginPost(request)
      
      expect(response.status).toBe(400)
      
      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('error')
      expect(responseBody.error).toBe('Validation failed')
      expect(responseBody).toHaveProperty('details')
    })

    it('should generate valid JWT tokens', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123',
      }

      const request = createMockRequest(loginData)
      const response = await loginPost(request)
      
      const responseBody = await response.json()
      const { accessToken, refreshToken } = responseBody

      // Verify access token
      const accessPayload = AuthService.verifyToken(accessToken)
      expect(accessPayload).toBeTruthy()
      expect(accessPayload?.email).toBe(loginData.email)

      // Verify refresh token
      const refreshPayload = AuthService.verifyRefreshToken(refreshToken)
      expect(refreshPayload).toBeTruthy()
      expect(refreshPayload?.userId).toBeTruthy()
    })
  })

  describe('POST /api/users (User Registration)', () => {
    it('should create new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'NewPassword123',
        firstName: 'New',
        lastName: 'User',
      }

      const request = createMockRequest(userData)
      const response = await usersPost(request)
      
      expect(response.status).toBe(201)
      
      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('user')
      expect(responseBody.user).not.toHaveProperty('password')
      expect(responseBody.user.email).toBe(userData.email)
      expect(responseBody.user.firstName).toBe(userData.firstName)
      expect(responseBody.user.lastName).toBe(userData.lastName)
    })

    it('should reject duplicate email addresses', async () => {
      const userData = {
        email: 'user@example.com', // This email already exists
        password: 'NewPassword123',
        firstName: 'Duplicate',
        lastName: 'User',
      }

      const request = createMockRequest(userData)
      const response = await usersPost(request)
      
      expect(response.status).toBe(409)
      
      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('error')
      expect(responseBody.error).toBe('User already exists')
    })

    it('should validate user data', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: 'weak',
        firstName: '',
        lastName: '',
      }

      const request = createMockRequest(invalidUserData)
      const response = await usersPost(request)
      
      expect(response.status).toBe(400)
      
      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('error')
      expect(responseBody.error).toBe('Validation failed')
      expect(responseBody).toHaveProperty('details')
    })

    it('should hash passwords before storing', async () => {
      const userData = {
        email: 'hasheduser@example.com',
        password: 'TestPassword123',
        firstName: 'Hashed',
        lastName: 'User',
      }

      const request = createMockRequest(userData)
      const response = await usersPost(request)
      
      expect(response.status).toBe(201)
      
      // The password should be hashed and not returned in response
      const responseBody = await response.json()
      expect(responseBody.user).not.toHaveProperty('password')
    })
  })

  describe('GET /api/users (Protected Route)', () => {
    let validToken: string

    beforeAll(async () => {
      // Get a valid token for testing protected routes
      const loginData = { email: 'user@example.com', password: 'password123' }
      const request = createMockRequest(loginData)
      const response = await loginPost(request)
      const responseBody = await response.json()
      validToken = responseBody.accessToken
    })

    it('should return users for authenticated requests', async () => {
      const request = createMockRequest({}, {
        'authorization': `Bearer ${validToken}`
      })
      const response = await usersGet(request)
      
      expect(response.status).toBe(200)
      
      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('users')
      expect(Array.isArray(responseBody.users)).toBe(true)
      
      // Ensure no passwords are returned
      responseBody.users.forEach((user: any) => {
        expect(user).not.toHaveProperty('password')
      })
    })

    it('should reject requests without authorization', async () => {
      const request = createMockRequest({})
      const response = await usersGet(request)
      
      expect(response.status).toBe(401)
      
      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('error')
      expect(responseBody.error).toBe('Unauthorized')
    })

    it('should reject requests with invalid tokens', async () => {
      const request = createMockRequest({}, {
        'authorization': 'Bearer invalid-token'
      })
      const response = await usersGet(request)
      
      expect(response.status).toBe(401)
      
      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('error')
      expect(responseBody.error).toBe('Unauthorized')
    })

    it('should reject requests with malformed authorization header', async () => {
      const request = createMockRequest({}, {
        'authorization': 'Malformed token'
      })
      const response = await usersGet(request)
      
      expect(response.status).toBe(401)
      
      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('error')
      expect(responseBody.error).toBe('Unauthorized')
    })
  })
})

describe('AuthService Integration Tests', () => {
  describe('Password Operations', () => {
    it('should hash and verify passwords correctly', async () => {
      const password = 'TestPassword123!'
      
      const hashedPassword = await AuthService.hashPassword(password)
      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(50) // bcrypt hashes are long
      
      const isValid = await AuthService.verifyPassword(password, hashedPassword)
      expect(isValid).toBe(true)
      
      const isInvalid = await AuthService.verifyPassword('wrongpassword', hashedPassword)
      expect(isInvalid).toBe(false)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!'
      
      const hash1 = await AuthService.hashPassword(password)
      const hash2 = await AuthService.hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
      
      // But both should verify correctly
      expect(await AuthService.verifyPassword(password, hash1)).toBe(true)
      expect(await AuthService.verifyPassword(password, hash2)).toBe(true)
    })
  })

  describe('Token Operations', () => {
    const testPayload = {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'user'
    }

    it('should generate and verify access tokens', () => {
      const token = AuthService.generateToken(testPayload)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      
      const decoded = AuthService.verifyToken(token)
      expect(decoded).toBeTruthy()
      expect(decoded?.userId).toBe(testPayload.userId)
      expect(decoded?.email).toBe(testPayload.email)
      expect(decoded?.role).toBe(testPayload.role)
    })

    it('should generate and verify refresh tokens', () => {
      const refreshToken = AuthService.generateRefreshToken(testPayload.userId)
      expect(refreshToken).toBeDefined()
      expect(typeof refreshToken).toBe('string')
      
      const decoded = AuthService.verifyRefreshToken(refreshToken)
      expect(decoded).toBeTruthy()
      expect(decoded?.userId).toBe(testPayload.userId)
    })

    it('should reject invalid tokens', () => {
      expect(AuthService.verifyToken('invalid-token')).toBeNull()
      expect(AuthService.verifyRefreshToken('invalid-refresh-token')).toBeNull()
    })

    it('should extract token from authorization header', () => {
      const token = 'test-token-123'
      const header = `Bearer ${token}`
      
      const extracted = AuthService.extractTokenFromHeader(header)
      expect(extracted).toBe(token)
    })

    it('should return null for invalid authorization headers', () => {
      expect(AuthService.extractTokenFromHeader('')).toBeNull()
      expect(AuthService.extractTokenFromHeader('Invalid header')).toBeNull()
      expect(AuthService.extractTokenFromHeader('Basic token')).toBeNull()
    })
  })
})