import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const productId = url.searchParams.get('productId')
  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }
  const questions = await db.question.findMany({
    where: { productId },
    orderBy: [{ helpfulQ: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({
    questions: questions.map((q) => ({
      id: q.id,
      productId: q.productId,
      author: q.author,
      question: q.question,
      answer: q.answer,
      answerAuthor: q.answerAuthor,
      answeredAt: q.answeredAt?.toISOString() ?? null,
      helpfulQ: q.helpfulQ,
      helpfulA: q.helpfulA,
      createdAt: q.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || 'ask')
  const productId = String(body.productId || '')

  // ---- ASK ----
  if (action === 'ask') {
    if (!user) return NextResponse.json({ error: 'Please sign in to ask a question' }, { status: 401 })
    const question = String(body.question || '').trim().slice(0, 500)
    if (!productId || !question) {
      return NextResponse.json({ error: 'Question text required' }, { status: 400 })
    }
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    const created = await db.question.create({
      data: {
        productId,
        userId: user.id,
        author: user.name,
        question,
      },
    })
    return NextResponse.json({
      question: {
        id: created.id,
        author: created.author,
        question: created.question,
        answer: null,
        answerAuthor: null,
        answeredAt: null,
        helpfulQ: 0,
        helpfulA: 0,
        createdAt: created.createdAt.toISOString(),
      },
    })
  }

  // ---- ANSWER ----
  if (action === 'answer') {
    if (!user) return NextResponse.json({ error: 'Please sign in to answer' }, { status: 401 })
    const questionId = String(body.questionId || '')
    const answer = String(body.answer || '').trim().slice(0, 1000)
    if (!questionId || !answer) {
      return NextResponse.json({ error: 'Answer text required' }, { status: 400 })
    }
    const updated = await db.question.update({
      where: { id: questionId },
      data: {
        answer,
        answerAuthor: user.name,
        answeredAt: new Date(),
      },
    })
    return NextResponse.json({
      question: {
        id: updated.id,
        answer: updated.answer,
        answerAuthor: updated.answerAuthor,
        answeredAt: updated.answeredAt?.toISOString() ?? null,
      },
    })
  }

  // ---- VOTE HELPFUL ----
  if (action === 'helpfulQ' || action === 'helpfulA') {
    const questionId = String(body.questionId || '')
    if (!questionId) return NextResponse.json({ error: 'questionId required' }, { status: 400 })
    const field = action === 'helpfulQ' ? 'helpfulQ' : 'helpfulA'
    const updated = await db.question.update({
      where: { id: questionId },
      data: { [field]: { increment: 1 } },
    })
    return NextResponse.json({ [field]: updated[field] })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
