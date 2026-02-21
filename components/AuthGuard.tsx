'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('craft_admin_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      if (r.ok) setAuthed(true)
      else {
        localStorage.removeItem('craft_admin_token')
        router.push('/login')
      }
    }).catch(() => router.push('/login'))
  }, [router])

  if (!authed) {
    return (
      <div className="min-h-screen bg-craft-bg flex items-center justify-center">
        <div className="text-craft-amber text-xl animate-pulse">🍺 Загрузка...</div>
      </div>
    )
  }

  return <>{children}</>
}
