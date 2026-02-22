'use client'

import { useEffect, useState, useRef } from 'react'
import Header from '@/components/Header'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://craft-main-app.vercel.app'
const SECRET = 'craft-webhook-secret-2026'

interface UserSummary {
  user_id: number
  username: string
  first_name: string
  message_count: number
  last_message_at: string
}

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function AIHistoryPage() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/admin/ai-history?secret=${SECRET}`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.users || []
        setUsers(list)
        setFilteredUsers(list)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFilteredUsers(users.filter(u => 
      (u.username || '').toLowerCase().includes(q) || 
      String(u.user_id).includes(q) ||
      (u.first_name || '').toLowerCase().includes(q)
    ))
  }, [search, users])

  const selectUser = (user: UserSummary) => {
    setSelectedUser(user)
    setLoadingMessages(true)
    fetch(`${API_URL}/api/admin/ai-history/${user.user_id}?secret=${SECRET}`)
      .then(r => r.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data : data.messages || [])
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .catch(console.error)
      .finally(() => setLoadingMessages(false))
  }

  return (
    <div>
      <Header title="🧠 AI История (Михалыч)" />
      <div className="p-8">
        <div className="flex gap-6 h-[calc(100vh-160px)]">
          {/* Users list */}
          <div className="w-80 flex-shrink-0 bg-craft-card border border-craft-border rounded-lg flex flex-col">
            <div className="p-3 border-b border-craft-border">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по username/ID..."
                className="w-full bg-craft-dark border border-craft-border rounded-lg p-2 text-craft-light text-sm placeholder:text-craft-muted"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-craft-amber animate-pulse">Загрузка...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-craft-muted text-sm">Нет данных</div>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.user_id}
                    onClick={() => selectUser(user)}
                    className={`w-full text-left p-3 border-b border-craft-border/30 hover:bg-craft-dark/50 transition ${
                      selectedUser?.user_id === user.user_id ? 'bg-craft-amber/20 border-l-2 border-l-craft-amber' : ''
                    }`}
                  >
                    <div className="text-craft-light text-sm font-medium">{user.first_name || user.username || `User ${user.user_id}`}</div>
                    <div className="text-craft-muted text-xs">@{user.username || '—'} · ID: {user.user_id}</div>
                    <div className="text-craft-muted text-xs mt-1">💬 {user.message_count} сообщений</div>
                    {user.last_message_at && (
                      <div className="text-craft-muted text-xs">🕐 {new Date(user.last_message_at).toLocaleString('ru')}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat history */}
          <div className="flex-1 bg-craft-card border border-craft-border rounded-lg flex flex-col">
            {!selectedUser ? (
              <div className="flex-1 flex items-center justify-center text-craft-muted">Выберите пользователя</div>
            ) : (
              <>
                <div className="p-4 border-b border-craft-border">
                  <h3 className="text-craft-gold font-medium">{selectedUser.first_name || selectedUser.username}</h3>
                  <div className="text-craft-muted text-xs">@{selectedUser.username} · ID: {selectedUser.user_id}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="text-craft-amber animate-pulse">Загрузка истории...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-craft-muted text-sm">Нет сообщений</div>
                  ) : (
                    messages.map((msg, i) => (
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
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
