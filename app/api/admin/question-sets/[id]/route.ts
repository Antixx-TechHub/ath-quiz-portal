import { prisma } from "@/src/lib/db"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: { id: string }}) {
  const body = await req.json()
  const item = await prisma.questionSet.update({ where: { id: params.id }, data: body })
  return NextResponse.json({ ok: true, item })
}

export async function GET(_: Request, { params }: { params: { id: string }}) {
  const item = await prisma.questionSet.findUnique({ where: { id: params.id }, include: { questions: true } })
  if (!item) return new NextResponse("Not found", { status: 404 })
  return NextResponse.json(item)
}
