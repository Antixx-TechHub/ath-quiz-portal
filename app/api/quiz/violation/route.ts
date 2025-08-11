import { prisma } from "@/src/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { participantId, kind } = await req.json() as { participantId?: string, kind?: string }
  if (!participantId) return new NextResponse("Missing participantId", { status: 400 })

  const p = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { attempt: true }
  })
  if (!p?.attempt) return new NextResponse("Attempt not found", { status: 404 })

  const updated = await prisma.attempt.update({
    where: { id: p.attempt.id },
    data: { violations: { increment: 1 } }
  })

  // Optional: you could persist an audit log per violation type if you want later
  return NextResponse.json({ violations: updated.violations })
}
