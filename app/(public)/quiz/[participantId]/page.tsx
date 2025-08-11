'use client'
import { useEffect, useState, useRef } from 'react'

type Q = { id:string, text:string, options:string[], type:'SC'|'MC' }
type S = Record<string, number[]>

const MAX_VIOLATIONS = 3

export default function QuizPage({ params }: { params: { participantId: string }}) {
  const { participantId } = params
  const [started, setStarted] = useState(false)
  const [questions, setQuestions] = useState<Q[]>([])
  const [remaining, setRemaining] = useState<number>(0)
  const [sel, setSel] = useState<S>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [paused, setPaused] = useState(false)
  const [violations, setViolations] = useState(0)
  const lockRef = useRef(false) // avoid double autosubmit

  // Initial load of quiz state
  useEffect(() => {
    let t: any
    const fetchState = async () => {
      const res = await fetch(`/api/quiz/state?participantId=${encodeURIComponent(participantId)}`)
      if (!res.ok) { setError('Unable to load quiz'); return }
      const data = await res.json()
      if (data.locked) { window.location.replace('/thank-you'); return }
      setQuestions(data.questions)
      setRemaining(data.remaining)
      setSel(data.answers || {})
      t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000)
    }
    fetchState()
    return () => clearInterval(t)
  }, [participantId])

  // Fullscreen request must be on gesture
  const enterFullscreen = async () => {
    setError(null)
    try {
      if (document.fullscreenElement == null) {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // Browsers might block; proceed but show hint
      setError('Could not enter full-screen. Press F11 (desktop) or install as PWA.')
    }
    setStarted(true)
  }

  // Violation reporting
  const reportViolation = async (kind: string) => {
    setPaused(true)
    setViolations(v => v + 1)
    try {
      await fetch('/api/quiz/violation', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ participantId, kind })
      })
    } catch {}
  }

  // Listen for tab switch, blur, or fullscreen exit
  useEffect(() => {
    const onVis = () => { if (document.hidden) reportViolation('TAB_SWITCH') }
    const onFs = () => { if (!document.fullscreenElement) reportViolation('EXIT_FULLSCREEN') }
    const onBlur = () => { reportViolation('WINDOW_BLUR') }
    document.addEventListener('visibilitychange', onVis)
    document.addEventListener('fullscreenchange', onFs)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      document.removeEventListener('fullscreenchange', onFs)
      window.removeEventListener('blur', onBlur)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId])

  // Autosubmit after N violations
  useEffect(() => {
    if (violations >= MAX_VIOLATIONS && !lockRef.current) {
      lockRef.current = true
      submit(true)
    }
  }, [violations])

  const resume = async () => {
    setError(null)
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
    } catch {}
    setPaused(false)
  }

  const toggle = async (qid:string, idx:number) => {
    if (!started || paused) return
    const q = questions.find(q => q.id === qid)!
    let next = (sel[qid] || []).slice()
    if (q.type === 'SC') next = [idx]
    else {
      if (next.includes(idx)) next = next.filter(i=>i!==idx); else next.push(idx)
    }
    setSel(s => ({ ...s, [qid]: next }))
    fetch('/api/quiz/save-answer', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ participantId, questionId: qid, selected: next })
    }).catch(()=>{})
  }

  const submit = async (auto=false) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz/submit', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ participantId })
      })
      if (!res.ok) throw new Error(await res.text())
      window.location.href = '/thank-you'
    } catch(e:any) {
      setError((auto ? 'Auto-submission failed: ' : '') + (e.message || 'Submit failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const mm = Math.floor(remaining/60).toString().padStart(2,'0')
  const ss = (remaining%60).toString().padStart(2,'0')

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Start gate */}
      {!started && (
        <div className="fixed inset-0 bg-white grid place-items-center z-40">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">Ready to start?</h1>
            <p className="text-sm text-gray-600">We’ll switch to full-screen. Leaving full-screen or switching tabs will be recorded.</p>
            <button onClick={enterFullscreen} className="bg-sky-600 text-white px-4 py-2 rounded">Start Quiz</button>
            {error && <p className="text-red-600">{error}</p>}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quiz</h1>
        <div className="text-lg font-mono">{mm}:{ss}</div>
      </div>

      {/* Questions */}
      {questions.map((q, qi) => (
        <div key={q.id} className={"border rounded p-4 " + (paused ? "opacity-50 pointer-events-none" : "bg-white")}>
          <div className="font-medium mb-2">{qi+1}. {q.text}</div>
          <div className="grid gap-2">
            {q.options.map((opt, idx) => {
              const picked = (sel[q.id] || []).includes(idx)
              return (
                <button key={idx} onClick={()=>toggle(q.id, idx)}
                  className={"text-left border rounded p-2 " + (picked ? "bg-sky-100 border-sky-400" : "bg-white")}>
                  <span className="font-semibold mr-2">{String.fromCharCode(65+idx)}.</span> {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <button onClick={()=>submit(false)} className="w-full bg-sky-600 text-white p-3 rounded">Submit</button>
      {error && <p className="text-red-600">{error}</p>}

      {/* Pause overlay (left fullscreen / tabbed away) */}
      {paused && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white rounded p-4 shadow max-w-sm text-center space-y-2">
            <div className="text-lg font-medium">Focus lost</div>
            <div className="text-sm text-gray-600">Please return to full-screen to continue. Violations: {violations}/{MAX_VIOLATIONS}</div>
            <button onClick={resume} className="bg-sky-600 text-white px-4 py-2 rounded">Resume</button>
          </div>
        </div>
      )}

      {/* Submit overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white rounded p-4 shadow">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-sm">Submitting...</div>
          </div>
        </div>
      )}
    </main>
  )
}
