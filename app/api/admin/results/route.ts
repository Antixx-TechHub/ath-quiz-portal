import { prisma } from "@/src/lib/db"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const quizCode = (searchParams.get('quizCode') || '').trim()
  const q = (searchParams.get('q') || '').trim()
  const format = (searchParams.get('format') || 'json').toLowerCase()

  const where: any = {}
  if (quizCode) where.quiz = { quizCode }
  if (q) where.OR = [
    { name: { contains: q, mode: 'insensitive' } },
    { email: { contains: q, mode: 'insensitive' } },
  ]

  const parts = await prisma.participant.findMany({
    where,
    include: {
      quiz: true,
      attempt: { select: { score: true, submittedAt: true, durationSeconds: true, violations: true } },
    },
    orderBy: { createdAt: 'desc' }
  })

  if (format === 'csv') {
    const rows = [['quizCode','name','email','mobile','score','total','timeSeconds','submittedAt','status','violations'].join(',')]
    for (const p of parts) {
      const score = p.attempt?.score ?? 0
      const total = p.quiz.questionCount
      const sAt = p.attempt?.submittedAt?.toISOString() || ''
      const vio = p.attempt?.violations ?? 0
      rows.push([p.quiz.quizCode, p.name, p.email, p.mobile, String(score), String(total),
        String(p.attempt?.durationSeconds ?? 0), sAt, p.status, String(vio)]
        .map(v => `"${(v||'').replaceAll('"','""')}"`).join(','))
    }
    return new Response(rows.join('\n'), { headers: { 'Content-Type': 'text/csv' } })
  }

  return NextResponse.json({
    items: parts.map(p => ({
      quizCode: p.quiz.quizCode,
      name: p.name,
      email: p.email,
      score: p.attempt?.score ?? 0,
      total: p.quiz.questionCount,
      submittedAt: p.attempt?.submittedAt,
      durationSeconds: p.attempt?.durationSeconds ?? 0,
      violations: p.attempt?.violations ?? 0,
    }))
  })
}
