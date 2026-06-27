import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// Conversion rate: 100 points = $1
export const POINTS_PER_DOLLAR = 100

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ points: 0, value: 0 })
  const u = await db.user.findUnique({
    where: { id: user.id },
    select: { loyaltyPoints: true },
  })
  const points = u?.loyaltyPoints ?? 0
  return NextResponse.json({
    points,
    value: +(points / POINTS_PER_DOLLAR).toFixed(2),
    rate: POINTS_PER_DOLLAR,
  })
}

// Redeem points — returns a one-time coupon code that the cart will accept
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || 'redeem')

  if (action === 'redeem') {
    const u = await db.user.findUnique({ where: { id: user.id }, select: { loyaltyPoints: true } })
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const points = u.loyaltyPoints
    if (points < POINTS_PER_DOLLAR) {
      return NextResponse.json({ error: `Need at least ${POINTS_PER_DOLLAR} points to redeem` }, { status: 400 })
    }
    const valueUsd = +(points / POINTS_PER_DOLLAR).toFixed(2)
    // Generate a one-time code (deterministic so the client cart store can apply it)
    const code = `LOYAL-${user.id.slice(-6).toUpperCase()}-${points}`
    return NextResponse.json({
      code,
      points,
      valueUsd,
      message: `Apply ${points} points for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(valueUsd)} off`,
    })
  }

  if (action === 'deduct') {
    // Called after a successful order with a LOYAL- code applied
    const points = Math.max(0, Math.floor(Number(body.points || 0)))
    if (points <= 0) return NextResponse.json({ ok: false })
    const u = await db.user.findUnique({ where: { id: user.id }, select: { loyaltyPoints: true } })
    if (!u || u.loyaltyPoints < points) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }
    await db.user.update({
      where: { id: user.id },
      data: { loyaltyPoints: { decrement: points } },
    })
    return NextResponse.json({ ok: true, remaining: u.loyaltyPoints - points })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
