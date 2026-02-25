export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const db = getDb()
    
    // Get user's telegram_id
    const { data: user } = await db.from('users').select('telegram_id').eq('id', params.id).single()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: messages } = await db
      .from('admin_messages')
      .select('*')
      .eq('user_telegram_id', user.telegram_id)
      .order('created_at', { ascending: true })
      .limit(100)

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json({ messages: [] })
  }
}
