import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ items: [] })

  const wishlist = await db.wishlist.findMany({
    where: { userId: user.id },
    include: {
      product: { include: { category: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    items: wishlist.map((w) => ({
      id: w.id,
      productId: w.productId,
      addedAt: w.createdAt.toISOString(),
      product: {
        id: w.product.id,
        name: w.product.name,
        slug: w.product.slug,
        brand: w.product.brand,
        price: w.product.price,
        compareAt: w.product.compareAt,
        currency: w.product.currency,
        images: JSON.parse(w.product.images || '[]'),
        rating: w.product.rating,
        ratingCount: w.product.ratingCount,
        stock: w.product.stock,
      },
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to use wishlist' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const productId = String(body.productId || '')
  const action = body.action === 'remove' ? 'remove' : 'add'

  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

  if (action === 'remove') {
    await db.wishlist.deleteMany({ where: { userId: user.id, productId } })
    return NextResponse.json({ ok: true, action: 'removed', productId })
  }

  // Try to create — handle unique constraint as "already exists"
  try {
    await db.wishlist.create({ data: { userId: user.id, productId } })
  } catch (e: any) {
    if (e?.code !== 'P2002') throw e
  }
  return NextResponse.json({ ok: true, action: 'added', productId })
}
