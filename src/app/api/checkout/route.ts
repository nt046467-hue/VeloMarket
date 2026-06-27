import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { generateOrderNumber, isValidCardNumber, isValidExpiry, isValidCVV, getCardBrand } from '@/lib/format'

type CartPayload = {
  productId: string
  name: string
  image: string
  brand: string
  unitPrice: number
  quantity: number
}[]

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to checkout' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const items: CartPayload = Array.isArray(body.items) ? body.items : []
  const shippingAddress = body.shippingAddress
  const payment = body.payment
  const promoCode = String(body.promoCode || '').trim().toUpperCase()

  if (!items.length) {
    return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
  }
  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.line1 || !shippingAddress.city) {
    return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 })
  }
  if (!payment || !payment.cardNumber || !payment.expiry || !payment.cvv) {
    return NextResponse.json({ error: 'Payment information required' }, { status: 400 })
  }
  if (!isValidCardNumber(payment.cardNumber)) {
    return NextResponse.json({ error: 'Invalid card number' }, { status: 400 })
  }
  if (!isValidExpiry(payment.expiry)) {
    return NextResponse.json({ error: 'Card has expired or invalid expiry' }, { status: 400 })
  }
  if (!isValidCVV(payment.cvv)) {
    return NextResponse.json({ error: 'Invalid CVV' }, { status: 400 })
  }

  // Verify products exist & capture current prices (server-authoritative)
  const ids = items.map((i) => i.productId)
  const products = await db.product.findMany({ where: { id: { in: ids } } })
  const productMap = new Map(products.map((p) => [p.id, p]))

  let itemsTotal = 0
  const orderItems = items.map((i) => {
    const product = productMap.get(i.productId)
    if (!product) throw new Error(`Product ${i.productId} not found`)
    const unitPrice = product.price // use server price
    const quantity = Math.max(1, Math.min(i.quantity, product.stock || 99))
    const lineTotal = unitPrice * quantity
    itemsTotal += lineTotal
    return {
      productId: product.id,
      name: product.name,
      image: JSON.parse(product.images || '[]')[0] || '',
      brand: product.brand,
      unitPrice,
      quantity,
      lineTotal,
    }
  })

  // Mock promo codes
  const promos: Record<string, number> = {
    SAVE10: 0.1,
    WELCOME15: 0.15,
    FESTIVE20: 0.2,
  }
  const discountRate = promos[promoCode] || 0
  const discountTotal = itemsTotal * discountRate
  const afterDiscount = itemsTotal - discountTotal
  const shippingTotal = afterDiscount > 99 ? 0 : 9.99
  const taxTotal = +(afterDiscount * 0.08).toFixed(2)
  const grandTotal = +(afterDiscount + shippingTotal + taxTotal).toFixed(2)

  // Simulate payment processing
  await new Promise((r) => setTimeout(r, 900))
  const txnId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  const order = await db.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: user.id,
      status: 'paid',
      itemsTotal: +itemsTotal.toFixed(2),
      shippingTotal,
      taxTotal,
      discountTotal: +discountTotal.toFixed(2),
      grandTotal,
      currency: 'USD',
      shippingAddress: JSON.stringify(shippingAddress),
      paymentMethod: `${getCardBrand(payment.cardNumber)} •••• ${String(payment.cardNumber).slice(-4)}`,
      paymentStatus: 'paid',
      paymentTxnId: txnId,
      items: { create: orderItems },
    },
    include: { items: true },
  })

  // Decrement stock (product-level + variant-level if applicable)
  for (const item of orderItems) {
    const incomingItem = items.find((i) => i.productId === item.productId)
    const variantSel = (incomingItem as any)?.variantSelection as
      | { color?: { name: string }; size?: { name: string } }
      | undefined

    if (variantSel && (variantSel.color || variantSel.size)) {
      // Decrement variant-level stock too
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { variants: true },
      })
      if (product?.variants) {
        try {
          const variants = JSON.parse(product.variants) as {
            colors?: Array<{ name: string; stock: number }>
            sizes?: Array<{ name: string; stock: number }>
          }
          let mutated = false
          if (variantSel.color && variants.colors) {
            const c = variants.colors.find((cc) => cc.name === variantSel.color!.name)
            if (c) { c.stock = Math.max(0, c.stock - item.quantity); mutated = true }
          }
          if (variantSel.size && variants.sizes) {
            const s = variants.sizes.find((ss) => ss.name === variantSel.size!.name)
            if (s) { s.stock = Math.max(0, s.stock - item.quantity); mutated = true }
          }
          if (mutated) {
            await db.product.update({
              where: { id: item.productId },
              data: { variants: JSON.stringify(variants) },
            })
          }
        } catch { /* ignore JSON parse errors */ }
      }
    }

    await db.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
  }

  // Award loyalty points (1 point per $1 spent, rounded down)
  const pointsEarned = Math.floor(grandTotal)
  if (pointsEarned > 0) {
    await db.user.update({
      where: { id: user.id },
      data: { loyaltyPoints: { increment: pointsEarned } },
    })
  }

  // Deduct loyalty points if a LOYAL- code was used
  if (promoCode && promoCode.startsWith('LOYAL-')) {
    // Parse the points used from the code: LOYAL-XXXXXX-N
    const parts = promoCode.split('-')
    const pointsUsed = parseInt(parts[parts.length - 1] || '0')
    if (pointsUsed > 0) {
      const u = await db.user.findUnique({ where: { id: user.id }, select: { loyaltyPoints: true } })
      if (u && u.loyaltyPoints >= pointsUsed) {
        await db.user.update({
          where: { id: user.id },
          data: { loyaltyPoints: { decrement: pointsUsed } },
        })
      }
    }
  }

  // Deduct gift card balance if a ZSGC- code was used
  if (promoCode && promoCode.startsWith('ZSGC-')) {
    const card = await db.giftCard.findUnique({ where: { code: promoCode } })
    if (card && card.status === 'active' && card.balance > 0) {
      const deductAmount = Math.min(card.balance, grandTotal)
      const newBalance = card.balance - deductAmount
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
          amount: -deductAmount,
          orderId: order.id,
        },
      })
    }
  }

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      itemsTotal: order.itemsTotal,
      shippingTotal: order.shippingTotal,
      taxTotal: order.taxTotal,
      discountTotal: order.discountTotal,
      grandTotal: order.grandTotal,
      currency: order.currency,
      shippingAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentTxnId: order.paymentTxnId,
      createdAt: order.createdAt.toISOString(),
      pointsEarned,
      items: order.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        name: it.name,
        image: it.image,
        brand: it.brand,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
      })),
    },
  })
}
