import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ orders: [] })

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  })

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      itemsTotal: o.itemsTotal,
      shippingTotal: o.shippingTotal,
      taxTotal: o.taxTotal,
      discountTotal: o.discountTotal,
      grandTotal: o.grandTotal,
      currency: o.currency,
      shippingAddress: JSON.parse(o.shippingAddress),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        name: it.name,
        image: it.image,
        brand: it.brand,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
      })),
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to view orders' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const orderId = String(body.orderId || '')
  const action = String(body.action || '')
  if (action === 'cancel') {
    const order = await db.order.findFirst({
      where: { id: orderId, userId: user.id },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot cancel this order' }, { status: 400 })
    }
    const updated = await db.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    })
    return NextResponse.json({ order: { id: updated.id, status: updated.status } })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
