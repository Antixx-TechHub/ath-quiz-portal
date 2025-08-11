'use client'
import { useEffect, useState } from 'react'
type Row = { name:string, email:string, mobile:string, status:string, createdAt:string }
export default function ParticipantsPage({ params }: { params: { id:string }}) {
  const [rows, setRows] = useState<Row[]>([])
  const load = async () => { const r = await fetch(`/api/admin/quizzes/${params.id}/participants`); const d = await r.json(); setRows(d.items) }
  useEffect(()=>{ load() }, [params.id])
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Participants</h1>
      <table className="w-full text-sm bg-white border rounded">
        <thead><tr className="bg-gray-100 text-left"><th className="p-2 border">Name</th><th className="p-2 border">Email</th><th className="p-2 border">Mobile</th><th className="p-2 border">Status</th><th className="p-2 border">Registered</th></tr></thead>
        <tbody>{rows.map((r,i)=>(<tr key={i}><td className="p-2 border">{r.name}</td><td className="p-2 border">{r.email}</td><td className="p-2 border">{r.mobile}</td><td className="p-2 border">{r.status}</td><td className="p-2 border">{new Date(r.createdAt).toLocaleString()}</td></tr>))}</tbody>
      </table>
    </main>
  )
}
