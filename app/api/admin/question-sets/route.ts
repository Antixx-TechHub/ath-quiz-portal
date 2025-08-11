import { prisma } from "@/src/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const items = await prisma.questionSet.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const { name } = await req.json()
  if (!name) return new NextResponse("Missing name", { status: 400 })
  const admin = await prisma.user.findFirst()
  if (!admin) return new NextResponse("No admin user", { status: 400 })
  const item = await prisma.questionSet.create({ data: { name, createdById: admin.id }})
  return NextResponse.json({ id: item.id })
}
