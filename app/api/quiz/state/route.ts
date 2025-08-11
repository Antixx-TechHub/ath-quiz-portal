import { prisma } from "@/src/lib/db"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const participantId = searchParams.get('participantId')
  if (!participantId) return new NextResponse("Missing participantId", { status: 400 })

  const p = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      quiz: { include: { questionSet: { include: { questions: { orderBy: { order: 'asc' } } } } } },
      attempt: { include: { answers: true } }
    }
  })
  if (!p) return new NextResponse("Not found", { status: 404 })

  // Lock out if submitted
  const locked = !!p.attempt?.submittedAt || p.status === 'SUBMITTED'
  if (locked) {
    return NextResponse.json({ locked: true, remaining: 0, questions: [], answers: {} })
  }

  const startedAt = p.attempt?.startedAt ?? new Date()
  const elapsed = Math.floor((Date.now() - startedAt.getTime())/1000)
  const remaining = Math.max(0, p.quiz.timeLimitSeconds - elapsed)

  const answers: Record<string, number[]> = {}
  p.attempt?.answers.forEach(a => answers[a.questionId] = a.selected as unknown as number[])

  const qs = p.quiz.questionSet.questions.slice(0, p.quiz.questionCount).map(q => ({
    id: q.id, text: q.text, options: q.options, type: q.type
  }))

  return NextResponse.json({ locked: false, remaining, questions: qs, answers })
}
