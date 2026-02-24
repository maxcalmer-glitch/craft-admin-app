import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const db = getDb()
    const { data: user, error } = await db.from('users').select('*').eq('id', params.id).single()
    if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Get referrer info
    let referrer = null
    if (user.referrer_id) {
      const { data } = await db.from('users').select('id, first_name, username').eq('id', user.referrer_id).single()
      referrer = data
    }

    // Get L1 referrals
    const { data: referralLinks } = await db.from('referrals').select('referred_id').eq('referrer_id', user.id)
    let referrals: any[] = []
    let referrals_l2: any[] = []
    if (referralLinks && referralLinks.length > 0) {
      const ids = referralLinks.map(r => r.referred_id)
      const { data } = await db.from('users').select('id, first_name, username, created_at').in('id', ids)
      referrals = data || []

      // Get L2 referrals (referrals of my referrals)
      const { data: l2Links } = await db.from('referrals').select('referred_id, referrer_id').in('referrer_id', ids)
      if (l2Links && l2Links.length > 0) {
        const l2ids = l2Links.map(r => r.referred_id)
        const { data: l2users } = await db.from('users').select('id, first_name, username, created_at, referrer_id').in('id', l2ids)
        referrals_l2 = (l2users || []).map(u => {
          const parent = referrals.find(r => r.id === u.referrer_id)
          return { ...u, via: parent?.first_name || '—' }
        })
      }
    }

    return NextResponse.json({ user: { ...user, referrer, referrals, referrals_l2 } })
  } catch (error) {
    console.error('User detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
