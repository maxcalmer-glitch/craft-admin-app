'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface UserDetail {
  id: number
  telegram_id: string
  system_uid: string
  first_name: string
  last_name: string
  username: string
  caps_balance: number
  is_blocked: boolean
  block_reason: string
  user_level: string
  created_at: string
  last_activity: string
  total_referrals: number
  total_earned_caps: number
  total_spent_caps: number
  ai_requests_count: number
  referrer: { id: number; first_name: string; username: string } | null
  referrals: { id: number; first_name: string; username: string; created_at: string }[]
}

interface ChatMessage {
  id: number
  direction: string
  message: string
  admin_username: string
  created_at: string
}

export default function UserDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [balanceChange, setBalanceChange] = useState('')
  const [balanceReason, setBalanceReason] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockVideoUrl, setBlockVideoUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('craft_admin_token') : ''
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const fetchUser = () => {
    fetch(`/api/users/${id}`, { headers })
      .then(r => r.json())
      .then(data => setUser(data.user))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const fetchMessages = () => {
    setChatLoading(true)
    fetch(`/api/users/${id}/messages`, { headers })
      .then(r => r.json())
      .then(data => {
        setChatMessages(data.messages || [])
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .catch(console.error)
      .finally(() => setChatLoading(false))
  }

  useEffect(() => { fetchUser(); fetchMessages() }, [id])

  // Auto-refresh chat every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [id])

  const sendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/users/${id}/message`, {
        method: 'POST', headers, body: JSON.stringify({ text: message })
      })
      const data = await res.json()
      setFeedback(data.success ? '✅ Сообщение отправлено' : `❌ ${data.error}`)
      if (data.success) { setMessage(''); fetchMessages() }
    } catch { setFeedback('❌ Ошибка') }
    setSending(false)
    setTimeout(() => setFeedback(''), 3000)
  }

  const changeBalance = async () => {
    const amount = parseInt(balanceChange)
    if (isNaN(amount) || amount === 0) return
    setSending(true)
    try {
      const res = await fetch(`/api/users/${id}/balance`, {
        method: 'POST', headers, body: JSON.stringify({ amount, reason: balanceReason })
      })
      const data = await res.json()
      setFeedback(data.success ? `✅ Баланс изменён на ${amount}` : `❌ ${data.error}`)
      if (data.success) { setBalanceChange(''); setBalanceReason(''); fetchUser() }
    } catch { setFeedback('❌ Ошибка') }
    setSending(false)
    setTimeout(() => setFeedback(''), 3000)
  }

  const toggleBlock = async () => {
    setSending(true)
    try {
      const action = user?.is_blocked ? 'unblock' : 'block'
      const res = await fetch(`/api/users/${id}/block`, {
        method: 'POST', headers, body: JSON.stringify({ action, reason: blockReason, video_url: blockVideoUrl })
      })
      const data = await res.json()
      setFeedback(data.success ? `✅ Пользователь ${action === 'block' ? 'заблокирован' : 'разблокирован'}` : `❌ ${data.error}`)
      if (data.success) { setBlockReason(''); setBlockVideoUrl(''); fetchUser() }
    } catch { setFeedback('❌ Ошибка') }
    setSending(false)
    setTimeout(() => setFeedback(''), 3000)
  }

  const toggleVIP = async () => {
    setSending(true)
    const newLevel = user?.user_level === 'vip' ? 'basic' : 'vip'
    try {
      const res = await fetch(`/api/users/${id}/level`, {
        method: 'POST', headers, body: JSON.stringify({ level: newLevel })
      })
      const data = await res.json()
      setFeedback(data.success ? `✅ Уровень изменён на ${newLevel.toUpperCase()}` : `❌ ${data.error}`)
      if (data.success) fetchUser()
    } catch { setFeedback('❌ Ошибка') }
    setSending(false)
    setTimeout(() => setFeedback(''), 3000)
  }

  if (loading) return <div className="p-8 text-craft-amber animate-pulse">Загрузка...</div>
  if (!user) return <div className="p-8 text-red-400">Пользователь не найден</div>

  return (
    <div>
      <Header title={`👤 ${user.first_name || 'Пользователь'} #${user.id}`} />
      <div className="p-8">
        <button onClick={() => router.back()} className="text-craft-amber hover:underline mb-6 inline-block">← Назад к списку</button>

        {feedback && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-craft-card border border-craft-amber/30 text-sm">{feedback}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Info */}
          <div className="bg-craft-card border border-craft-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-craft-gold mb-4">📋 Информация</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-craft-muted">ID:</span><span>{user.id}</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">System UID:</span><span className="font-mono">{user.system_uid}</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Telegram ID:</span><span className="font-mono">{user.telegram_id}</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Имя:</span><span>{user.first_name} {user.last_name || ''}</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Username:</span><span className="text-craft-amber">{user.username ? `@${user.username}` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Баланс:</span><span className="text-craft-gold font-bold text-lg">{user.caps_balance} 🧢</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Заработано:</span><span>{user.total_earned_caps} 🧢</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Потрачено:</span><span>{user.total_spent_caps} 🧢</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">AI запросов:</span><span>{user.ai_requests_count}</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Рефералов:</span><span>{user.total_referrals}</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Регистрация:</span><span>{new Date(user.created_at).toLocaleString('ru')}</span></div>
              <div className="flex justify-between"><span className="text-craft-muted">Последняя активность:</span><span>{user.last_activity ? new Date(user.last_activity).toLocaleString('ru') : '—'}</span></div>
              <div className="flex justify-between">
                <span className="text-craft-muted">Уровень:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.user_level === 'vip' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-gray-900/30 text-gray-400'}`}>
                  {user.user_level === 'vip' ? '👑 VIP' : '📋 Basic'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-craft-muted">Статус:</span>
                {user.is_blocked ? (
                  <span className="px-2 py-0.5 bg-red-900/30 text-red-400 rounded text-xs">Заблокирован: {user.block_reason}</span>
                ) : (
                  <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded text-xs">Активен</span>
                )}
              </div>
              {user.referrer && (
                <div className="flex justify-between">
                  <span className="text-craft-muted">Реферер:</span>
                  <button onClick={() => router.push(`/dashboard/users/${user.referrer!.id}`)} className="text-craft-amber hover:underline">
                    {user.referrer.first_name} (@{user.referrer.username || '—'})
                  </button>
                </div>
              )}
            </div>
            
            {/* VIP Toggle */}
            <div className="mt-4 pt-4 border-t border-craft-border/30">
              <button
                onClick={toggleVIP}
                disabled={sending}
                className={`w-full px-4 py-2 font-bold rounded-lg text-sm ${
                  user.user_level === 'vip'
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                } disabled:opacity-50`}
              >
                {user.user_level === 'vip' ? '📋 Убрать VIP' : '👑 Сделать VIP'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-6">
            {/* Mini Chat */}
            <div className="bg-craft-card border border-craft-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-craft-gold mb-4">💬 Мини-чат с пользователем</h3>
              
              {/* Chat History */}
              <div className="bg-craft-dark rounded-lg p-3 mb-3 max-h-60 overflow-y-auto">
                {chatLoading && chatMessages.length === 0 ? (
                  <p className="text-craft-muted text-xs text-center">Загрузка...</p>
                ) : chatMessages.length === 0 ? (
                  <p className="text-craft-muted text-xs text-center">Нет сообщений</p>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className={`mb-2 flex ${msg.direction === 'admin_to_user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                        msg.direction === 'admin_to_user' 
                          ? 'bg-craft-amber/20 text-craft-light border border-craft-amber/30' 
                          : 'bg-craft-border/30 text-craft-light border border-craft-border/50'
                      }`}>
                        <div className="font-semibold mb-1 text-[10px] text-craft-muted">
                          {msg.direction === 'admin_to_user' ? `👤 ${msg.admin_username || 'Admin'}` : '💬 Пользователь'}
                        </div>
                        <div>{msg.message}</div>
                        <div className="text-[10px] text-craft-muted mt-1">
                          {new Date(msg.created_at).toLocaleString('ru')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              
              {/* Send Message */}
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Текст сообщения (HTML: <b>, <i>, <code>)"
                  className="flex-1 px-3 py-2 rounded-lg border border-craft-border bg-craft-dark text-craft-light text-sm h-16 resize-none"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !message.trim()}
                  className="px-4 py-2 bg-craft-amber text-craft-bg font-bold rounded-lg hover:opacity-90 disabled:opacity-50 text-sm self-end"
                >
                  📤
                </button>
              </div>
              <button onClick={fetchMessages} className="mt-2 text-xs text-craft-muted hover:text-craft-amber">🔄 Обновить чат</button>
            </div>

            {/* Change Balance */}
            <div className="bg-craft-card border border-craft-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-craft-gold mb-4">💰 Изменить баланс</h3>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={balanceChange}
                  onChange={e => setBalanceChange(e.target.value)}
                  placeholder="+100 или -50"
                  className="flex-1 px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light"
                />
              </div>
              <input
                type="text"
                value={balanceReason}
                onChange={e => setBalanceReason(e.target.value)}
                placeholder="Причина (необязательно)"
                className="w-full mt-3 px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light"
              />
              <button
                onClick={changeBalance}
                disabled={sending || !balanceChange}
                className="mt-3 px-4 py-2 bg-craft-gold text-craft-bg font-bold rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
              >
                💎 Применить
              </button>
            </div>

            {/* Block/Unblock */}
            <div className="bg-craft-card border border-craft-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-craft-gold mb-4">🛡️ Блокировка</h3>
              {!user.is_blocked && (
                <>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    placeholder="Причина блокировки"
                    className="w-full mb-3 px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light"
                  />
                  <input
                    type="text"
                    value={blockVideoUrl}
                    onChange={e => setBlockVideoUrl(e.target.value)}
                    placeholder="URL видео (необязательно)"
                    className="w-full mb-3 px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light text-sm"
                  />
                </>
              )}
              <button
                onClick={toggleBlock}
                disabled={sending || (!user.is_blocked && !blockReason)}
                className={`px-4 py-2 font-bold rounded-lg text-sm ${
                  user.is_blocked
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {user.is_blocked ? '✅ Разблокировать' : '🚫 Заблокировать'}
              </button>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        {user.referrals && user.referrals.length > 0 && (
          <div className="mt-6 bg-craft-card border border-craft-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-craft-gold mb-4">🔗 Рефералы ({user.referrals.length})</h3>
            <div className="space-y-2">
              {user.referrals.map(ref => (
                <div key={ref.id} className="flex items-center justify-between py-2 border-b border-craft-border/30">
                  <button onClick={() => router.push(`/dashboard/users/${ref.id}`)} className="text-craft-amber hover:underline text-sm">
                    {ref.first_name} (@{ref.username || '—'})
                  </button>
                  <span className="text-xs text-craft-muted">{new Date(ref.created_at).toLocaleDateString('ru')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
