import { prisma } from "@/src/lib/db"

export async function gradeAttempt(attemptId: string) {
  const answers = await prisma.answer.findMany({ where: { attemptId }, include: { question: true } })
  let score = 0
  for (const a of answers) {
    const sel = (a.selected || []).slice().sort()
    const corr = (a.question.correctIndices || []).slice().sort()
    const isEq = sel.length === corr.length && sel.every((x,i)=>x===corr[i])
    if (isEq) score += 1
    if (a.isCorrect !== isEq) await prisma.answer.update({ where: { id: a.id }, data: { isCorrect: isEq } })
  }
  return score
}

export function genQuizCode(prefix='QUIZ') {
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${rnd}`
}
