import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

async function requireAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user || user.role !== 'admin') return null
  return user
}

// GET — list all reviews with product info + sentiment
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const url = new URL(req.url)
  const filter = url.searchParams.get('filter') || 'all' // all | positive | negative | flagged
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)

  const where: any = {}
  if (filter === 'positive') where.rating = { gte: 4 }
  if (filter === 'negative') where.rating = { lte: 2 }

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        product: { select: { id: true, name: true, images: true } },
      },
    }),
    db.review.count({ where }),
  ])

  // Compute simple sentiment based on rating + keywords
  const NEGATIVE_KEYWORDS = ['bad', 'terrible', 'worst', 'broken', 'defective', 'refund', 'hate', 'awful', 'horrible', 'return']
  const FLAGGED_KEYWORDS = ['scam', 'fake', 'fraud', 'lawsuit', 'sue', 'lawyer'] // require manual review

  return NextResponse.json({
    total,
    reviews: reviews.map((r) => {
      const text = `${r.title} ${r.comment}`.toLowerCase()
      const hasNegative = NEGATIVE_KEYWORDS.some((k) => text.includes(k))
      const hasFlagged = FLAGGED_KEYWORDS.some((k) => text.includes(k))
      let sentiment: 'positive' | 'neutral' | 'negative' | 'flagged' = 'neutral'
      if (hasFlagged) sentiment = 'flagged'
      else if (r.rating >= 4 && !hasNegative) sentiment = 'positive'
      else if (r.rating <= 2 || hasNegative) sentiment = 'negative'

      return {
        id: r.id,
        productId: r.productId,
        productName: r.product.name,
        productImage: (() => { try { return JSON.parse(r.product.images || '[]')[0] || '' } catch { return '' } })(),
        author: r.author,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: r.images ? JSON.parse(r.images) : [],
        verified: r.verified,
        helpful: r.helpful,
        sentiment,
        createdAt: r.createdAt.toISOString(),
      }
    }).filter((r) => {
      if (filter === 'flagged') return r.sentiment === 'flagged'
      return true
    }),
  })
}

// POST — delete a review + recompute product aggregates
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || 'delete')

  if (action === 'delete') {
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const review = await db.review.findUnique({ where: { id }, select: { productId: true } })
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await db.review.delete({ where: { id } })
    // Recompute aggregates
    const agg = await db.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: { rating: true },
    })
    await db.product.update({
      where: { id: review.productId },
      data: {
        rating: Math.round((agg._avg.rating || 0) * 10) / 10,
        ratingCount: agg._count.rating,
      },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
