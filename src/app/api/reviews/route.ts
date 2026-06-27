import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

function parseImages(s: string | null): string[] {
  if (!s) return []
  try {
    const arr = JSON.parse(s)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const productId = url.searchParams.get('productId')
  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }
  const reviews = await db.review.findMany({
    where: { productId },
    orderBy: [{ helpful: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      images: parseImages(r.images),
      verified: r.verified,
      helpful: r.helpful,
      createdAt: r.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to leave a review' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || 'create')
  const productId = String(body.productId || '')

  // ---- Helpful vote ----
  if (action === 'helpful') {
    const reviewId = String(body.reviewId || '')
    if (!reviewId) return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
    const r = await db.review.findUnique({ where: { id: reviewId } })
    if (!r) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    const updated = await db.review.update({
      where: { id: reviewId },
      data: { helpful: { increment: 1 } },
    })
    return NextResponse.json({ helpful: updated.helpful })
  }

  // ---- Create review ----
  const rating = Math.round(Number(body.rating || 0))
  const title = String(body.title || '').trim().slice(0, 120)
  const comment = String(body.comment || '').trim().slice(0, 2000)
  const images: string[] = Array.isArray(body.images)
    ? body.images.filter((u: any) => typeof u === 'string' && u.trim().length > 0).slice(0, 5)
    : []

  if (!productId || rating < 1 || rating > 5 || !title || !comment) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }
  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Prevent duplicate reviews from the same user
  const existing = await db.review.findFirst({
    where: { productId, userId: user.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 })
  }

  const review = await db.review.create({
    data: {
      productId,
      userId: user.id,
      author: user.name,
      rating,
      title,
      comment,
      images: images.length > 0 ? JSON.stringify(images) : null,
      verified: true,
    },
  })

  // Update aggregate rating & count on the product
  const agg = await db.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  })
  await db.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((agg._avg.rating || 0) * 10) / 10,
      ratingCount: agg._count.rating,
    },
  })

  return NextResponse.json({
    review: {
      id: review.id,
      author: review.author,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: parseImages(review.images),
      verified: review.verified,
      helpful: review.helpful,
      createdAt: review.createdAt.toISOString(),
    },
  })
}
