import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const SYSTEM_PROMPT = `You are Zoe, the friendly AI customer support assistant for VeloMarket, an online marketplace similar to Amazon. You help customers with:

- Product questions (features, specs, recommendations)
- Order tracking, shipping, returns, refunds
- Account issues (password, login, payment methods)
- Promo codes, loyalty points (Velo Rewards), bundle deals
- General shopping guidance

Key info about VeloMarket:
- Free shipping on orders over $99 (otherwise $9.99 standard)
- 30-day money-back returns
- 24/7 customer support
- Velo Rewards loyalty program: 1 point per $1 spent, 100 pts = $1 redeem
- Promo codes: SAVE10, WELCOME15, FESTIVE20, VELOPRIME25, FREESHIP
- Multi-currency support (USD, EUR, GBP, CNY, JPY)
- Demo account available for testing (ask staff for details)
- Support email: support@velomarket.com
- Support phone: 1-800-VELO-01

Style guidelines:
- Be warm, concise, and helpful
- Use friendly emoji sparingly (max 1-2 per message)
- When suggesting products, mention categories like Electronics, Fashion, Home & Kitchen, Audio, etc.
- If you don't know something specific to the user's account (like order status), suggest they sign in and check the Orders page
- For complex issues, suggest emailing support@velomarket.com
- Keep responses under 200 words unless the user specifically asks for detail
- Never make up specific order numbers, prices, or policies — refer to general guidelines`

// Simple in-memory conversation store (per session)
const conversations = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const message = String(body.message || '').trim()
    const sessionId = String(body.sessionId || 'default')
    const history = body.history as Array<{ role: string; content: string }> | undefined

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    // Build conversation history — system prompt uses 'system' role (Groq/OpenAI standard)
    const messages: Array<{ role: 'system' | 'assistant' | 'user'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ]
    if (history && Array.isArray(history)) {
      for (const m of history.slice(-10)) {
        if (m.role === 'user' || m.role === 'assistant') {
          messages.push({ role: m.role, content: m.content })
        }
      }
    }
    messages.push({ role: 'user', content: message })

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        max_tokens: 400,
        temperature: 0.7,
      }),
    })

    if (!groqResponse.ok) {
      const errText = await groqResponse.text()
      console.error('Groq API error:', groqResponse.status, errText)
      throw new Error(`Groq API returned ${groqResponse.status}`)
    }

    const completion = await groqResponse.json()
    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Empty response from AI')
    }

    // Store in conversation
    if (!conversations.has(sessionId)) conversations.set(sessionId, [])
    const convo = conversations.get(sessionId)!
    convo.push({ role: 'user', content: message })
    convo.push({ role: 'assistant', content: response })
    // Cap at 20 messages
    if (convo.length > 20) conversations.set(sessionId, convo.slice(-20))

    return NextResponse.json({
      response,
      sessionId,
    })
  } catch (e: unknown) {
    console.error('Chat API error:', e)
    return NextResponse.json(
      { error: 'Sorry, I had trouble responding. Please try again.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId') || 'default'
  conversations.delete(sessionId)
  return NextResponse.json({ ok: true })
}
