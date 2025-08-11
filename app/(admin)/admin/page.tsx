'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

type Item = {
  quizId:string, quizCode:string, name:string,
  total:number, attempted:number, submitted:number, pass:number, fail:number, violations:number
}
type Stats = {
  passMarkPercent:number,
  items: Item[],
  totals: { attempted:number, submitted:number, violations:number },
  timeline: { t:string, count:number }[],
  granularity: 'hour'|'day'
}

// Color palette
const COL_PASS = '#10b981'  // green
const COL_FAIL = '#ef4444'  // red
const COL_ATTEMPT_NOT_SUB = '#f59e0b' // amber
const COL_NOT_STARTED = '#60a5fa' // blue

export default function AdminHome() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [quizCode, setQuizCode] = useState<string>('')
  const [range, setRange] = useState<'24h'|'7d'|'30d'>('7d')
  const [saving, setSaving] = useState(false)
  const [pm, setPm] = useState<number>(50)

  const fetchStats = async (q=quizCode, r=range) => {
    const res = await fetch(`/api/admin/stats?quizCode=${encodeURIComponent(q)}&range=${encodeURIComponent(r)}`)
    const d: Stats = await res.json()
    setStats(d)
    setPm(d.passMarkPercent)
  }
  useEffect(() => { fetchStats('', '7d') }, [])
  useEffect(() => { if (stats) fetchStats() }, [quizCode, range])

  const quizzes = useMemo(() => {
    const list = stats?.items || []
    return [{ quizCode: '', name: 'All Quizzes' }, ...list.map(i => ({ quizCode: i.quizCode, name: `${i.name} (${i.quizCode})` }))]
  }, [stats])

  const savePassMark = async () => {
    setSaving(true)
    await fetch('/api/admin/config', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ passMarkPercent: pm })
    })
    setSaving(false)
    await fetchStats()
  }

  const timeline = (stats?.timeline || []).map(p => ({
    t: new Date(p.t),
    label: stats?.granularity === 'hour' ? new Date(p.t).toLocaleString() : new Date(p.t).toLocaleDateString(),
    count: p.count
  }))

  const isDrilled = !!quizCode

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isDrilled && (
            <button onClick={()=>setQuizCode('')} className="px-3 py-1 rounded-full border bg-white hover:bg-gray-50">
              ← Back
            </button>
          )}
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Pass mark</span>
          <input
            type="number" min={1} max={100} value={pm}
            onChange={e=>setPm(parseInt(e.target.value||'50',10))}
            className="w-20 border rounded p-1 text-center"
          />
          <button onClick={savePassMark} disabled={saving} className="px-3 py-1 rounded bg-sky-600 text-white">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* quick nav - Question Sets disabled per your request */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="border rounded p-4 bg-gray-100 text-gray-400 cursor-not-allowed" title="Disabled">
          Question Sets →
        </div>
        <Link className="border rounded p-4 bg-white hover:bg-gray-50" href="/admin/quizzes">Quizzes →</Link>
        <Link className="border rounded p-4 bg-white hover:bg-gray-50" href="/admin/results">Results →</Link>
      </div>

      {/* filters as chips */}
      <div className="flex flex-wrap items-center gap-2">
        <select className="border rounded p-2" value={quizCode} onChange={e=>setQuizCode(e.target.value)}>
          {quizzes.map(q => <option key={q.quizCode} value={q.quizCode}>{q.name}</option>)}
        </select>
        <div className="flex gap-2">
          {(['24h','7d','30d'] as const).map(r => (
            <button key={r} onClick={()=>setRange(r)} className={"px-3 py-1 rounded-full border " + (range===r?'bg-sky-600 text-white':'bg-white')}>
              {r==='24h'?'Last 24h': r==='7d'?'Last 7 days':'Last 30 days'}
            </button>
          ))}
        </div>
        <div className="ml-auto text-sm">
          <span className="inline-block mr-2 px-2 py-1 rounded-full bg-amber-50 text-amber-800 border">
            Violations: {stats?.totals.violations ?? 0}
          </span>
        </div>
      </div>

      {/* timeline */}
      <div className="border rounded p-4 bg-white">
        <div className="font-medium mb-2">Submissions over time</div>
        <div style={{height:320}}>
          <ResponsiveContainer>
            <LineChart data={timeline}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} hide={timeline.length>20} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" name="Submitted" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* per-quiz outcome split with enforced colors + violations badge */}
      <div className="border rounded p-4 bg-white">
        <div className="font-medium mb-2">Outcome split (per quiz)</div>
        <div className="grid md:grid-cols-2 gap-3">
          {(stats?.items || []).map(r => {
            const data = [
              { name: "Pass", value: r.pass, color: COL_PASS },
              { name: "Fail", value: r.fail, color: COL_FAIL },
              { name: "Attempted (not submitted)", value: Math.max(0, r.attempted - r.submitted), color: COL_ATTEMPT_NOT_SUB },
              { name: "Not started", value: Math.max(0, r.total - r.attempted), color: COL_NOT_STARTED },
            ]
            return (
              <div key={r.quizId} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {r.name} <span className="text-gray-500 font-mono">({r.quizCode})</span>
                  </div>
                  <div
                    className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border"
                    title="Sum of violation events"
                  >
                    Violations: {r.violations}
                  </div>
                </div>
                <div style={{height:180}}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data} dataKey="value" nameKey="name" outerRadius={70} label>
                        {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
