export const runtime = 'nodejs'


import { prisma } from "@/src/lib/db"
import { NextResponse } from "next/server"
import { parse } from "csv-parse/sync"

export async function POST(req: Request, { params }: { params: { id: string }}) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return new NextResponse("No file", { status: 400 })
  const buf = Buffer.from(await file.arrayBuffer())
  let items: { text:string, options:string[], type:'SC'|'MC', correctIndices:number[] }[] = []
  const text = buf.toString('utf8').trim()
  try {
    if (text.startsWith('[')) { items = JSON.parse(text) }
    else {
      const recs = parse(text, { columns: true, skip_empty_lines: true })
      for (const r of recs) {
        const opts = [r.optionA, r.optionB, r.optionC, r.optionD].map((x:string)=>String(x||''))
        const type = (String(r.type||'SC').toUpperCase() === 'MC') ? 'MC' : 'SC'
        const corr = String(r.correct||'').split(';').map((s:string)=>s.trim()).filter(Boolean)
        const idxs = corr.map((c:string)=>({A:0,B:1,C:2,D:3} as any)[c.toUpperCase()] ?? 0)
        items.push({ text: r.question, options: opts, type, correctIndices: idxs })
      }
    }
  } catch (e:any) { return new NextResponse("Parse error: "+e.message, { status: 400 }) }

  await prisma.question.deleteMany({ where: { questionSetId: params.id } })
  let order = 1
  for (const it of items) {
    await prisma.question.create({ data: { questionSetId: params.id, text: it.text, options: it.options.slice(0,4), type: it.type, correctIndices: it.correctIndices, order: order++ } })
  }
  return NextResponse.json({ created: items.length })
}
