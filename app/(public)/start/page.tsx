'use client'
import { useState } from 'react'

export default function StartPage() {
  const [quizCode, setQuizCode] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const begin = async () => {
    setError(null); setLoading(true)
    try {
      const res = await fetch('/api/quiz/init', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ quizCode, name, email, mobile }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      window.location.href = `/quiz/${encodeURIComponent(data.participantId)}`
    } catch (e:any) {
      setError(e.message || 'Failed to start')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-bold">Enter Quiz</h1>
      <input className="w-full border p-2 rounded" placeholder="Quiz Code" value={quizCode} onChange={e=>setQuizCode(e.target.value)} />
      <input className="w-full border p-2 rounded" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} />
      <input className="w-full border p-2 rounded" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full border p-2 rounded" placeholder="Mobile Number" value={mobile} onChange={e=>setMobile(e.target.value)} />
      <button onClick={begin} disabled={loading} className="w-full bg-sky-600 text-white p-2 rounded">{loading?'Starting...':'Begin'}</button>
      {error && <p className="text-red-600">{error}</p>}
      <p className="text-sm text-gray-500">This app requests fullscreen when the quiz starts.</p>
    </main>
  )
}
