'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'

interface Achievement {
  id: number
  code: string
  name: string
  description: string
  icon: string
  reward_caps: number
  is_active: boolean
  earned_count?: number
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', description: '', icon: '🏆', reward_caps: '' })
  const [feedback, setFeedback] = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('craft_admin_token') : ''
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const fetchData = () => {
    fetch('/api/achievements', { headers }).then(r => r.json()).then(d => setAchievements(d.achievements || [])).finally(() => setLoading(false))
  }
  useEffect(() => { fetchData() }, [])

  const save = async (isNew: boolean) => {
    const body = { ...form, reward_caps: parseInt(form.reward_caps) || 0 }
    const url = isNew ? '/api/achievements' : `/api/achievements?id=${editing}`
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers, body: JSON.stringify(body) })
    const data = await res.json()
    setFeedback(data.success ? '✅ Сохранено' : `❌ ${data.error}`)
    setEditing(null); setShowNew(false); fetchData()
    setTimeout(() => setFeedback(''), 3000)
  }

  const toggleActive = async (id: number, active: boolean) => {
    await fetch(`/api/achievements?id=${id}`, { method: 'PATCH', headers, body: JSON.stringify({ is_active: !active }) })
    fetchData()
  }

  const deleteAch = async (id: number) => {
    if (!confirm('Удалить достижение?')) return
    await fetch(`/api/achievements?id=${id}`, { method: 'DELETE', headers })
    fetchData()
  }

  return (
    <div>
      <Header title="🏆 Управление достижениями" />
      <div className="p-8">
        {feedback && <div className="mb-4 px-4 py-3 rounded-lg bg-craft-card border border-craft-amber/30 text-sm">{feedback}</div>}

        <button onClick={() => { setShowNew(true); setForm({ code: '', name: '', description: '', icon: '🏆', reward_caps: '' }) }}
          className="mb-6 px-4 py-2 bg-craft-amber text-craft-bg font-bold rounded-lg hover:opacity-90 text-sm">
          ➕ Добавить достижение
        </button>

        {(showNew || editing !== null) && (
          <div className="bg-craft-card border border-craft-border rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="Код (уникальный)"
                className="px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Название"
                className="px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Описание"
                className="px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
              <input value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} placeholder="Иконка"
                className="px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
              <input value={form.reward_caps} onChange={e => setForm({...form, reward_caps: e.target.value})} placeholder="Награда (крышки)" type="number"
                className="px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => save(showNew)} className="px-4 py-2 bg-craft-gold text-craft-bg font-bold rounded-lg text-sm">💾 Сохранить</button>
              <button onClick={() => { setShowNew(false); setEditing(null) }} className="px-4 py-2 bg-craft-border text-craft-light rounded-lg text-sm">Отмена</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? <div className="text-craft-amber">Загрузка...</div> : achievements.map(a => (
            <div key={a.id} className={`bg-craft-card border rounded-xl p-5 ${a.is_active ? 'border-craft-border' : 'border-red-900/50 opacity-60'}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{a.icon}</span>
                <div>
                  <h4 className="font-bold text-craft-light">{a.name}</h4>
                  <p className="text-xs text-craft-muted">{a.code}</p>
                </div>
              </div>
              <p className="text-sm text-craft-muted mb-3">{a.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-craft-gold font-bold">{a.reward_caps} 🧢</span>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(a.id, a.is_active)}
                    className={`px-2 py-1 rounded text-xs ${a.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {a.is_active ? '✅' : '❌'}
                  </button>
                  <button onClick={() => {
                    setEditing(a.id); setShowNew(false)
                    setForm({ code: a.code, name: a.name, description: a.description || '', icon: a.icon, reward_caps: String(a.reward_caps) })
                  }} className="px-2 py-1 bg-craft-amber/20 text-craft-amber rounded text-xs">✏️</button>
                  <button onClick={() => deleteAch(a.id)} className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
