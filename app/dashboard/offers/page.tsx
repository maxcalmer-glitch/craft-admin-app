'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'

interface Offer {
  id: number
  category: string
  description: string
  rate_from: number
  rate_to: number
  is_active: boolean
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [form, setForm] = useState({ category: '', description: '', rate_from: '', rate_to: '' })
  const [showNew, setShowNew] = useState(false)
  const [feedback, setFeedback] = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('craft_admin_token') : ''
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const fetchOffers = () => {
    fetch('/api/offers', { headers }).then(r => r.json()).then(d => setOffers(d.offers || [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchOffers() }, [])

  const saveOffer = async (isNew: boolean) => {
    const body = {
      category: form.category,
      description: form.description,
      rate_from: parseFloat(form.rate_from),
      rate_to: parseFloat(form.rate_to),
    }
    const url = isNew ? '/api/offers' : `/api/offers?id=${editing}`
    const method = isNew ? 'POST' : 'PUT'
    const res = await fetch(url, { method, headers, body: JSON.stringify(body) })
    const data = await res.json()
    setFeedback(data.success ? '✅ Сохранено' : `❌ ${data.error}`)
    setEditing(null); setShowNew(false)
    fetchOffers()
    setTimeout(() => setFeedback(''), 3000)
  }

  const deleteOffer = async (id: number) => {
    if (!confirm('Удалить оффер?')) return
    await fetch(`/api/offers?id=${id}`, { method: 'DELETE', headers })
    fetchOffers()
  }

  const toggleActive = async (id: number, active: boolean) => {
    await fetch(`/api/offers?id=${id}`, { method: 'PATCH', headers, body: JSON.stringify({ is_active: !active }) })
    fetchOffers()
  }

  return (
    <div>
      <Header title="📋 Управление офферами" />
      <div className="p-8">
        {feedback && <div className="mb-4 px-4 py-3 rounded-lg bg-craft-card border border-craft-amber/30 text-sm">{feedback}</div>}

        <button onClick={() => { setShowNew(true); setForm({ category: '', description: '', rate_from: '', rate_to: '' }) }}
          className="mb-6 px-4 py-2 bg-craft-amber text-craft-bg font-bold rounded-lg hover:opacity-90 text-sm">
          ➕ Добавить оффер
        </button>

        {(showNew || editing !== null) && (
          <div className="bg-craft-card border border-craft-border rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-craft-gold mb-4">{showNew ? 'Новый оффер' : 'Редактирование'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                placeholder="Категория" className="px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Описание" className="px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
              <input value={form.rate_from} onChange={e => setForm({...form, rate_from: e.target.value})}
                placeholder="Ставка от %" type="number" className="px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
              <input value={form.rate_to} onChange={e => setForm({...form, rate_to: e.target.value})}
                placeholder="Ставка до %" type="number" className="px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => saveOffer(showNew)} className="px-4 py-2 bg-craft-gold text-craft-bg font-bold rounded-lg text-sm">💾 Сохранить</button>
              <button onClick={() => { setShowNew(false); setEditing(null) }} className="px-4 py-2 bg-craft-border text-craft-light rounded-lg text-sm">Отмена</button>
            </div>
          </div>
        )}

        <div className="bg-craft-card border border-craft-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-craft-border text-craft-muted text-sm">
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Категория</th>
                <th className="px-4 py-3 text-left">Описание</th>
                <th className="px-4 py-3 text-center">Ставка</th>
                <th className="px-4 py-3 text-center">Статус</th>
                <th className="px-4 py-3 text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-craft-amber">Загрузка...</td></tr>
              ) : offers.map(offer => (
                <tr key={offer.id} className="border-b border-craft-border/50 hover:bg-craft-border/10">
                  <td className="px-4 py-3 text-sm">{offer.id}</td>
                  <td className="px-4 py-3 text-sm font-medium">{offer.category}</td>
                  <td className="px-4 py-3 text-sm text-craft-muted">{offer.description}</td>
                  <td className="px-4 py-3 text-sm text-center text-craft-gold">{offer.rate_from}% — {offer.rate_to}%</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(offer.id, offer.is_active)}
                      className={`px-2 py-1 rounded text-xs ${offer.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {offer.is_active ? 'Активен' : 'Выключен'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button onClick={() => {
                      setEditing(offer.id); setShowNew(false)
                      setForm({ category: offer.category, description: offer.description, rate_from: String(offer.rate_from), rate_to: String(offer.rate_to) })
                    }} className="px-2 py-1 bg-craft-amber/20 text-craft-amber rounded text-xs">✏️</button>
                    <button onClick={() => deleteOffer(offer.id)} className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
