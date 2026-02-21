import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'
import { sendTelegramMessage, sendTelegramPhoto } from '@/lib/telegram'
import { logAuditAction } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!
  
  try {
    const db = getDb()
    const { data } = await db.from('broadcast_history').select('*').order('created_at', { ascending: false }).limit(20)
    return NextResponse.json({ history: data || [] })
  } catch {
    return NextResponse.json({ history: [] })
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const { message, photo_url } = await request.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Текст рассылки пуст' }, { status: 400 })

    const db = getDb()
    
    // Get all non-blocked users
    const { data: users } = await db.from('users').select('telegram_id').eq('is_blocked', false)
    if (!users || users.length === 0) return NextResponse.json({ error: 'Нет пользователей для рассылки' }, { status: 400 })

    let sent = 0, failed = 0

    // Send to all users with delay to avoid rate limits
    for (const user of users) {
      try {
        let result
        if (photo_url) {
          result = await sendTelegramPhoto(user.telegram_id, photo_url, message)
        } else {
          result = await sendTelegramMessage(user.telegram_id, message)
        }
        if (result.ok) sent++; else failed++
      } catch { failed++ }
      
      // Small delay to avoid Telegram rate limits
      await new Promise(r => setTimeout(r, 50))
    }

    // Save to history
    try {
      await db.from('broadcast_history').insert({
        message,
        photo_url: photo_url || null,
        total_sent: users.length,
        total_delivered: sent,
        total_failed: failed,
        admin_username: auth.username,
      })
    } catch {}

    await logAuditAction(auth.username!, 'BROADCAST', `Рассылка: ${sent} доставлено, ${failed} ошибок из ${users.length}`)

    return NextResponse.json({ success: true, sent, failed, total: users.length })
  } catch (error) {
    console.error('Broadcast error:', error)
    return NextResponse.json({ error: 'Broadcast failed' }, { status: 500 })
  }
}
