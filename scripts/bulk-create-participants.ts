import 'dotenv/config'
import fs from 'node:fs'
import { parse } from 'csv-parse/sync'
import { prisma } from '@/src/lib/db'
async function main() {
  const file = process.argv[2]; if (!file) throw new Error('Usage: tsx scripts/bulk-create-participants.ts <csv-file>')
  const txt = fs.readFileSync(file, 'utf8'); const recs = parse(txt, { columns: true, skip_empty_lines: true })
  for (const r of recs) {
    const quiz = await prisma.quiz.findUnique({ where: { quizCode: r.quizCode } })
    if (!quiz) { console.warn('Missing quiz', r.quizCode); continue }
    await prisma.participant.upsert({ where: { quizId_email: { quizId: quiz.id, email: r.email } }, update: { name: r.name, mobile: r.mobile }, create: { quizId: quiz.id, name: r.name, email: r.email, mobile: r.mobile } })
    console.log('Upserted', r.email, 'for', quiz.quizCode)
  }
  console.log('Done.')
}
main().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1) })
