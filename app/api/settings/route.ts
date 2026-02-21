import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'
import { logAuditAction } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const db = getDb()
    const { data } = await db.from('admin_settings').select('*')
    const settings: Record<string, string> = {}
    if (data) {
      for (const row of data) {
        settings[row.key] = row.value
      }
    }
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ settings: {} })
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const { key, value } = await request.json()
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 })

    const db = getDb()
    const { error } = await db.from('admin_settings').upsert(
      { key, value: value || '', updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

    if (error) {
      console.error('Settings upsert error:', error)
      return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
    }

    await logAuditAction(auth.username!, 'SETTINGS_UPDATE', `Обновлена настройка: ${key}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
