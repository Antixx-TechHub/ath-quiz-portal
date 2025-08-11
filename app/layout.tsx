import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quiz PWA',
  description: 'Installable quiz app with offline and admin dashboard',
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
