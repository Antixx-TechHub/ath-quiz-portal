'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const submit = async () => {
    setError(null)
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.ok) window.location.href = '/admin'; else setError('Invalid credentials')
  }
  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Login</h1>
      <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full border p-2 rounded" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={submit} className="w-full bg-sky-600 text-white p-2 rounded">Login</button>
      {error && <p className="text-red-600">{error}</p>}
    </main>
  )
}
