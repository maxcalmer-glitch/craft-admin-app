export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth'
import { checkLoginAttempt, recordLoginAttempt } from '@/lib/security'
import { logAuditAction } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    const { allowed, retryAfter } = checkLoginAttempt(ip)
    if (!allowed) {
      return NextResponse.json({ error: `Слишком много попыток. Подождите ${retryAfter}с` }, { status: 429 })
    }

    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Введите логин и пароль' }, { status: 400 })
    }

    const result = authenticateAdmin(username, password)
    
    if (!result.success) {
      recordLoginAttempt(ip, false)
      return NextResponse.json({ error: 'Неверные учетные данные' }, { status: 401 })
    }

    recordLoginAttempt(ip, true)
    await logAuditAction(username, 'LOGIN', `Успешный вход с IP: ${ip}`)

    return NextResponse.json({
      success: true,
      token: result.token,
      username,
      role: result.role
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
