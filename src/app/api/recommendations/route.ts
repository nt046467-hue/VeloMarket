import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseImages(s: string | null): string[] {
  if (!s) return []
  try { return JSON.parse(s) } catch { return [] }
}

/**
 * GET /api/recommendations?productId=X
 * Returns "Customers also bought" recommendations based on real order co-purchase data.
 * Falls back to "popular in same category" if no co-purchase data exists.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const productId = url.searchParams.get('productId')
  if (!productId) return NextResponse.json({ products: [] })

  // 1) Find orders that contain this product, then get OTHER products from those orders
  // This is the classic "customers who bought this also bought" query
  const ordersWithProduct = await db.orderItem.findMany({
    where: { productId },
    select: { orderId: true },
  })
  const orderIds = ordersWithProduct.map((o) => o.orderId)

  if (orderIds.length > 0) {
    const coPurchased = await db.orderItem.groupBy({
      by: ['productId'],
      where: {
        orderId: { in: orderIds },
        productId: { not: productId },
      },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 6,
    })

    if (coPurchased.length > 0) {
      const ids = coPurchased.map((c) => c.productId)
      const products = await db.product.findMany({
        where: { id: { in: ids }, isActive: true },
        include: { category: true },
      })
      // Sort by co-purchase count
      const sorted = coPurchased
        .map((c) => products.find((p) => p.id === c.productId))
        .filter(Boolean)
        .slice(0, 5) as any[]

      if (sorted.length > 0) {
        return NextResponse.json({
          products: sorted.map(serialize),
          source: 'co-purchase',
        })
      }
    }
  }

  // 2) Fallback: top products in the same category
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { categoryId: true },
  })
  if (!product) return NextResponse.json({ products: [] })

  const related = await db.product.findMany({
    where: { categoryId: product.categoryId, id: { not: productId }, isActive: true },
    orderBy: { ratingCount: 'desc' },
    take: 5,
    include: { category: true },
  })

  return NextResponse.json({
    products: related.map(serialize),
    source: 'category',
  })
}

function serialize(p: any) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    brand: p.brand,
    price: p.price,
    compareAt: p.compareAt,
    currency: p.currency,
    images: parseImages(p.images),
    rating: p.rating,
    ratingCount: p.ratingCount,
    stock: p.stock,
    isFeatured: p.isFeatured,
    tags: p.tags ? JSON.parse(p.tags) : [],
    specs: p.specs ? JSON.parse(p.specs) : null,
    variants: p.variants ? JSON.parse(p.variants) : null,
    categoryId: p.categoryId,
    category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
  }
}
