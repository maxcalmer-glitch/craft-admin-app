export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const db = getDb()
    const today = new Date(); today.setHours(0, 0, 0, 0)

    const [
      { count: totalUsers },
      { count: newToday },
      { count: activeToday },
      { data: aiData },
      { data: balanceData },
      { count: totalReferrals },
      { count: pendingApplications },
    ] = await Promise.all([
      db.from('users').select('*', { count: 'exact', head: true }),
      db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      db.from('users').select('*', { count: 'exact', head: true }).gte('last_activity', today.toISOString()),
      db.from('ai_conversations').select('tokens_used, cost_usd'),
      db.from('users').select('caps_balance, total_earned_caps, total_spent_caps'),
      db.from('referrals').select('*', { count: 'exact', head: true }),
      db.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    const totalAiRequests = aiData?.length || 0
    const aiCostUsd = aiData?.reduce((s, r) => s + (r.cost_usd || 0), 0) || 0
    const totalCapsOnBalances = balanceData?.reduce((s, u) => s + (u.caps_balance || 0), 0) || 0
    const totalCapsCirculation = balanceData?.reduce((s, u) => s + (u.total_earned_caps || 0) + (u.total_spent_caps || 0), 0) || 0

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      newToday: newToday || 0,
      activeToday: activeToday || 0,
      totalAiRequests,
      aiCostUsd: Math.round(aiCostUsd * 100) / 100,
      totalCapsCirculation,
      totalCapsOnBalances,
      totalReferrals: totalReferrals || 0,
      pendingApplications: pendingApplications || 0,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
