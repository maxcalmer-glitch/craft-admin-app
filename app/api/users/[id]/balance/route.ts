import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'
import { logAuditAction } from '@/lib/audit'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const { amount, reason } = await request.json()
    if (!amount || isNaN(amount)) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

    const db = getDb()
    const { data: user } = await db.from('users').select('caps_balance, first_name, telegram_id').eq('id', params.id).single()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const newBalance = user.caps_balance + parseInt(amount)
    if (newBalance < 0) return NextResponse.json({ error: 'Баланс не может быть отрицательным' }, { status: 400 })

    const { error } = await db.from('users').update({ caps_balance: newBalance }).eq('id', params.id)
    if (error) throw error

    await logAuditAction(
      auth.username!,
      'BALANCE_CHANGE',
      `Изменение баланса ${user.first_name}: ${user.caps_balance} → ${newBalance} (${amount > 0 ? '+' : ''}${amount}). Причина: ${reason || 'не указана'}`,
      params.id
    )

    return NextResponse.json({ success: true, newBalance })
  } catch (error) {
    console.error('Balance change error:', error)
    return NextResponse.json({ error: 'Failed to change balance' }, { status: 500 })
  }
}
