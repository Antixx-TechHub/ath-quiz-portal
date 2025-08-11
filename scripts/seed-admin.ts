import 'dotenv/config'
import { prisma } from '@/src/lib/db'
import bcrypt from 'bcryptjs'
async function main() {
  const email = process.env.ADMIN_SEED_EMAIL!
  const pw = process.env.ADMIN_SEED_PASSWORD!
  if (!email || !pw) throw new Error('ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD missing')
  const hash = bcrypt.hashSync(pw, 10)
  const up = await prisma.user.upsert({ where: { email }, update: { passwordHash: hash }, create: { email, passwordHash: hash, role: 'ADMIN' } })
  console.log('Admin ready:', up.email)
}
main().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1) })
