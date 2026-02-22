import { sign, verify } from 'jsonwebtoken'
import { compareSync } from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET: string = process.env.JWT_SECRET || ''
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required')

const TOKEN_EXPIRY = '24h'

// Pre-computed bcrypt hashes (passwords NOT stored in plaintext)
const ADMIN_USERS: Record<string, { passwordHash: string; role: string }> = {
  admin: {
    passwordHash: '$2a$10$kTvgnmogOC8zhCv5yz22YOiUx/9hHeunfbRbWmA/hMHumJey5NXx6',
    role: 'superadmin'
  },
  maksym: {
    passwordHash: '$2a$10$5EGRSOoSx9mdZAQYsBxMBOmbxWdBip85lbsAqZSR/xYpCU7Lrr8DG',
    role: 'admin'
  }
}

export function authenticateAdmin(username: string, password: string): { success: boolean; token?: string; role?: string } {
  const user = ADMIN_USERS[username]
  if (!user) return { success: false }
  
  if (!compareSync(password, user.passwordHash)) return { success: false }
  
  const token = sign(
    { username, role: user.role, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  )
  
  return { success: true, token, role: user.role }
}

export function verifyToken(token: string): { valid: boolean; username?: string; role?: string } {
  try {
    const decoded = verify(token, JWT_SECRET) as any
    return { valid: true, username: decoded.username, role: decoded.role }
  } catch {
    return { valid: false }
  }
}

export function requireAuth(request: NextRequest): { authorized: boolean; username?: string; role?: string; error?: NextResponse } {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  
  const result = verifyToken(authHeader.slice(7))
  if (!result.valid) {
    return { authorized: false, error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) }
  }
  
  return { authorized: true, username: result.username, role: result.role }
}
