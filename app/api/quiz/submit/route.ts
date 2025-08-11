import { prisma } from "@/src/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { participantId } = await req.json() as { participantId?: string }
  if (!participantId) return new NextResponse("Missing participantId", { status: 400 })

  const p = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      quiz: { include: { questionSet: { include: { questions: true } } } },
      attempt: { include: { answers: true } }
    }
  })
  if (!p) return new NextResponse("Not found", { status: 404 })

  // Idempotency: if already submitted, just say OK
  if (p.attempt?.submittedAt || p.status === 'SUBMITTED') {
    return NextResponse.json({ ok: true })
  }

  const attempt = p.attempt
  if (!attempt) return new NextResponse("Attempt missing", { status: 409 })

  // Score
  const qById = new Map(p.quiz.questionSet.questions.map(q => [q.id, q]))
  let score = 0
  for (const ans of attempt.answers) {
    const q = qById.get(ans.questionId)
    if (!q) continue
    const correct = (q.correctIndices || []).slice().sort((a,b)=>a-b).join(',')
    const picked  = (ans.selected || []).slice().sort((a,b)=>a-b).join(',')
    if (correct === picked) score++
  }

  // Timestamps & duration
  const now = new Date()
  const startedAt = attempt.startedAt ?? now
  const durationSeconds =
    Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000))

  await prisma.$transaction([
    prisma.attempt.update({
      where: { id: attempt.id },
      data: { submittedAt: now, score, durationSeconds }
    }),
    prisma.participant.update({
      where: { id: p.id },
      data: { status: 'SUBMITTED' }
    })
  ])

  return NextResponse.json({ ok: true, score, durationSeconds })
}
