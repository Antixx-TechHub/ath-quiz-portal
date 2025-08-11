'use client'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // Hide the admin shell entirely on the login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const notRoot = pathname !== '/admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="mx-auto max-w-6xl p-3 flex items-center gap-3">
          {notRoot && (
            <button
              onClick={() => router.push('/admin')}
              className="px-3 py-1 rounded-full border bg-white hover:bg-gray-50"
            >
              ← Dashboard
            </button>
          )}
          <div className="text-sm text-gray-500 truncate">
            {pathname.replace('/admin', 'Admin')}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        {children}
      </main>
    </div>
  )
}
