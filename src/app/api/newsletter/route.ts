import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  // Public — only returns count
  const count = await db.newsletter.count({ where: { active: true } })
  return NextResponse.json({ subscribers: count })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  const name = body.name ? String(body.name).trim() : null
  const source = String(body.source || 'footer')

  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 })
  }

  // Upsert — if email exists, mark active again
  try {
    const existing = await db.newsletter.findUnique({ where: { email } })
    if (existing) {
      if (!existing.active) {
        await db.newsletter.update({ where: { id: existing.id }, data: { active: true, name: name ?? existing.name } })
        return NextResponse.json({ ok: true, reactivated: true })
      }
      return NextResponse.json({ ok: true, alreadySubscribed: true })
    }
    await db.newsletter.create({ data: { email, name, source } })
    return NextResponse.json({ ok: true, subscribed: true })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ ok: true, alreadySubscribed: true })
    }
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}

// Unsubscribe
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
  await db.newsletter.updateMany({
    where: { email },
    data: { active: false },
  })
  return NextResponse.json({ ok: true })
}
