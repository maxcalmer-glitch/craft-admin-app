'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://craft-main-app.vercel.app'
const SECRET = 'craft-webhook-secret-2026'

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
  referrals_l2: { id: number; first_name: string; username: string; created_at: string; via: string }[]
}

interface ChatMessage {
  id: number
  direction: string
  message: string
  admin_username: string
  created_at: string
}

interface AIMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface BotMessage {
  id: number
  direction: 'in' | 'out'
  text: string
  created_at: string
}

interface BalanceEntry {
  id: number; amount: number; operation: string; description: string; balance_after: number; created_at: string
}

type TabKey = 'info' | 'ai-chat' | 'bot-chat' | 'referrals' | 'balance'

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
  const [activeTab, setActiveTab] = useState<TabKey>('info')
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [botMessages, setBotMessages] = useState<BotMessage[]>([])
  const [botLoading, setBotLoading] = useState(false)
  const [botReply, setBotReply] = useState('')
  const [balanceHistory, setBalanceHistory] = useState<BalanceEntry[]>([])
  const [balanceLoading, setBalanceLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const aiEndRef = useRef<HTMLDivElement>(null)
  const botEndRef = useRef<HTMLDivElement>(null)

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

  const fetchAiHistory = () => {
    if (!user?.telegram_id) return
    setAiLoading(true)
    fetch(`${API_URL}/api/admin/ai-history/${user.telegram_id}`, { headers: { 'X-Admin-Secret': SECRET } })
      .then(r => r.json())
      .then(data => {
        setAiMessages(Array.isArray(data) ? data : data.messages || [])
        setTimeout(() => aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .catch(console.error)
      .finally(() => setAiLoading(false))
  }

  const fetchBalanceHistory = () => {
    setBalanceLoading(true)
    fetch(`${API_URL}/api/admin/user/${id}/balance-history`, { headers: { 'X-Admin-Secret': SECRET } })
      .then(r => r.json())
      .then(data => setBalanceHistory(data.history || []))
      .catch(() => {})
      .finally(() => setBalanceLoading(false))
  }

  const fetchBotMessages = () => {
    if (!user?.telegram_id) return
    setBotLoading(true)
    fetch(`${API_URL}/api/admin/user-chat/messages/${user.telegram_id}`, { headers: { 'X-Admin-Secret': SECRET } })
      .then(r => r.json())
      .then(data => {
        setBotMessages(Array.isArray(data) ? data : data.messages || [])
        setTimeout(() => botEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .catch(console.error)
      .finally(() => setBotLoading(false))
  }

  useEffect(() => { fetchUser(); fetchMessages() }, [id])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages()
      if (activeTab === 'bot-chat' && user?.telegram_id) fetchBotMessages()
    }, 10000)
    return () => clearInterval(interval)
  }, [id, activeTab, user?.telegram_id])

  useEffect(() => {
    if (activeTab === 'ai-chat' && user?.telegram_id) fetchAiHistory()
    if (activeTab === 'bot-chat' && user?.telegram_id) fetchBotMessages()
    if (activeTab === 'balance') fetchBalanceHistory()
  }, [activeTab, user?.telegram_id])

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

  const sendBotReply = async () => {
    if (!botReply.trim() || !user?.telegram_id) return
    setSending(true)
    try {
      await fetch(`${API_URL}/api/admin/user-chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': SECRET },
        body: JSON.stringify({ user_id: Number(user.telegram_id), text: botReply })
      })
      setBotReply('')
      fetchBotMessages()
    } catch (e) { console.error(e) }
    setSending(false)
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

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'info', label: '📋 Информация' },
    { key: 'ai-chat', label: '🧠 AI чат' },
    { key: 'bot-chat', label: '💬 Сообщения боту' },
    { key: 'referrals', label: `🔗 Рефералы (L1: ${user.referrals?.length || 0} / L2: ${user.referrals_l2?.length || 0})` },
    { key: 'balance', label: '💰 Баланс' },
  ]

  return (
    <div>
      <Header title={`👤 ${user.first_name || 'Пользователь'} #${user.id}`} />
      <div className="p-8">
        <button onClick={() => router.back()} className="text-craft-amber hover:underline mb-6 inline-block">← Назад к списку</button>

        {feedback && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-craft-card border border-craft-amber/30 text-sm">{feedback}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-craft-border pb-3">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-craft-amber text-craft-dark'
                  : 'bg-craft-card text-craft-muted hover:text-craft-light border border-craft-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Info */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="mt-4 pt-4 border-t border-craft-border/30">
                <button onClick={toggleVIP} disabled={sending}
                  className={`w-full px-4 py-2 font-bold rounded-lg text-sm ${user.user_level === 'vip' ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-yellow-600 text-white hover:bg-yellow-700'} disabled:opacity-50`}>
                  {user.user_level === 'vip' ? '📋 Убрать VIP' : '👑 Сделать VIP'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Mini Chat */}
              <div className="bg-craft-card border border-craft-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-craft-gold mb-4">💬 Мини-чат</h3>
                <div className="bg-craft-dark rounded-lg p-3 mb-3 max-h-60 overflow-y-auto">
                  {chatLoading && chatMessages.length === 0 ? (
                    <p className="text-craft-muted text-xs text-center">Загрузка...</p>
                  ) : chatMessages.length === 0 ? (
                    <p className="text-craft-muted text-xs text-center">Нет сообщений</p>
                  ) : (
                    chatMessages.map(msg => (
                      <div key={msg.id} className={`mb-2 flex ${msg.direction === 'admin_to_user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                          msg.direction === 'admin_to_user'
                            ? 'bg-craft-amber/20 text-craft-light border border-craft-amber/30 rounded-br-sm'
                            : 'bg-craft-border/30 text-craft-light border border-craft-border/50 rounded-bl-sm'
                        }`}>
                          <div>{msg.message}</div>
                          <div className="text-[10px] text-craft-muted mt-1">{new Date(msg.created_at).toLocaleString('ru')}</div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                  <textarea value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Текст сообщения (HTML: <b>, <i>, <code>)"
                    className="flex-1 px-3 py-2 rounded-lg border border-craft-border bg-craft-dark text-craft-light text-sm h-16 resize-none"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} />
                  <button onClick={sendMessage} disabled={sending || !message.trim()}
                    className="px-4 py-2 bg-craft-amber text-craft-bg font-bold rounded-lg hover:opacity-90 disabled:opacity-50 text-sm self-end">📤</button>
                </div>
              </div>

              {/* Balance */}
              <div className="bg-craft-card border border-craft-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-craft-gold mb-4">💰 Изменить баланс</h3>
                <div className="flex gap-3">
                  <input type="number" value={balanceChange} onChange={e => setBalanceChange(e.target.value)}
                    placeholder="+100 или -50" className="flex-1 px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
                </div>
                <input type="text" value={balanceReason} onChange={e => setBalanceReason(e.target.value)}
                  placeholder="Причина (необязательно)" className="w-full mt-3 px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
                <button onClick={changeBalance} disabled={sending || !balanceChange}
                  className="mt-3 px-4 py-2 bg-craft-gold text-craft-bg font-bold rounded-lg hover:opacity-90 disabled:opacity-50 text-sm">💎 Применить</button>
              </div>

              {/* Block */}
              <div className="bg-craft-card border border-craft-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-craft-gold mb-4">🛡️ Блокировка</h3>
                {!user.is_blocked && (
                  <>
                    <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)}
                      placeholder="Причина блокировки" className="w-full mb-3 px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
                    <input type="text" value={blockVideoUrl} onChange={e => setBlockVideoUrl(e.target.value)}
                      placeholder="URL видео (необязательно)" className="w-full mb-3 px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light text-sm" />
                  </>
                )}
                <button onClick={toggleBlock} disabled={sending || (!user.is_blocked && !blockReason)}
                  className={`px-4 py-2 font-bold rounded-lg text-sm ${user.is_blocked ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'} disabled:opacity-50`}>
                  {user.is_blocked ? '✅ Разблокировать' : '🚫 Заблокировать'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: AI Chat */}
        {activeTab === 'ai-chat' && (
          <div className="bg-craft-card border border-craft-border rounded-xl flex flex-col h-[calc(100vh-280px)]">
            <div className="p-4 border-b border-craft-border">
              <h3 className="text-craft-gold font-medium">🧠 AI чат (Михалыч) — {user.first_name}</h3>
              <div className="text-craft-muted text-xs">Telegram ID: {user.telegram_id}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {aiLoading ? (
                <div className="text-craft-amber animate-pulse">Загрузка AI истории...</div>
              ) : aiMessages.length === 0 ? (
                <div className="text-craft-muted text-sm text-center py-8">Нет AI сообщений</div>
              ) : (
                aiMessages.map((msg, i) => (
                  <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-craft-dark text-craft-light border border-craft-border rounded-bl-sm'
                        : 'bg-craft-amber/20 text-craft-light border border-craft-amber/30 rounded-br-sm'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className="text-[10px] text-craft-muted mt-1.5 text-right">
                        {msg.role === 'user' ? '👤' : '🤖'} {new Date(msg.created_at).toLocaleString('ru')}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={aiEndRef} />
            </div>
            <div className="p-3 border-t border-craft-border">
              <button onClick={fetchAiHistory} className="text-xs text-craft-muted hover:text-craft-amber">🔄 Обновить</button>
            </div>
          </div>
        )}

        {/* Tab: Bot Chat */}
        {activeTab === 'bot-chat' && (
          <div className="bg-craft-card border border-craft-border rounded-xl flex flex-col h-[calc(100vh-280px)]">
            <div className="p-4 border-b border-craft-border">
              <h3 className="text-craft-gold font-medium">💬 Сообщения боту — {user.first_name}</h3>
              <div className="text-craft-muted text-xs">Telegram ID: {user.telegram_id}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {botLoading ? (
                <div className="text-craft-amber animate-pulse">Загрузка...</div>
              ) : botMessages.length === 0 ? (
                <div className="text-craft-muted text-sm text-center py-8">Нет сообщений</div>
              ) : (
                botMessages.map((msg, i) => (
                  <div key={msg.id || i} className={`flex ${msg.direction === 'in' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                      msg.direction === 'in'
                        ? 'bg-craft-dark text-craft-light border border-craft-border rounded-bl-sm'
                        : 'bg-craft-amber/20 text-craft-light border border-craft-amber/30 rounded-br-sm'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      <div className="text-[10px] text-craft-muted mt-1.5 text-right">
                        {msg.direction === 'in' ? '👤' : '🤖'} {new Date(msg.created_at).toLocaleString('ru')}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={botEndRef} />
            </div>
            <div className="p-4 border-t border-craft-border flex gap-3">
              <input value={botReply} onChange={e => setBotReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendBotReply()}
                placeholder="Написать ответ..."
                className="flex-1 bg-craft-dark border border-craft-border rounded-lg p-2 text-craft-light text-sm placeholder:text-craft-muted" />
              <button onClick={sendBotReply} disabled={sending || !botReply.trim()}
                className="bg-craft-amber hover:bg-craft-gold text-craft-dark px-4 py-2 rounded-lg font-medium transition disabled:opacity-50">
                Отправить
              </button>
            </div>
          </div>
        )}

        {/* Tab: Referrals */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            <div className="bg-craft-card border border-craft-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-craft-gold mb-4">👥 Рефералы 1-го уровня ({user.referrals?.length || 0})</h3>
              {!user.referrals || user.referrals.length === 0 ? (
                <div className="text-craft-muted text-sm text-center py-4">Нет рефералов</div>
              ) : (
                <div className="space-y-1">
                  {user.referrals.map((ref: any) => (
                    <div key={ref.id} className="flex items-center justify-between py-3 px-4 border-b border-craft-border/30 hover:bg-craft-dark/30 rounded-lg transition">
                      <button onClick={() => router.push(`/dashboard/users/${ref.id}`)} className="text-craft-amber hover:underline text-sm">
                        {ref.first_name} (@{ref.username || '—'})
                      </button>
                      <span className="text-xs text-craft-muted">{new Date(ref.created_at).toLocaleDateString('ru')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-craft-card border border-craft-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-craft-gold mb-4">👥👥 Рефералы 2-го уровня ({user.referrals_l2?.length || 0})</h3>
              {!user.referrals_l2 || user.referrals_l2.length === 0 ? (
                <div className="text-craft-muted text-sm text-center py-4">Нет рефералов 2-го уровня</div>
              ) : (
                <div className="space-y-1">
                  {user.referrals_l2.map((ref: any) => (
                    <div key={ref.id} className="flex items-center justify-between py-3 px-4 border-b border-craft-border/30 hover:bg-craft-dark/30 rounded-lg transition">
                      <div>
                        <button onClick={() => router.push(`/dashboard/users/${ref.id}`)} className="text-craft-amber hover:underline text-sm">
                          {ref.first_name} (@{ref.username || '—'})
                        </button>
                        <span className="text-xs text-craft-muted ml-2">через {ref.via}</span>
                      </div>
                      <span className="text-xs text-craft-muted">{new Date(ref.created_at).toLocaleDateString('ru')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="bg-craft-card border border-craft-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-craft-gold mb-4">💰 История баланса</h3>
            {balanceLoading ? (
              <div className="text-craft-muted text-sm text-center py-8">Загрузка...</div>
            ) : balanceHistory.length === 0 ? (
              <div className="text-craft-muted text-sm text-center py-8">Нет операций</div>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-5 gap-2 text-xs font-bold text-craft-muted px-3 py-2 border-b border-craft-border">
                  <span>Дата</span><span>Операция</span><span>Описание</span><span className="text-right">Сумма</span><span className="text-right">Баланс</span>
                </div>
                {balanceHistory.map(b => (
                  <div key={b.id} className="grid grid-cols-5 gap-2 text-sm px-3 py-2 border-b border-craft-border/20 hover:bg-craft-dark/30 rounded">
                    <span className="text-craft-muted text-xs">{new Date(b.created_at).toLocaleString('ru', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
                    <span className="text-craft-amber text-xs">{b.operation}</span>
                    <span className="text-craft-muted text-xs truncate">{b.description || '—'}</span>
                    <span className={`text-right text-xs font-bold ${b.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>{b.amount > 0 ? '+' : ''}{b.amount}</span>
                    <span className="text-right text-xs text-craft-gold">{b.balance_after}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
