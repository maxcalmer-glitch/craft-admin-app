'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/users', icon: '👥', label: 'Пользователи' },
  { href: '/dashboard/offers', icon: '📋', label: 'Офферы' },
  { href: '/dashboard/broadcasts', icon: '📢', label: 'Рассылки' },
  { href: '/dashboard/achievements', icon: '🏆', label: 'Достижения' },
  { href: '/dashboard/ai-knowledge', icon: '🤖', label: 'База знаний ИИ' },
  { href: '/dashboard/shop', icon: '🛒', label: 'Магазин' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Настройки' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('craft_admin_token')
    localStorage.removeItem('craft_admin_user')
    localStorage.removeItem('craft_admin_role')
    router.push('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-craft-dark border-r border-craft-border flex flex-col">
      <div className="p-6 border-b border-craft-border">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍺</span>
          <div>
            <h1 className="text-xl font-bold text-craft-gold">CRAFT</h1>
            <p className="text-xs text-craft-muted">Admin Panel V3</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm ${
                isActive
                  ? 'bg-craft-amber/20 text-craft-gold border border-craft-amber/30'
                  : 'text-craft-muted hover:text-craft-light hover:bg-craft-card'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-craft-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition w-full text-sm"
        >
          <span className="text-lg">🚪</span>
          Выйти
        </button>
      </div>
    </aside>
  )
}
