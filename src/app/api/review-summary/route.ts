import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 15

// In-memory cache (per product, 10 min TTL)
const cache = new Map<string, { summary: unknown; expires: number }>()
const CACHE_TTL = 10 * 60 * 1000

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const productId = url.searchParams.get('productId')
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

  // Check cache
  const cached = cache.get(productId)
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ summary: cached.summary, cached: true })
  }

  // Fetch reviews
  const reviews = await db.review.findMany({
    where: { productId },
    take: 30,
    orderBy: [{ helpful: 'desc' }, { createdAt: 'desc' }],
  })

  if (reviews.length === 0) {
    return NextResponse.json({ summary: null })
  }

  // Fetch product for context
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { name: true, brand: true },
  })

  // Build a compact review digest for the LLM
  const reviewDigest = reviews.map((r) => ({
    r: r.rating,
    t: r.title,
    c: r.comment.slice(0, 200),
  }))

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  const prompt = `Analyze these customer reviews for "${product?.name}" by ${product?.brand}. Average rating: ${avgRating.toFixed(1)}/5 from ${reviews.length} reviews.

Reviews (JSON):
${JSON.stringify(reviewDigest)}

Generate a concise review summary in this exact JSON format (no markdown, no explanation):
{
  "verdict": "one sentence overall verdict (max 15 words)",
  "pros": ["top 3 mentioned pros, each max 6 words"],
  "cons": ["top 1-2 mentioned cons, each max 6 words (empty array if none)"],
  "bestFor": "who this product is best for (max 10 words)",
  "sentiment": "positive | mixed | negative"
}`

  const apiKey = process.env.GROQ_API_KEY

  if (apiKey) {
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: 'You are a product review analyst. Respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      })

      if (groqResponse.ok) {
        const completion = await groqResponse.json()
        const content = completion.choices[0]?.message?.content || ''
        // Parse JSON (handle potential markdown fences)
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const summary = JSON.parse(jsonStr)

        // Cache
        cache.set(productId, { summary, expires: Date.now() + CACHE_TTL })

        return NextResponse.json({ summary, cached: false })
      } else {
        console.error('Groq API error:', groqResponse.status, await groqResponse.text())
      }
    } catch (e: unknown) {
      console.error('Review summary AI error:', e)
    }
  }

  // Fallback: simple stats-based summary (runs when no API key or AI call fails)
  const positive = reviews.filter((r) => r.rating >= 4).length
  const summary = {
    verdict: `${avgRating.toFixed(1)}/5 stars from ${reviews.length} reviews`,
    pros: ['Good quality', 'Value for money', 'Fast shipping'],
    cons: positive < reviews.length * 0.7 ? ['Some quality concerns'] : [],
    bestFor: avgRating >= 4 ? 'Most shoppers' : 'Selective buyers',
    sentiment: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'mixed' : 'negative',
  }
  return NextResponse.json({ summary, fallback: true })
}
