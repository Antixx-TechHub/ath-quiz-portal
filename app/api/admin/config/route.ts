import { NextResponse } from "next/server"
import { prisma } from "@/src/lib/db"

async function ensureTable() {
  // safe/idempotent
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Config" (
      key text PRIMARY KEY,
      value text NOT NULL,
      "updatedAt" timestamptz NOT NULL DEFAULT now()
    );
  `)
}

export async function GET() {
  await ensureTable()
  const rows = await prisma.$queryRaw<{ value: string }[]>`
    SELECT value FROM "Config" WHERE key = 'PASS_MARK_PERCENT'`
  const val = rows[0]?.value ?? '50'
  const n = Math.max(1, Math.min(100, parseInt(val || '50', 10) || 50))
  return NextResponse.json({ passMarkPercent: n })
}

export async function POST(req: Request) {
  await ensureTable()
  const body = await req.json().catch(() => ({}))
  const n = Math.max(1, Math.min(100, parseInt(String(body?.passMarkPercent || ''), 10) || 50))
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Config"(key,value)
    VALUES ('PASS_MARK_PERCENT', $1)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = now();
  `, String(n))
  return NextResponse.json({ ok: true, passMarkPercent: n })
}
