import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Aggregate stats
  const [
    totalProducts,
    activeProducts,
    lowStockProducts,
    totalOrders,
    pendingOrders,
    paidOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalUsers,
    revenueResult,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { isActive: true } }),
    db.product.count({ where: { stock: { lte: 10 } } }),
    db.order.count(),
    db.order.count({ where: { status: 'pending' } }),
    db.order.count({ where: { status: 'paid' } }),
    db.order.count({ where: { status: 'shipped' } }),
    db.order.count({ where: { status: 'delivered' } }),
    db.order.count({ where: { status: 'cancelled' } }),
    db.user.count(),
    db.order.aggregate({ _sum: { grandTotal: true }, where: { status: { not: 'cancelled' } } }),
    db.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true } }, items: true },
    }),
    db.orderItem.groupBy({
      by: ['productId', 'name', 'image', 'brand'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ])

  return NextResponse.json({
    totals: {
      products: totalProducts,
      activeProducts,
      lowStockProducts,
      orders: totalOrders,
      users: totalUsers,
      revenue: revenueResult._sum.grandTotal ?? 0,
    },
    ordersByStatus: {
      pending: pendingOrders,
      paid: paidOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      grandTotal: o.grandTotal,
      userName: o.user?.name ?? 'Unknown',
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      createdAt: o.createdAt.toISOString(),
    })),
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      name: p.name,
      image: p.image,
      brand: p.brand,
      totalSold: p._sum.quantity,
    })),
  })
}
