'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'

interface KnowledgeItem {
  id: number
  title: string
  content: string
  source: string
  priority: number
  is_active: boolean
  created_at: string
}

export default function AIKnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', source: 'admin', priority: '10' })
  const [feedback, setFeedback] = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('craft_admin_token') : ''
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const fetchData = () => {
    fetch('/api/ai-knowledge', { headers }).then(r => r.json()).then(d => setItems(d.items || [])).finally(() => setLoading(false))
  }
  useEffect(() => { fetchData() }, [])

  const save = async () => {
    const res = await fetch('/api/ai-knowledge', {
      method: 'POST', headers,
      body: JSON.stringify({ ...form, priority: parseInt(form.priority) || 5 })
    })
    const data = await res.json()
    setFeedback(data.success ? '✅ Добавлено в базу знаний' : `❌ ${data.error}`)
    setShowNew(false); setForm({ title: '', content: '', source: 'admin', priority: '10' }); fetchData()
    setTimeout(() => setFeedback(''), 3000)
  }

  const deleteItem = async (id: number) => {
    if (!confirm('Удалить материал из базы знаний?')) return
    await fetch(`/api/ai-knowledge?id=${id}`, { method: 'DELETE', headers })
    fetchData()
  }

  const toggleActive = async (id: number, active: boolean) => {
    await fetch(`/api/ai-knowledge?id=${id}`, { method: 'PATCH', headers, body: JSON.stringify({ is_active: !active }) })
    fetchData()
  }

  return (
    <div>
      <Header title="🤖 База знаний ИИ помощника" />
      <div className="p-8">
        {feedback && <div className="mb-4 px-4 py-3 rounded-lg bg-craft-card border border-craft-amber/30 text-sm">{feedback}</div>}

        <div className="flex gap-4 mb-6">
          <button onClick={() => setShowNew(true)}
            className="px-4 py-2 bg-craft-amber text-craft-bg font-bold rounded-lg hover:opacity-90 text-sm">
            ➕ Добавить материал
          </button>
          <div className="flex items-center text-sm text-craft-muted">
            📚 Всего материалов: {items.length} | Активных: {items.filter(i => i.is_active).length}
          </div>
        </div>

        {showNew && (
          <div className="bg-craft-card border border-craft-border rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-craft-gold mb-4">📝 Новый материал</h3>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Заголовок"
              className="w-full mb-3 px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
            <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})}
              placeholder="Содержание материала (текст, который ИИ будет использовать для ответов)"
              className="w-full mb-3 px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light h-40 resize-none font-mono text-sm" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <select value={form.source} onChange={e => setForm({...form, source: e.target.value})}
                className="px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light">
                <option value="admin">Админский контент</option>
                <option value="docs">Документация</option>
                <option value="faq">FAQ</option>
              </select>
              <input value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                placeholder="Приоритет (1-10)" type="number" min="1" max="10"
                className="px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
            </div>
            <div className="flex gap-3">
              <button onClick={save} className="px-4 py-2 bg-craft-gold text-craft-bg font-bold rounded-lg text-sm">💾 Сохранить</button>
              <button onClick={() => setShowNew(false)} className="px-4 py-2 bg-craft-border text-craft-light rounded-lg text-sm">Отмена</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {loading ? <div className="text-craft-amber">Загрузка...</div> : items.length === 0 ? (
            <div className="text-craft-muted text-center py-8">База знаний пуста. Добавьте первый материал.</div>
          ) : items.map(item => (
            <div key={item.id} className={`bg-craft-card border rounded-xl p-5 ${item.is_active ? 'border-craft-border' : 'border-red-900/50 opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-craft-light">{item.title || 'Без заголовка'}</h4>
                    <span className="px-2 py-0.5 bg-craft-amber/20 text-craft-amber rounded text-xs">Приоритет: {item.priority}</span>
                    <span className="px-2 py-0.5 bg-craft-border text-craft-muted rounded text-xs">{item.source}</span>
                  </div>
                  <p className="text-sm text-craft-muted line-clamp-3">{item.content}</p>
                  <p className="text-xs text-craft-muted mt-2">Добавлено: {new Date(item.created_at).toLocaleString('ru')}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => toggleActive(item.id, item.is_active)}
                    className={`px-2 py-1 rounded text-xs ${item.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {item.is_active ? '✅' : '❌'}
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
