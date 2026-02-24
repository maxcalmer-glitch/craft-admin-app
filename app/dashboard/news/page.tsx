'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'

interface Subscriber {
  telegram_id: string
  first_name: string
  username: string
  subscribed_at: string
}

export default function NewsPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; errors: number } | null>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('craft_admin_token') : ''
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    fetch('/api/news/subscribers', { headers })
      .then(r => r.json())
      .then(d => setSubscribers(d.subscribers || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const sendBroadcast = async () => {
    if (!message.trim()) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/news/broadcast', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: message.trim() })
      })
      const data = await res.json()
      setResult({ sent: data.sent || 0, errors: data.errors || 0 })
      if (data.sent > 0) setMessage('')
    } catch {
      setResult({ sent: 0, errors: 1 })
    }
    setSending(false)
  }

  return (
    <div>
      <Header title="📰 Новости" />
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Broadcast form */}
          <div className="bg-craft-card border border-craft-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-craft-gold mb-4">📤 Отправить рассылку</h3>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Текст рассылки..."
              rows={6}
              className="w-full bg-craft-dark border border-craft-border rounded-lg px-4 py-3 text-sm text-craft-light focus:border-craft-gold outline-none resize-none mb-4"
            />
            <button
              onClick={sendBroadcast}
              disabled={sending || !message.trim()}
              className="px-6 py-2 bg-craft-gold text-craft-dark font-bold rounded-lg hover:bg-craft-amber transition disabled:opacity-50"
            >
              {sending ? '⏳ Отправка...' : '📨 Отправить'}
            </button>
            {result && (
              <div className="mt-4 p-3 rounded-lg bg-craft-dark border border-craft-border text-sm">
                <span className="text-green-400">✅ Отправлено: {result.sent}</span>
                {result.errors > 0 && (
                  <span className="text-red-400 ml-4">❌ Ошибок: {result.errors}</span>
                )}
              </div>
            )}
          </div>

          {/* Subscribers list */}
          <div className="bg-craft-card border border-craft-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-craft-gold mb-4">
              👥 Подписчики {!loading && <span className="text-craft-muted text-sm font-normal">({subscribers.length})</span>}
            </h3>
            {loading ? (
              <div className="text-craft-amber">Загрузка...</div>
            ) : subscribers.length === 0 ? (
              <p className="text-craft-muted text-sm">Подписчиков пока нет</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {subscribers.map((sub, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-craft-border/30 text-sm">
                    <div>
                      <span className="text-craft-light">{sub.first_name || 'Unknown'}</span>
                      {sub.username && <span className="text-craft-muted ml-2">@{sub.username}</span>}
                    </div>
                    <span className="text-xs text-craft-muted">
                      {sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleDateString('ru') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
