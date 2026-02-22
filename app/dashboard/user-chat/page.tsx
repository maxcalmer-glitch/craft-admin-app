'use client'

import { useEffect, useState, useRef } from 'react'
import Header from '@/components/Header'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://craft-main-app.vercel.app'
const SECRET = 'craft-webhook-secret-2026'

interface ChatUser {
  user_id: number
  username: string
  first_name: string
  last_message_at: string
  unread_count?: number
}

interface Message {
  id: number
  user_id: number
  direction: 'in' | 'out'
  text: string
  created_at: string
}

export default function UserChatPage() {
  const [users, setUsers] = useState<ChatUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchUsers = () => {
    fetch(`${API_URL}/api/admin/user-chat/users?secret=${SECRET}`)
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data) ? data : data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const fetchMessages = (userId: number) => {
    fetch(`${API_URL}/api/admin/user-chat/messages/${userId}?secret=${SECRET}`)
      .then(r => r.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data : data.messages || [])
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .catch(console.error)
      .finally(() => setLoadingMsgs(false))
  }

  const selectUser = (user: ChatUser) => {
    setSelectedUser(user)
    setLoadingMsgs(true)
    fetchMessages(user.user_id)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => fetchMessages(user.user_id), 10000)
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const sendReply = async () => {
    if (!reply.trim() || !selectedUser) return
    setSending(true)
    try {
      await fetch(`${API_URL}/api/admin/user-chat/send?secret=${SECRET}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUser.user_id, text: reply })
      })
      setReply('')
      fetchMessages(selectedUser.user_id)
    } catch (e) { console.error(e) }
    setSending(false)
  }

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase()
    return (u.username || '').toLowerCase().includes(q) || String(u.user_id).includes(q) || (u.first_name || '').toLowerCase().includes(q)
  })

  return (
    <div>
      <Header title="💬 Чат с юзерами" />
      <div className="p-8">
        <div className="flex gap-6 h-[calc(100vh-160px)]">
          {/* Users */}
          <div className="w-80 flex-shrink-0 bg-craft-card border border-craft-border rounded-lg flex flex-col">
            <div className="p-3 border-b border-craft-border">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className="w-full bg-craft-dark border border-craft-border rounded-lg p-2 text-craft-light text-sm placeholder:text-craft-muted" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-craft-amber animate-pulse">Загрузка...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-craft-muted text-sm">Нет чатов</div>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.user_id}
                    onClick={() => selectUser(user)}
                    className={`w-full text-left p-3 border-b border-craft-border/30 hover:bg-craft-dark/50 transition ${
                      selectedUser?.user_id === user.user_id ? 'bg-craft-amber/20 border-l-2 border-l-craft-amber' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-craft-light text-sm font-medium">{user.first_name || user.username || `User ${user.user_id}`}</div>
                      {user.unread_count ? <span className="bg-craft-amber text-craft-dark text-xs px-1.5 py-0.5 rounded-full font-bold">{user.unread_count}</span> : null}
                    </div>
                    <div className="text-craft-muted text-xs">@{user.username || '—'} · ID: {user.user_id}</div>
                    {user.last_message_at && (
                      <div className="text-craft-muted text-xs mt-1">🕐 {new Date(user.last_message_at).toLocaleString('ru')}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat */}
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
                  {loadingMsgs ? (
                    <div className="text-craft-amber animate-pulse">Загрузка...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-craft-muted text-sm">Нет сообщений</div>
                  ) : (
                    messages.map((msg, i) => (
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
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-craft-border flex gap-3">
                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                    placeholder="Написать ответ..."
                    className="flex-1 bg-craft-dark border border-craft-border rounded-lg p-2 text-craft-light text-sm placeholder:text-craft-muted"
                  />
                  <button onClick={sendReply} disabled={sending || !reply.trim()} className="bg-craft-amber hover:bg-craft-gold text-craft-dark px-4 py-2 rounded-lg font-medium transition disabled:opacity-50">
                    {sending ? '...' : 'Отправить'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
