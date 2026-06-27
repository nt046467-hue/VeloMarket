import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseImages(s: string | null): string[] {
  if (!s) return []
  try { return JSON.parse(s) } catch { return [] }
}
function parseTags(s: string | null): string[] {
  if (!s) return []
  try { return JSON.parse(s) } catch { return [] }
}
function parseSpecs(s: string | null): Record<string, string> | null {
  if (!s) return null
  try { return JSON.parse(s) } catch { return null }
}
function parseVariants(s: string | null): { colors?: any[]; sizes?: any[] } | null {
  if (!s) return null
  try { return JSON.parse(s) } catch { return null }
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
    tags: parseTags(p.tags),
    specs: parseSpecs(p.specs),
    variants: parseVariants(p.variants),
    categoryId: p.categoryId,
    category: p.category ? {
      id: p.category.id,
      name: p.category.name,
      slug: p.category.slug,
      icon: p.category.icon,
      description: p.category.description,
    } : undefined,
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim() || ''
  const category = url.searchParams.get('category')
  const slug = url.searchParams.get('slug')
  const brand = url.searchParams.getAll('brand')
  const sort = url.searchParams.get('sort') || 'relevance'
  const minPrice = parseFloat(url.searchParams.get('minPrice') || '0')
  const maxPrice = parseFloat(url.searchParams.get('maxPrice') || '10000')
  const onlyDeals = url.searchParams.get('onlyDeals') === 'true'
  const onlyFeatured = url.searchParams.get('featured') === 'true'
  const minRating = parseFloat(url.searchParams.get('minRating') || '0')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)

  if (slug || url.searchParams.get('id')) {
    const id = url.searchParams.get('id')
    const product = await db.product.findFirst({
      where: id ? { id } : { slug: slug! },
      include: { category: true },
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    const reviews = await db.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({
      product: serialize(product),
      reviews: reviews.map((r) => ({
        id: r.id,
        author: r.author,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        verified: r.verified,
        createdAt: r.createdAt.toISOString(),
      })),
    })
  }

  const where: any = { isActive: true }
  if (category && category !== 'all') {
    where.category = { slug: category }
  }
  if (brand.length) where.brand = { in: brand }
  if (onlyFeatured) where.isFeatured = true
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { brand: { contains: q } },
      { tags: { contains: q } },
    ]
  }
  if (minPrice > 0 || maxPrice < 10000) {
    where.price = {}
    if (minPrice > 0) where.price.gte = minPrice
    if (maxPrice < 10000) where.price.lte = maxPrice
  }

  let orderBy: any = { createdAt: 'desc' }
  switch (sort) {
    case 'price_asc': orderBy = { price: 'asc' }; break
    case 'price_desc': orderBy = { price: 'desc' }; break
    case 'rating': orderBy = { rating: 'desc' }; break
    case 'popular': orderBy = { ratingCount: 'desc' }; break
    case 'newest': orderBy = { createdAt: 'desc' }; break
    default: orderBy = [{ isFeatured: 'desc' }, { ratingCount: 'desc' }]
  }

  const products = await db.product.findMany({
    where,
    orderBy,
    take: limit,
    skip: offset,
    include: { category: true },
  })

  const totalCount = await db.product.count({ where })
  let filtered = products.map(serialize)
  if (minRating > 0) {
    filtered = filtered.filter((p) => p.rating >= minRating)
  }
  if (onlyDeals) {
    filtered = filtered.filter((p) => p.compareAt && p.compareAt > p.price)
  }

  const allBrands = await db.product.findMany({
    where: category && category !== 'all' ? { category: { slug: category } } : {},
    select: { brand: true },
    distinct: ['brand'],
  })

  return NextResponse.json({
    products: filtered,
    total: totalCount,
    brands: allBrands.map((b) => b.brand).sort(),
  })
}
