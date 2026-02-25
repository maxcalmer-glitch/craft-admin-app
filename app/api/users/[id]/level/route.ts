export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { logAuditAction } from '@/lib/audit'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://craft-main-app.vercel.app'
const ADMIN_SECRET = 'craft-webhook-secret-2026'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const { level } = await request.json()
    if (!['basic', 'vip'].includes(level)) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
    }

    // Use backend endpoint — handles DB update, TG notification, and achievement check
    const res = await fetch(`${API_URL}/api/admin/user/${params.id}/level?secret=${ADMIN_SECRET}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level })
    })
    const result = await res.json()
    if (!result.success) return NextResponse.json({ error: result.error || 'Failed' }, { status: 400 })

    await logAuditAction(auth.username!, 'CHANGE_LEVEL', `User ${params.id} → ${level.toUpperCase()}`, params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Level change error:', error)
    return NextResponse.json({ error: 'Failed to change level' }, { status: 500 })
  }
}
