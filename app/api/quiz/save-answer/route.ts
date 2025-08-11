import { prisma } from "@/src/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { participantId, questionId, selected } = await req.json()
  if (!participantId || !questionId || !Array.isArray(selected)) return new NextResponse("Bad request", { status: 400 })
  const p = await prisma.participant.findUnique({ where: { id: participantId }, include: { attempt: true } })
  if (!p?.attempt) return new NextResponse("Attempt not found", { status: 404 })
  const prev = await prisma.answer.findFirst({ where: { attemptId: p.attempt.id, questionId } })
  if (prev) await prisma.answer.update({ where: { id: prev.id }, data: { selected } })
  else await prisma.answer.create({ data: { attemptId: p.attempt.id, questionId, selected, isCorrect: false } })
  return NextResponse.json({ ok: true })
}
