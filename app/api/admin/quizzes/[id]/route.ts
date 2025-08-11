import { prisma } from "@/src/lib/db"
import { NextResponse } from "next/server"
export async function PATCH(req: Request, { params }: { params: { id: string }}) {
  const body = await req.json()
  const quiz = await prisma.quiz.update({ where: { id: params.id }, data: body })
  return NextResponse.json({ ok: true, quiz })
}
export async function GET(_: Request, { params }: { params: { id: string }}) {
  const quiz = await prisma.quiz.findUnique({ where: { id: params.id }, include: { questionSet: true } })
  if (!quiz) return new NextResponse("Not found", { status: 404 })
  return NextResponse.json(quiz)
}
