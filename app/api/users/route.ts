export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const db = getDb()
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search') || ''
    const filter = url.searchParams.get('filter') || 'all'
    const offset = (page - 1) * limit

    let query = db.from('users').select('id, telegram_id, system_uid, first_name, username, caps_balance, is_blocked, created_at, last_activity, total_referrals, ai_requests_count', { count: 'exact' })

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,username.ilike.%${search}%,telegram_id.ilike.%${search}%,system_uid.ilike.%${search}%`)
    }

    if (filter === 'blocked') query = query.eq('is_blocked', true)
    if (filter === 'active') query = query.eq('is_blocked', false)

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({ users: data || [], total: count || 0, page, limit })
  } catch (error) {
    console.error('Users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
