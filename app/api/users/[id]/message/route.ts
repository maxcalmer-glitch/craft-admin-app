import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'
import { sendTelegramMessage } from '@/lib/telegram'
import { logAuditAction } from '@/lib/audit'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const { text } = await request.json()
    if (!text?.trim()) return NextResponse.json({ error: 'Текст сообщения пуст' }, { status: 400 })

    const db = getDb()
    const { data: user } = await db.from('users').select('telegram_id, first_name').eq('id', params.id).single()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const result = await sendTelegramMessage(user.telegram_id, text)
    
    await logAuditAction(auth.username!, 'SEND_MESSAGE', `Сообщение пользователю ${user.first_name} (${user.telegram_id})`, params.id)

    return NextResponse.json({ success: result.ok, error: result.ok ? undefined : result.description })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
