export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'
import { logAuditAction } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!
  const db = getDb()
  const { data } = await db.from('offers').select('*').order('id')
  return NextResponse.json({ offers: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!
  const body = await request.json()
  const db = getDb()
  const { error } = await db.from('offers').insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await logAuditAction(auth.username!, 'CREATE_OFFER', `Новый оффер: ${body.category}`)
  return NextResponse.json({ success: true })
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const body = await request.json()
  const db = getDb()
  const { error } = await db.from('offers').update(body).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await logAuditAction(auth.username!, 'UPDATE_OFFER', `Обновлён оффер #${id}`)
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const body = await request.json()
  const db = getDb()
  await db.from('offers').update(body).eq('id', id)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const db = getDb()
  await db.from('offers').delete().eq('id', id)
  await logAuditAction(auth.username!, 'DELETE_OFFER', `Удалён оффер #${id}`)
  return NextResponse.json({ success: true })
}
