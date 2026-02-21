import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.error!

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Неподдерживаемый формат. Разрешены: jpg, png, gif, webp' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Файл слишком большой (макс. 10MB)' }, { status: 400 })
    }

    const db = getDb()
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `broadcasts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    
    const buffer = Buffer.from(await file.arrayBuffer())
    
    const { data, error } = await db.storage
      .from('broadcasts')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
    }

    const { data: urlData } = db.storage.from('broadcasts').getPublicUrl(fileName)

    return NextResponse.json({ success: true, url: urlData.publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
