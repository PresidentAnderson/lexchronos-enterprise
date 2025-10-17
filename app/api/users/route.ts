import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/jwt'
import { userSchema } from '@/lib/validation'
import { z } from 'zod'

// Mock user database - replace with actual database in production
const mockUsers = [
  {
    id: '1',
    email: 'user@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdGQVTYC8hNUCZW',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
]

function authenticateRequest(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization) {
    return null
  }

  const token = AuthService.extractTokenFromHeader(authorization)
  if (!token) {
    return null
  }

  return AuthService.verifyToken(token)
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const user = authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return users without passwords
    const usersWithoutPasswords = mockUsers.map(({ password, ...user }) => user)
    
    return NextResponse.json({ users: usersWithoutPasswords })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = userSchema.parse(body)
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === validatedData.email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }
    
    // Hash password
    const hashedPassword = await AuthService.hashPassword(validatedData.password)
    
    // Create new user
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      ...validatedData,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    mockUsers.push(newUser)
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser
    
    return NextResponse.json(
      { user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
