'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface User {
  id: number
  telegram_id: string
  system_uid: string
  first_name: string
  username: string
  caps_balance: number
  is_blocked: boolean
  created_at: string
  last_activity: string
  total_referrals: number
  ai_requests_count: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'blocked' | 'active'>('all')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const router = useRouter()
  const perPage = 20

  const fetchUsers = () => {
    const token = localStorage.getItem('craft_admin_token')
    const params = new URLSearchParams({
      page: String(page),
      limit: String(perPage),
      ...(search && { search }),
      ...(filter !== 'all' && { filter })
    })
    fetch(`/api/users?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setUsers(data.users || [])
        setTotal(data.total || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [page, search, filter])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <Header title="👥 Управление пользователями" />
      <div className="p-8">
        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="🔍 Поиск по имени, username, telegram_id..."
            className="flex-1 px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light"
          />
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value as any); setPage(1) }}
            className="px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light"
          >
            <option value="all">Все</option>
            <option value="active">Активные</option>
            <option value="blocked">Заблокированные</option>
          </select>
        </div>

        <div className="text-sm text-craft-muted mb-4">Всего: {total} пользователей</div>

        {/* Table */}
        <div className="bg-craft-card border border-craft-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-craft-border text-craft-muted text-sm">
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Имя</th>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Telegram</th>
                <th className="px-4 py-3 text-right">Баланс</th>
                <th className="px-4 py-3 text-right">Рефералы</th>
                <th className="px-4 py-3 text-center">Статус</th>
                <th className="px-4 py-3 text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-craft-amber">Загрузка...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-craft-muted">Пользователи не найдены</td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="border-b border-craft-border/50 hover:bg-craft-border/10 transition">
                  <td className="px-4 py-3 text-sm">{user.id}</td>
                  <td className="px-4 py-3 text-sm font-medium">{user.first_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-craft-amber">{user.username ? `@${user.username}` : '—'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-craft-muted">{user.telegram_id}</td>
                  <td className="px-4 py-3 text-sm text-right text-craft-gold font-bold">{user.caps_balance} 🧢</td>
                  <td className="px-4 py-3 text-sm text-right">{user.total_referrals || 0}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {user.is_blocked ? (
                      <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded-full text-xs">Заблокирован</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">Активен</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => router.push(`/dashboard/users/${user.id}`)}
                      className="px-3 py-1.5 bg-craft-amber/20 text-craft-amber rounded-lg text-xs hover:bg-craft-amber/30 transition"
                    >
                      Подробнее
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-2 rounded bg-craft-card border border-craft-border text-craft-muted disabled:opacity-30 hover:text-craft-light">
              ← Назад
            </button>
            <span className="text-sm text-craft-muted">Стр. {page} из {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-2 rounded bg-craft-card border border-craft-border text-craft-muted disabled:opacity-30 hover:text-craft-light">
              Вперёд →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
