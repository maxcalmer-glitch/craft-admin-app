'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://craft-main-app.vercel.app'
const SECRET = 'craft-webhook-secret-2026'

const CATEGORIES = ['manuals', 'private', 'schemes', 'training', 'contacts', 'tables']
const FILE_TYPES = ['pdf', 'txt', 'xlsx', 'csv', 'none']

interface ShopItem {
  id: number
  category: string
  title: string
  description: string
  price_caps: number
  content_text: string
  file_url: string
  file_type: string
  is_active: boolean
}

const emptyForm = { category: 'manuals', title: '', description: '', price_caps: 0, content_text: '', file_type: 'none', file_url: '' }

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchItems = () => {
    fetch(`${API_URL}/api/admin/shop/items?secret=${SECRET}`)
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchItems() }, [])

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal('add') }
  const openEdit = (item: ShopItem) => {
    setForm({ category: item.category, title: item.title, description: item.description || '', price_caps: item.price_caps, content_text: item.content_text || '', file_type: item.file_type || 'none', file_url: item.file_url || '' })
    setEditId(item.id); setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = modal === 'add' ? `${API_URL}/api/admin/shop/add-item?secret=${SECRET}` : `${API_URL}/api/admin/shop/update-item?secret=${SECRET}`
      const body = modal === 'edit' ? { id: editId, ...form } : form
      await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setModal(null); fetchItems()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот товар?')) return
    await fetch(`${API_URL}/api/admin/shop/delete-item?secret=${SECRET}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchItems()
  }

  const updateForm = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }))

  return (
    <div>
      <Header title="🛒 Магазин" />
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-craft-light">Товары магазина</h2>
          <button onClick={openAdd} className="bg-craft-amber hover:bg-craft-gold text-craft-dark px-4 py-2 rounded-lg font-medium transition">+ Добавить товар</button>
        </div>

        {loading ? (
          <div className="text-craft-amber animate-pulse">Загрузка...</div>
        ) : (
          <div className="bg-craft-card border border-craft-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-craft-border text-craft-muted text-left">
                  <th className="p-3">ID</th><th className="p-3">Категория</th><th className="p-3">Название</th><th className="p-3">Цена 🧢</th><th className="p-3">Тип файла</th><th className="p-3">Активен</th><th className="p-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-craft-border/50 text-craft-light hover:bg-craft-dark/50">
                    <td className="p-3 text-craft-muted">{item.id}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3 font-medium">{item.title}</td>
                    <td className="p-3 text-craft-gold">{item.price_caps}</td>
                    <td className="p-3 text-craft-muted">{item.file_type || '—'}</td>
                    <td className="p-3">{item.is_active !== false ? '✅' : '❌'}</td>
                    <td className="p-3 space-x-2">
                      <button onClick={() => openEdit(item)} className="text-craft-amber hover:text-craft-gold transition">✏️</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 transition">🗑️</button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-craft-muted">Нет товаров</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-craft-card border border-craft-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-craft-gold mb-4">{modal === 'add' ? 'Добавить товар' : 'Редактировать товар'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-craft-muted text-sm">Категория</label>
                <select value={form.category} onChange={e => updateForm('category', e.target.value)} className="w-full bg-craft-dark border border-craft-border rounded-lg p-2 text-craft-light">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-craft-muted text-sm">Название</label>
                <input value={form.title} onChange={e => updateForm('title', e.target.value)} className="w-full bg-craft-dark border border-craft-border rounded-lg p-2 text-craft-light" />
              </div>
              <div>
                <label className="text-craft-muted text-sm">Описание</label>
                <textarea value={form.description} onChange={e => updateForm('description', e.target.value)} rows={3} className="w-full bg-craft-dark border border-craft-border rounded-lg p-2 text-craft-light" />
              </div>
              <div>
                <label className="text-craft-muted text-sm">Цена (крышки)</label>
                <input type="number" value={form.price_caps} onChange={e => updateForm('price_caps', parseInt(e.target.value) || 0)} className="w-full bg-craft-dark border border-craft-border rounded-lg p-2 text-craft-light" />
              </div>
              <div>
                <label className="text-craft-muted text-sm">Контент/текст товара</label>
                <textarea value={form.content_text} onChange={e => updateForm('content_text', e.target.value)} rows={4} className="w-full bg-craft-dark border border-craft-border rounded-lg p-2 text-craft-light" />
              </div>
              <div>
                <label className="text-craft-muted text-sm">Тип файла</label>
                <select value={form.file_type} onChange={e => updateForm('file_type', e.target.value)} className="w-full bg-craft-dark border border-craft-border rounded-lg p-2 text-craft-light">
                  {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-craft-muted text-sm">URL файла (опционально)</label>
                <input value={form.file_url} onChange={e => updateForm('file_url', e.target.value)} className="w-full bg-craft-dark border border-craft-border rounded-lg p-2 text-craft-light" placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-craft-border text-craft-muted hover:text-craft-light transition">Отмена</button>
              <button onClick={handleSave} disabled={saving} className="bg-craft-amber hover:bg-craft-gold text-craft-dark px-4 py-2 rounded-lg font-medium transition disabled:opacity-50">
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
