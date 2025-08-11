'use client'
import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, FunnelChart, Funnel, LabelList } from 'recharts'

type Row = {
  quizCode:string, name:string, email:string,
  score:number, total:number,
  submittedAt:string|null,
  durationSeconds:number,
  violations:number
}

type Item = { quizId:string, quizCode:string, name:string, total:number, attempted:number, submitted:number, pass:number, fail:number, violations:number }
type Stats = {
  passMarkPercent:number,
  items: Item[],
  totals: { attempted:number, submitted:number, violations:number },
  timeline: { t:string, count:number }[],
  granularity: 'hour'|'day'
}

type SortKey = 'score' | 'submittedAt' | 'duration' | 'violations'
type SortDir = 'asc' | 'desc'

export default function Results() {
  const [rows, setRows] = useState<Row[]>([])
  const [quizCode, setQuizCode] = useState('')
  const [q, setQ] = useState('')
  const [range, setRange] = useState<'24h'|'7d'|'30d'>('7d')
  const [stats, setStats] = useState<Stats | null>(null)

  // table data
  useEffect(() => {
    const load = async () => {
      const r = await fetch('/api/admin/results?quizCode='+encodeURIComponent(quizCode)+'&q='+encodeURIComponent(q))
      const d = await r.json()
      setRows(d.items)
    }
    load()
  }, [quizCode, q])

  // stats for dropdown + charts
  const fetchStats = async () => {
    const r = await fetch('/api/admin/stats?quizCode='+encodeURIComponent(quizCode)+'&range='+range)
    const d: Stats = await r.json()
    setStats(d)
  }
  useEffect(() => { fetchStats() }, [quizCode, range])

  const quizOptions = useMemo(() =>
    [{ quizCode: '', name: 'All Quizzes' }].concat((stats?.items||[]).map(i=>({quizCode: i.quizCode, name: `${i.name} (${i.quizCode})`}))),
    [stats]
  )

  const timeline = (stats?.timeline || []).map(p => ({
    label: new Date(p.t).toLocaleString(),
    count: p.count
  }))

  const funnel = useMemo(() => {
    const items = stats?.items || []
    if (quizCode) {
      const i = items.find(x => x.quizCode === quizCode)
      if (!i) return []
      return [
        { name: 'Total', value: i.total },
        { name: 'Attempted', value: i.attempted },
        { name: 'Submitted', value: i.submitted },
        { name: 'Pass', value: i.pass },
        { name: 'Fail', value: i.fail },
      ]
    }
    const agg = items.reduce((a, i) => ({
      total: a.total + i.total,
      attempted: a.attempted + i.attempted,
      submitted: a.submitted + i.submitted,
      pass: a.pass + i.pass,
      fail: a.fail + i.fail,
    }), { total:0, attempted:0, submitted:0, pass:0, fail:0 })
    return [
      { name: 'Total', value: agg.total },
      { name: 'Attempted', value: agg.attempted },
      { name: 'Submitted', value: agg.submitted },
      { name: 'Pass', value: agg.pass },
      { name: 'Fail', value: agg.fail },
    ]
  }, [stats, quizCode])

  // sorting
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const sortedRows = useMemo(() => {
    const copy = rows.slice()
    copy.sort((a,b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'score') return (a.score - b.score) * dir
      if (sortKey === 'violations') return ((a.violations||0) - (b.violations||0)) * dir
      if (sortKey === 'duration') return ((a.durationSeconds||0) - (b.durationSeconds||0)) * dir
      const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : -Infinity
      const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : -Infinity
      return (ta - tb) * dir
    })
    return copy
  }, [rows, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    setSortKey(prev => (prev === k ? prev : k))
    setSortDir(prev => (sortKey === k ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'))
  }

  const vioClass = (n: number) =>
    n >= 3 ? 'bg-red-50 text-red-800' : n >= 1 ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'

  const exportCsv = () => {
    window.location.href = '/api/admin/results?format=csv&quizCode='+encodeURIComponent(quizCode)+'&q='+encodeURIComponent(q)
  }

  const mins = (s: number|undefined|null) => Math.round((s ?? 0) / 60)

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Results</h1>
        <div className="text-sm text-gray-500">Pass mark: {stats?.passMarkPercent ?? 50}%</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select className="border rounded p-2" value={quizCode} onChange={e=>setQuizCode(e.target.value)}>
          {quizOptions.map(q => <option key={q.quizCode} value={q.quizCode}>{q.name}</option>)}
        </select>
        <select className="border rounded p-2" value={range} onChange={e=>setRange(e.target.value as any)}>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
        <input className="border p-2 rounded flex-1" placeholder="Search name or email..." value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={exportCsv} className="border rounded px-3">Export CSV</button>
      </div>

      {/* Charts: line + funnel */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded p-4 bg-white">
          <div className="font-medium mb-2">Submissions over time</div>
          <div style={{height:280}}>
            <ResponsiveContainer>
              <LineChart data={(stats?.timeline || []).map(p=>({ label: new Date(p.t).toLocaleString(), count: p.count }))}>
                <XAxis dataKey="label" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" name="Submitted" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border rounded p-4 bg-white">
          <div className="font-medium mb-2">Funnel</div>
          <div style={{height:280}}>
            <ResponsiveContainer>
              <FunnelChart>
                <Funnel dataKey="value" data={(() => {
                  // re-use memoized funnel; it's small
                  return funnel
                })()}>
                  <LabelList position="right" fill="#111" stroke="none" dataKey="name" />
                  <LabelList position="inside" fill="#fff" stroke="none" dataKey="value" />
                </Funnel>
                <Tooltip />
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm bg-white">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Quiz Code</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border cursor-pointer" onClick={()=>toggleSort('score')}>
                Score {sortKey==='score' ? (sortDir==='asc'?'↑':'↓') : ''}
              </th>
              <th className="p-2 border cursor-pointer" onClick={()=>toggleSort('submittedAt')}>
                Submitted At {sortKey==='submittedAt' ? (sortDir==='asc'?'↑':'↓') : ''}
              </th>
              <th className="p-2 border cursor-pointer" onClick={()=>toggleSort('duration')}>
                Completion (min) {sortKey==='duration' ? (sortDir==='asc'?'↑':'↓') : ''}
              </th>
              <th className="p-2 border cursor-pointer" onClick={()=>toggleSort('violations')}>
                Violations {sortKey==='violations' ? (sortDir==='asc'?'↑':'↓') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r,i) => (
              <tr key={i}>
                <td className="p-2 border">{r.quizCode}</td>
                <td className="p-2 border">{r.name}</td>
                <td className="p-2 border">{r.email}</td>
                <td className="p-2 border">{r.score}/{r.total}</td>
                <td className="p-2 border">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ''}</td>
                <td className="p-2 border">{mins(r.durationSeconds)}</td>
                <td className={"p-2 border font-medium text-center " + (r.violations>=3 ? 'bg-red-50 text-red-800' : r.violations>=1 ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800')}>
                  {r.violations ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
