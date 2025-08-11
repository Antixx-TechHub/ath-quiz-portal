'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

type Row = { quizId:string, quizCode:string, name:string, total:number, attempted:number, submitted:number, pass:number, fail:number }
type Stats = { passMarkPercent:number, items: Row[] }
const COLORS = ["#60a5fa","#10b981","#ef4444","#f59e0b"]

export default function AdminHome() {
  const [data, setData] = useState<Stats | null>(null)
  useEffect(() => { fetch('/api/admin/stats').then(r=>r.json()).then(setData) }, [])
  const rows = data?.items || []

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">Pass mark: {data?.passMarkPercent ?? 50}%</div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Link className="border rounded p-4 bg-white hover:bg-gray-50" href="/admin/question-sets">Question Sets →</Link>
        <Link className="border rounded p-4 bg-white hover:bg-gray-50" href="/admin/quizzes">Quizzes →</Link>
        <Link className="border rounded p-4 bg-white hover:bg-gray-50" href="/admin/results">Results →</Link>
      </div>

      <div className="border rounded p-4 bg-white">
        <div className="font-medium mb-2">Attempts per quiz</div>
        <div style={{height:320}}>
          <ResponsiveContainer>
            <BarChart data={rows}>
              <XAxis dataKey="quizCode" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="attempted" name="Attempted" />
              <Bar dataKey="submitted" name="Submitted" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map(r => (
          <div key={r.quizId} className="border rounded p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.name} — <span className="font-mono">{r.quizCode}</span></div>
              <Link className="text-sky-700 underline" href={`/admin/quizzes/${r.quizId}/participants`}>Participants</Link>
            </div>
            <div className="text-sm text-gray-500 mb-2">Total: {r.total}</div>
            <div style={{height:260}}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[
                    { name: "Pass", value: r.pass },
                    { name: "Fail", value: r.fail },
                    { name: "Attempted (not submitted)", value: Math.max(0, r.attempted - r.submitted) },
                    { name: "Not started", value: Math.max(0, r.total - r.attempted) },
                  ]} dataKey="value" nameKey="name" outerRadius={100} label>
                    {COLORS.map((c,i)=><Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
