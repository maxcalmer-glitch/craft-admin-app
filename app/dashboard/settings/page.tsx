'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'

export default function SettingsPage() {
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [blockVideoUrl, setBlockVideoUrl] = useState('')
  const [savingVideo, setSavingVideo] = useState(false)
  const [videoSaved, setVideoSaved] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('craft_admin_token') : ''

  useEffect(() => {
    fetch('/api/audit-log', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setAuditLog(d.logs || []))
      .finally(() => setLoading(false))
    
    fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.settings?.block_video_url) setBlockVideoUrl(d.settings.block_video_url)
      })
      .catch(() => {})
  }, [])

  const saveBlockVideo = async () => {
    setSavingVideo(true)
    setVideoSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'block_video_url', value: blockVideoUrl })
      })
      if ((await res.json()).success) setVideoSaved(true)
    } catch {}
    setSavingVideo(false)
  }

  return (
    <div>
      <Header title="⚙️ Настройки и Audit Log" />
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-craft-card border border-craft-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-craft-gold mb-4">ℹ️ Информация</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-craft-muted">Версия:</span><span>V3.0.0</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Среда:</span><span>Production</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">База данных:</span><span className="text-green-400">Supabase Connected</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Telegram Bot:</span><span className="text-green-400">Active</span></div>
            </div>
          </div>

          <div className="bg-craft-card border border-craft-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-craft-gold mb-4">🛡️ Безопасность</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-craft-muted">JWT Auth:</span><span className="text-green-400">✅ Enabled</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Rate Limiting:</span><span className="text-green-400">✅ Active</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Anti-Bruteforce:</span><span className="text-green-400">✅ Active</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">CSP Headers:</span><span className="text-green-400">✅ Configured</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Audit Logging:</span><span className="text-green-400">✅ Enabled</span></div>
            </div>
          </div>
        </div>

        <div className="bg-craft-card border border-craft-border rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-craft-gold mb-4">🎥 Видео при блокировке</h3>
          <p className="text-craft-muted text-sm mb-3">URL видео, которое будет отправляться при спамблоке и блокировке пользователя</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={blockVideoUrl}
              onChange={e => { setBlockVideoUrl(e.target.value); setVideoSaved(false) }}
              placeholder="https://... URL видео"
              className="flex-1 bg-craft-dark border border-craft-border rounded-lg px-4 py-2 text-sm text-craft-light focus:border-craft-gold outline-none"
            />
            <button
              onClick={saveBlockVideo}
              disabled={savingVideo}
              className="px-4 py-2 bg-craft-gold text-craft-dark font-bold rounded-lg hover:bg-craft-amber transition disabled:opacity-50"
            >
              {savingVideo ? '...' : videoSaved ? '✅' : '💾 Сохранить'}
            </button>
          </div>
        </div>

        <div className="bg-craft-card border border-craft-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-craft-gold mb-4">📜 Audit Log (последние действия)</h3>
          {loading ? <div className="text-craft-amber">Загрузка...</div> : auditLog.length === 0 ? (
            <p className="text-craft-muted text-sm">Лог пока пуст</p>
          ) : (
            <div className="space-y-2">
              {auditLog.map((log: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-craft-border/30 text-sm">
                  <div>
                    <span className="text-craft-amber font-medium">{log.admin_username}</span>
                    <span className="text-craft-muted mx-2">→</span>
                    <span className="text-craft-light">{log.action}</span>
                    <span className="text-craft-muted ml-2">{log.details}</span>
                  </div>
                  <span className="text-xs text-craft-muted">{new Date(log.created_at).toLocaleString('ru')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
