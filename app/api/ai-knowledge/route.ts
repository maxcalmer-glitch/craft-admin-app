export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'
import { logAuditAction } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!
  const db = getDb()
  const { data } = await db.from('ai_knowledge_base').select('*').order('priority', { ascending: false })
  return NextResponse.json({ items: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!
  const body = await request.json()
  const db = getDb()
  const { error } = await db.from('ai_knowledge_base').insert({
    title: body.title,
    content: body.content,
    source: body.source || 'admin',
    priority: body.priority || 10,
    is_active: true
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await logAuditAction(auth.username!, 'ADD_KNOWLEDGE', `Добавлен материал: ${body.title}`)
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const body = await request.json()
  const db = getDb()
  await db.from('ai_knowledge_base').update(body).eq('id', id)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const db = getDb()
  await db.from('ai_knowledge_base').delete().eq('id', id)
  await logAuditAction(auth.username!, 'DELETE_KNOWLEDGE', `Удалён материал #${id}`)
  return NextResponse.json({ success: true })
}
