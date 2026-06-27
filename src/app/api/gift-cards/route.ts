import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

function generateGiftCardCode(): string {
  // Format: ZSGC-XXXX-XXXX (12 chars)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1
  const part = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `ZSGC-${part(4)}-${part(4)}`
}

// GET — list user's gift cards or check a code
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  if (code) {
    // Check balance by code (public)
    const card = await db.giftCard.findUnique({
      where: { code: code.toUpperCase().trim() },
      select: { code: true, amount: true, balance: true, status: true, expiresAt: true },
    })
    if (!card) return NextResponse.json({ error: 'Gift card not found' }, { status: 404 })
    if (card.status !== 'active') return NextResponse.json({ error: `Card is ${card.status}` }, { status: 400 })
    if (card.expiresAt && card.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Card has expired' }, { status: 400 })
    }
    return NextResponse.json({ card })
  }

  // List user's purchased cards
  if (!user) return NextResponse.json({ cards: [] })
  const cards = await db.giftCard.findMany({
    where: { purchaserId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 5 } },
  })
  return NextResponse.json({
    cards: cards.map((c) => ({
      id: c.id,
      code: c.code,
      amount: c.amount,
      balance: c.balance,
      status: c.status,
      recipientEmail: c.recipientEmail,
      message: c.message,
      createdAt: c.createdAt.toISOString(),
      expiresAt: c.expiresAt?.toISOString() ?? null,
      transactions: c.transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        orderId: t.orderId,
        createdAt: t.createdAt.toISOString(),
      })),
    })),
  })
}

// POST — purchase a gift card, redeem, or check
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || 'purchase')

  // ---- PURCHASE ----
  if (action === 'purchase') {
    if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
    const amount = parseFloat(body.amount)
    const recipientEmail = body.recipientEmail ? String(body.recipientEmail).trim().toLowerCase() : null
    const message = body.message ? String(body.message).trim().slice(0, 300) : null

    const VALID_AMOUNTS = [25, 50, 100, 200, 500]
    if (!VALID_AMOUNTS.includes(amount)) {
      return NextResponse.json({ error: `Amount must be one of: ${VALID_AMOUNTS.join(', ')}` }, { status: 400 })
    }

    // Generate unique code
    let code = generateGiftCardCode()
    let attempts = 0
    while (await db.giftCard.findUnique({ where: { code } })) {
      code = generateGiftCardCode()
      if (++attempts > 10) break
    }

    const card = await db.giftCard.create({
      data: {
        code,
        amount,
        balance: amount,
        purchaserId: user.id,
        recipientEmail,
        message,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    })

    // Record funding transaction
    await db.giftCardTransaction.create({
      data: { giftCardId: card.id, userId: user.id, amount },
    })

    return NextResponse.json({
      card: {
        id: card.id,
        code: card.code,
        amount: card.amount,
        balance: card.balance,
        status: card.status,
        recipientEmail: card.recipientEmail,
        message: card.message,
        expiresAt: card.expiresAt?.toISOString(),
      },
    })
  }

  // ---- REDEEM (check balance for cart application) ----
  if (action === 'redeem') {
    const code = String(body.code || '').toUpperCase().trim()
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

    const card = await db.giftCard.findUnique({ where: { code } })
    if (!card) return NextResponse.json({ error: 'Invalid gift card code' }, { status: 404 })
    if (card.status !== 'active') return NextResponse.json({ error: `Card is ${card.status}` }, { status: 400 })
    if (card.expiresAt && card.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Card has expired' }, { status: 400 })
    }

    return NextResponse.json({
      card: {
        code: card.code,
        balance: card.balance,
        amount: card.amount,
      },
      message: `Gift card applied: $${card.balance.toFixed(2)} available`,
    })
  }

  // ---- DEDUCT (called after order placement) ----
  if (action === 'deduct') {
    if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
    const code = String(body.code || '').toUpperCase().trim()
    const amount = parseFloat(body.amount)
    const orderId = body.orderId ? String(body.orderId) : null

    if (!code || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const card = await db.giftCard.findUnique({ where: { code } })
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    if (card.status !== 'active' || card.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const newBalance = card.balance - amount
    await db.giftCard.update({
      where: { id: card.id },
      data: {
        balance: newBalance,
        status: newBalance <= 0 ? 'redeemed' : 'active',
        redeemedBy: user.id,
      },
    })
    await db.giftCardTransaction.create({
      data: {
        giftCardId: card.id,
        userId: user.id,
        amount: -amount,
        orderId,
      },
    })

    return NextResponse.json({ ok: true, remainingBalance: newBalance })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
