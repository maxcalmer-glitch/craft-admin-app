import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRAFT Admin Panel V3',
  description: 'Enterprise Admin Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-craft-bg text-craft-light antialiased">
        {children}
      </body>
    </html>
  )
}
