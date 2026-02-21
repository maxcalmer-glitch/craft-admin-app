import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const db = getDb()
    const { data } = await db.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(50)
    return NextResponse.json({ logs: data || [] })
  } catch {
    return NextResponse.json({ logs: [] })
  }
}
