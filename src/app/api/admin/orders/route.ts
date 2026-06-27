import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

async function requireAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user || user.role !== 'admin') return null
  return user
}

// GET — list all orders for admin
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)

  const where: any = {}
  if (status && status !== 'all') where.status = status

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
      },
    }),
    db.order.count({ where }),
  ])

  return NextResponse.json({
    total,
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      userId: o.userId,
      userName: o.user?.name,
      userEmail: o.user?.email,
      status: o.status,
      itemsTotal: o.itemsTotal,
      shippingTotal: o.shippingTotal,
      taxTotal: o.taxTotal,
      discountTotal: o.discountTotal,
      grandTotal: o.grandTotal,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      createdAt: o.createdAt.toISOString(),
    })),
  })
}

// POST — update order status
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const action = String(body.action || 'updateStatus')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const order = await db.order.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (action === 'updateStatus') {
    const newStatus = String(body.status || '')
    const valid = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
    if (!valid.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const updated = await db.order.update({ where: { id }, data: { status: newStatus } })
    return NextResponse.json({ ok: true, status: updated.status })
  }

  if (action === 'refund') {
    const updated = await db.order.update({
      where: { id },
      data: { paymentStatus: 'refunded' },
    })
    return NextResponse.json({ ok: true, paymentStatus: updated.paymentStatus })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
