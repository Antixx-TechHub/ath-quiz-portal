import { prisma } from "@/src/lib/db"
import { NextResponse } from "next/server"
import { genQuizCode } from "@/src/lib/api-helpers"

export async function GET() {
  const items = await prisma.quiz.findMany({ include: { questionSet: true }, orderBy: { createdAt: 'desc' } })
  const sets = await prisma.questionSet.findMany({ select: { id:true, name:true } })
  return NextResponse.json({ items, sets })
}

export async function POST(req: Request) {
  const { name, questionSetId } = await req.json()
  if (!name || !questionSetId) return new NextResponse("Missing fields", { status: 400 })
  const admin = await prisma.user.findFirst()
  if (!admin) return new NextResponse("No admin", { status: 400 })
  const quiz = await prisma.quiz.create({ data: { name, questionSetId, createdById: admin.id, quizCode: genQuizCode() } })
  return NextResponse.json({ id: quiz.id, quizCode: quiz.quizCode })
}
