import { prisma } from "@/src/lib/db"
import { NextResponse } from "next/server"
export async function GET(_: Request, { params }: { params: { id:string }}) {
  const items = await prisma.participant.findMany({ where: { quizId: params.id }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items })
}
