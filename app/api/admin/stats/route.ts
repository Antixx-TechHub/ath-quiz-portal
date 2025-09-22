import { NextResponse } from "next/server"
import { prisma } from "@/src/lib/db"

function parseRange(r?: string) {
  switch ((r || '').toLowerCase()) {
    case '24h': return { ms: 24 * 3600 * 1000, gran: 'hour' as const }
    case '30d': return { ms: 30 * 86400 * 1000, gran: 'day' as const }
    case '7d':
    default:    return { ms: 7 * 86400 * 1000,  gran: 'day' as const }
  }
}

async function getPassMark() {
  return 50;
  // try {
  //   const rows = await prisma.$queryRaw<{ value: string }[]>`
  //     SELECT value FROM "Config" WHERE key='PASS_MARK_PERCENT'`
  //   const n = parseInt(rows[0]?.value || '50', 10)
  //   return Number.isFinite(n) ? Math.max(1, Math.min(100, n)) : 50
  // } catch {
  //   return 50
  // }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const quizCode = (searchParams.get('quizCode') || '').trim()
  const range = parseRange(searchParams.get('range') || '7d')
  const since = new Date(Date.now() - range.ms)
  const passMark = await getPassMark()

  const quizzes = await prisma.quiz.findMany({
    select: {
      id: true, name: true, quizCode: true, questionCount: true,
      participants: {
        select: {
          status: true,
          attempt: { select: { submittedAt: true, score: true, violations: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const items = quizzes.map(q => {
    const total = q.participants.length
    const attempted = q.participants.filter(p => p.status !== "CREATED").length
    const submitted = q.participants.filter(p => p.status === "SUBMITTED").length
    const pass = q.participants.filter(p =>
      p.attempt?.submittedAt && (p.attempt.score >= Math.ceil((passMark/100) * q.questionCount))
    ).length
    const fail = Math.max(0, submitted - pass)
    const violations = q.participants.reduce((acc, p) => acc + (p.attempt?.violations ?? 0), 0)
    return { quizId: q.id, quizCode: q.quizCode, name: q.name, total, attempted, submitted, pass, fail, violations }
  })

  const quizFilter = quizCode ? { quiz: { quizCode } as any } : {}
  const participants = await prisma.participant.findMany({
    where: quizFilter,
    select: { status: true, attempt: { select: { violations: true } } }
  })
  const totalsAttempted = participants.filter(p => p.status !== 'CREATED').length
  const totalsSubmitted = participants.filter(p => p.status === 'SUBMITTED').length
  const totalsViolations = participants.reduce((a, p) => a + (p.attempt?.violations ?? 0), 0)

  type Row = { bucket: Date, count: number }
  let timeline: Row[] = []
  if (quizCode) {
    timeline = await prisma.$queryRaw<Row[]>`
      SELECT date_trunc(${range.gran}, a."submittedAt") AS bucket, count(*)::int
      FROM "Attempt" a
      JOIN "Participant" p ON p.id = a."participantId"
      JOIN "Quiz" q ON q.id = p."quizId"
      WHERE a."submittedAt" IS NOT NULL
        AND a."submittedAt" >= ${since}
        AND q."quizCode" = ${quizCode}
      GROUP BY 1
      ORDER BY 1
    `
  } else {
    timeline = await prisma.$queryRaw<Row[]>`
      SELECT date_trunc(${range.gran}, a."submittedAt") AS bucket, count(*)::int
      FROM "Attempt" a
      WHERE a."submittedAt" IS NOT NULL
        AND a."submittedAt" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `
  }

  return NextResponse.json({
    passMarkPercent: passMark,
    items,
    totals: { attempted: totalsAttempted, submitted: totalsSubmitted, violations: totalsViolations },
    timeline: timeline.map(r => ({ t: r.bucket, count: Number(r.count) })),
    granularity: range.gran
  })
}
