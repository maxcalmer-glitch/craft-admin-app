import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'
import { sendTelegramMessage } from '@/lib/telegram'
import { logAuditAction } from '@/lib/audit'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const { level } = await request.json()
    if (!['basic', 'vip'].includes(level)) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
    }

    const db = getDb()
    const { data: user } = await db.from('users').select('telegram_id, first_name').eq('id', params.id).single()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await db.from('users').update({ user_level: level }).eq('id', params.id)

    // Notify user
    if (level === 'vip') {
      await sendTelegramMessage(user.telegram_id, `👑 <b>Поздравляем! Вы получили VIP статус!</b>\n\n🎁 Бонусы VIP:\n• Безлимитный доступ к ИИ (без списания крышек)\n• Приоритетная поддержка\n\n🍺 Наслаждайтесь привилегиями!`)
    } else {
      await sendTelegramMessage(user.telegram_id, `ℹ️ Ваш статус изменён на <b>Basic</b>.`)
    }

    await logAuditAction(auth.username!, 'CHANGE_LEVEL', `${user.first_name} (${user.telegram_id}) → ${level.toUpperCase()}`, params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Level change error:', error)
    return NextResponse.json({ error: 'Failed to change level' }, { status: 500 })
  }
}
