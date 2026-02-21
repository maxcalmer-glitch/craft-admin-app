'use client'

import Sidebar from '@/components/Sidebar'
import AuthGuard from '@/components/AuthGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-craft-bg">{children}</main>
      </div>
    </AuthGuard>
  )
}
