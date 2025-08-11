'use client'
import { useEffect, useState } from 'react'
type SetRow = { id:string, name:string }
type QuizRow = { id:string, quizCode:string, name:string, questionSet:{name:string}, isActive:boolean }
export default function Quizzes() {
  const [sets, setSets] = useState<SetRow[]>([])
  const [rows, setRows] = useState<QuizRow[]>([])
  const [name, setName] = useState('')
  const [setId, setSetId] = useState<string>('')
  const load = async () => {
    const r = await fetch('/api/admin/quizzes'); const d = await r.json()
    setRows(d.items); setSets(d.sets); if (!setId && d.sets[0]?.id) setSetId(d.sets[0].id)
  }
  useEffect(()=>{ load() }, [])
  const createOne = async () => {
    await fetch('/api/admin/quizzes', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, questionSetId: setId }) })
    setName(''); await load()
  }
  const toggle = async (id:string, isActive:boolean) => {
    await fetch(`/api/admin/quizzes/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ isActive: !isActive }) })
    await load()
  }
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Quizzes</h1>
      <div className="border rounded p-4 bg-white space-y-2">
        <div className="font-medium">Create Quiz</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="border p-2 rounded" placeholder="Quiz Name" value={name} onChange={e=>setName(e.target.value)} />
          <select className="border p-2 rounded" value={setId} onChange={e=>setSetId(e.target.value)}>{sets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <button onClick={createOne} className="bg-sky-600 text-white rounded px-4">Create</button>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.id} className="border rounded p-3 bg-white flex items-center justify-between">
            <div><div className="font-medium">{r.name} — <span className="font-mono">{r.quizCode}</span></div><div className="text-xs text-gray-500">{r.questionSet.name}</div></div>
            <div className="flex gap-2"><a className="underline text-sky-700" href={`/admin/quizzes/${r.id}/participants`}>Participants</a><button onClick={()=>toggle(r.id, r.isActive)} className={"px-3 py-1 rounded " + (r.isActive?'bg-red-100':'bg-green-100')}>{r.isActive?'Deactivate':'Activate'}</button></div>
          </div>
        ))}
      </div>
    </main>
  )
}
