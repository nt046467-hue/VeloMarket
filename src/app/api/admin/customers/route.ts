import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

async function requireAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const url = new URL(req.url)
  const search = url.searchParams.get('q')?.trim() || ''
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 200)

  const where: any = {}
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
    ]
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        loyaltyPoints: true,
        banned: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            wishlist: true,
          },
        },
      },
    }),
    db.user.count({ where }),
  ])

  // Aggregate order totals per user (separate query for efficiency)
  const userIds = users.map((u) => u.id)
  const orderStats = await db.order.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds }, status: { not: 'cancelled' } },
    _sum: { grandTotal: true },
  })
  const orderMap = new Map(orderStats.map((o) => [o.userId, o._sum.grandTotal ?? 0]))

  return NextResponse.json({
    total,
    customers: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      loyaltyPoints: u.loyaltyPoints,
      banned: u.banned,
      createdAt: u.createdAt.toISOString(),
      orderCount: u._count.orders,
      reviewCount: u._count.reviews,
      wishlistCount: u._count.wishlist,
      totalSpent: orderMap.get(u.id) ?? 0,
    })),
  })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || 'toggleBan')
  const userId = String(body.userId || '')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const target = await db.user.findUnique({ where: { id: userId } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Prevent self-ban and other-admin-ban
  const requester = await getUserFromRequest(req)
  if (target.id === requester!.id) {
    return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })
  }
  if (target.role === 'admin' && action === 'toggleBan') {
    return NextResponse.json({ error: 'Cannot ban admin accounts' }, { status: 400 })
  }

  if (action === 'toggleBan') {
    const updated = await db.user.update({
      where: { id: userId },
      data: { banned: !target.banned },
    })
    return NextResponse.json({ ok: true, banned: updated.banned })
  }

  if (action === 'setRole') {
    const newRole = String(body.role || 'customer')
    if (!['customer', 'admin'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    const updated = await db.user.update({
      where: { id: userId },
      data: { role: newRole },
    })
    return NextResponse.json({ ok: true, role: updated.role })
  }

  if (action === 'adjustPoints') {
    const delta = parseInt(body.delta || 0)
    if (isNaN(delta)) return NextResponse.json({ error: 'Invalid delta' }, { status: 400 })
    const updated = await db.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { increment: delta } },
    })
    return NextResponse.json({ ok: true, points: updated.loyaltyPoints })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
