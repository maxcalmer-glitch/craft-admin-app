import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://craft-test-app.vercel.app'
const SECRET = 'craft-webhook-secret-2026'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const res = await fetch(`${API_URL}/api/admin/news/subscribers?secret=${SECRET}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('News subscribers error:', error)
    return NextResponse.json({ subscribers: [] })
  }
}
