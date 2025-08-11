import { prisma } from "@/src/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { quizCode, name, email, mobile } = await req.json()
  if (!quizCode || !name || !email || !mobile) return new NextResponse("All fields required", { status: 400 })

  const quiz = await prisma.quiz.findUnique({
    where: { quizCode },
    include: { questionSet: { include: { questions: true } } }
  })
  if (!quiz || !quiz.isActive) return new NextResponse("Quiz not found or inactive", { status: 404 })

  // Find/create participant for (quiz,email)
  let p = await prisma.participant.findUnique({ where: { quizId_email: { quizId: quiz.id, email } } })
  if (!p) p = await prisma.participant.create({ data: { quizId: quiz.id, name, email, mobile, status: 'CREATED' } })

  // Hard stop if already submitted
  const existingAttempt = await prisma.attempt.findUnique({ where: { participantId: p.id } })
  if (existingAttempt?.submittedAt || p.status === 'SUBMITTED') {
    return new Response("You already submitted this quiz.", { status: 409 })
  }

  // Create attempt if missing
  if (!existingAttempt) {
    await prisma.attempt.create({ data: { participantId: p.id } })
    await prisma.participant.update({ where: { id: p.id }, data: { status: 'STARTED' } })
  }

  return NextResponse.json({ participantId: p.id })
}
