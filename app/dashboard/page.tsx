'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import StatCard from '@/components/StatCard'

interface Stats {
  totalUsers: number
  newToday: number
  activeToday: number
  totalAiRequests: number
  aiCostUsd: number
  totalCapsCirculation: number
  totalCapsOnBalances: number
  totalReferrals: number
  pendingApplications: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('craft_admin_token')
    fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <Header title="📊 Dashboard" />
      <div className="p-8">
        {loading ? (
          <div className="text-craft-amber animate-pulse">Загрузка статистики...</div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👥" label="Всего пользователей" value={stats.totalUsers} />
            <StatCard icon="🆕" label="Новых сегодня" value={stats.newToday} />
            <StatCard icon="🔥" label="Активных сегодня" value={stats.activeToday} />
            <StatCard icon="🤖" label="Запросов к ИИ" value={stats.totalAiRequests} />
            <StatCard icon="💰" label="Расходы на API ИИ" value={`$${stats.aiCostUsd.toFixed(2)}`} sub="Себестоимость" />
            <StatCard icon="🧢" label="Крышек в обороте" value={stats.totalCapsCirculation} />
            <StatCard icon="💎" label="Крышек на балансах" value={stats.totalCapsOnBalances} />
            <StatCard icon="🔗" label="Всего рефералов" value={stats.totalReferrals} />
          </div>
        ) : (
          <div className="text-red-400">Ошибка загрузки статистики</div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-craft-card border border-craft-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-craft-gold mb-4">⏰ Последние действия</h3>
            <p className="text-craft-muted text-sm">Audit log пока пуст</p>
          </div>
          <div className="bg-craft-card border border-craft-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-craft-gold mb-4">📋 Заявки на подключение</h3>
            <p className="text-craft-muted text-sm">
              {stats ? `${stats.pendingApplications} ожидающих` : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
