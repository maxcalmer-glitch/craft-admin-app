import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { logAuditAction } from '@/lib/audit'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://craft-test-app.vercel.app'
const SECRET = 'craft-webhook-secret-2026'

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const { message } = await request.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Текст пуст' }, { status: 400 })

    const res = await fetch(`${API_URL}/api/admin/news/broadcast?secret=${SECRET}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.trim() })
    })
    const data = await res.json()

    await logAuditAction(auth.username!, 'NEWS_BROADCAST', `Рассылка новостей: ${message.substring(0, 50)}...`)

    return NextResponse.json(data)
  } catch (error) {
    console.error('News broadcast error:', error)
    return NextResponse.json({ error: 'Ошибка отправки' }, { status: 500 })
  }
}
