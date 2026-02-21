'use client'

import { useEffect, useState } from 'react'

export default function Header({ title }: { title: string }) {
  const [user, setUser] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    setUser(localStorage.getItem('craft_admin_user') || '')
    setRole(localStorage.getItem('craft_admin_role') || '')
  }, [])

  return (
    <header className="h-16 border-b border-craft-border bg-craft-dark/50 backdrop-blur flex items-center justify-between px-8">
      <h2 className="text-xl font-bold text-craft-light">{title}</h2>
      <div className="flex items-center gap-3">
        <span className="text-sm text-craft-muted">
          {user} <span className="text-xs px-2 py-0.5 bg-craft-amber/20 text-craft-amber rounded-full ml-1">{role}</span>
        </span>
      </div>
    </header>
  )
}
