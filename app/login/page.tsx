'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()

      if (data.success) {
        localStorage.setItem('craft_admin_token', data.token)
        localStorage.setItem('craft_admin_user', data.username)
        localStorage.setItem('craft_admin_role', data.role)
        router.push('/dashboard')
      } else {
        setError(data.error || 'Неверные учетные данные')
      }
    } catch {
      setError('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-craft-bg">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍺</div>
          <h1 className="text-3xl font-bold text-craft-gold">CRAFT</h1>
          <p className="text-craft-muted mt-2">Enterprise Admin Panel V3</p>
        </div>

        <form onSubmit={handleLogin} className="bg-craft-card border border-craft-border rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-craft-muted mb-1">Логин</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light focus:border-craft-amber focus:ring-1 focus:ring-craft-amber outline-none"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-craft-muted mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-craft-border bg-craft-dark text-craft-light focus:border-craft-amber focus:ring-1 focus:ring-craft-amber outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-craft-amber to-craft-gold text-craft-bg font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти в панель'}
          </button>
        </form>

        <p className="text-center text-craft-muted text-xs mt-6">CRAFT Admin V3.0 • Enterprise Security</p>
      </div>
    </div>
  )
}
