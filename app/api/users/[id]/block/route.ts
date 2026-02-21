import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'
import { sendTelegramMessage, sendTelegramVideo } from '@/lib/telegram'
import { logAuditAction } from '@/lib/audit'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const { action, reason, video_url } = await request.json()
    const db = getDb()
    
    const { data: user } = await db.from('users').select('telegram_id, first_name').eq('id', params.id).single()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (action === 'block') {
      if (!reason) return NextResponse.json({ error: 'Укажите причину блокировки' }, { status: 400 })
      
      await db.from('users').update({ is_blocked: true, block_reason: reason }).eq('id', params.id)
      
      // Notify user with text
      await sendTelegramMessage(user.telegram_id, `🚫 <b>Ваш аккаунт заблокирован</b>\n\nПричина: ${reason}\n\nОбратитесь к администратору для разблокировки.`)
      
      // Send video if URL provided
      if (video_url?.trim()) {
        try {
          await sendTelegramVideo(user.telegram_id, video_url.trim(), `🚫 Блокировка: ${reason}`)
        } catch (e) {
          console.error('Failed to send block video:', e)
        }
      }
      
      await logAuditAction(auth.username!, 'BLOCK_USER', `Блокировка ${user.first_name} (${user.telegram_id}). Причина: ${reason}`, params.id)
    } else {
      await db.from('users').update({ is_blocked: false, block_reason: null }).eq('id', params.id)
      
      await sendTelegramMessage(user.telegram_id, `✅ <b>Ваш аккаунт разблокирован</b>\n\nДобро пожаловать обратно в CRAFT! 🍺`)
      
      await logAuditAction(auth.username!, 'UNBLOCK_USER', `Разблокировка ${user.first_name} (${user.telegram_id})`, params.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Block/unblock error:', error)
    return NextResponse.json({ error: 'Failed to update block status' }, { status: 500 })
  }
}
