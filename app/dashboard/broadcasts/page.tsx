'use client'

import { useEffect, useState, useRef } from 'react'
import Header from '@/components/Header'

interface BroadcastHistory {
  id: number
  message: string
  photo_url: string | null
  total_sent: number
  total_delivered: number
  total_failed: number
  admin_username: string
  created_at: string
}

export default function BroadcastsPage() {
  const [message, setMessage] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const [history, setHistory] = useState<BroadcastHistory[]>([])
  const [feedback, setFeedback] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('craft_admin_token') : ''
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    fetch('/api/broadcasts', { headers }).then(r => r.json()).then(d => setHistory(d.history || []))
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    setFeedback('📤 Загрузка фото...')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      
      if (data.success && data.url) {
        setPhotoUrl(data.url)
        setFeedback('✅ Фото загружено')
      } else {
        setFeedback(`❌ ${data.error || 'Ошибка загрузки'}`)
      }
    } catch {
      setFeedback('❌ Ошибка загрузки файла')
    }
    setUploading(false)
    setTimeout(() => setFeedback(''), 3000)
  }

  const sendBroadcast = async () => {
    if (!message.trim()) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/broadcasts', {
        method: 'POST', headers,
        body: JSON.stringify({ message, photo_url: photoUrl || null })
      })
      const data = await res.json()
      if (data.success) {
        setResult({ sent: data.sent, failed: data.failed })
        setFeedback(`✅ Рассылка завершена: ${data.sent} отправлено, ${data.failed} ошибок`)
        setMessage(''); setPhotoUrl(''); setPreview(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetch('/api/broadcasts', { headers }).then(r => r.json()).then(d => setHistory(d.history || []))
      } else {
        setFeedback(`❌ ${data.error}`)
      }
    } catch { setFeedback('❌ Ошибка отправки') }
    setSending(false)
  }

  return (
    <div>
      <Header title="📢 Рассылки" />
      <div className="p-8">
        {feedback && <div className="mb-4 px-4 py-3 rounded-lg bg-craft-card border border-craft-amber/30 text-sm">{feedback}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="bg-craft-card border border-craft-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-craft-gold mb-4">✍️ Новая рассылка</h3>
            
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Текст рассылки (HTML: <b>жирный</b>, <i>курсив</i>, <code>код</code>, <a href='url'>ссылка</a>)"
              className="w-full px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light h-40 resize-none font-mono text-sm"
            />

            {/* Photo upload */}
            <div className="mt-3 space-y-2">
              <label className="block text-sm text-craft-muted">📷 Фото для рассылки</label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1 text-sm text-craft-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-craft-amber/20 file:text-craft-amber hover:file:bg-craft-amber/30"
                />
              </div>
              <input
                type="text"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                placeholder="Или вставьте URL фото"
                className="w-full px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light text-sm"
              />
              {photoUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-400">✅ Фото прикреплено</span>
                  <button onClick={() => { setPhotoUrl(''); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-xs text-red-400 hover:underline">✕ Удалить</button>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setPreview(!preview)}
                className="px-4 py-2 bg-craft-border text-craft-light rounded-lg text-sm">
                👁️ {preview ? 'Скрыть' : 'Предпросмотр'}
              </button>
              <button onClick={sendBroadcast} disabled={sending || uploading || !message.trim()}
                className="px-4 py-2 bg-craft-amber text-craft-bg font-bold rounded-lg hover:opacity-90 disabled:opacity-50 text-sm">
                {sending ? '⏳ Отправка...' : '📤 Отправить всем'}
              </button>
            </div>

            <p className="text-xs text-craft-muted mt-3">⚠️ Рассылка отправится ВСЕМ пользователям. Действие необратимо.</p>
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-craft-card border border-craft-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-craft-gold mb-4">👁️ Предпросмотр</h3>
              <div className="bg-[#0E1621] rounded-lg p-4 text-white text-sm">
                {photoUrl && (
                  <div className="mb-3 rounded-lg overflow-hidden">
                    <img src={photoUrl} alt="Preview" className="w-full h-40 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: message }} />
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="mt-8 bg-craft-card border border-craft-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-craft-gold mb-4">📜 История рассылок</h3>
          {history.length === 0 ? (
            <p className="text-craft-muted text-sm">Рассылок пока не было</p>
          ) : (
            <div className="space-y-3">
              {history.map(h => (
                <div key={h.id} className="border-b border-craft-border/30 pb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-craft-light">{h.message.substring(0, 100)}...</span>
                    <span className="text-craft-muted text-xs">{new Date(h.created_at).toLocaleString('ru')}</span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs">
                    <span className="text-green-400">✅ {h.total_delivered} доставлено</span>
                    <span className="text-red-400">❌ {h.total_failed} ошибок</span>
                    <span className="text-craft-muted">👤 {h.admin_username}</span>
                    {h.photo_url && <span className="text-blue-400">📷 С фото</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
