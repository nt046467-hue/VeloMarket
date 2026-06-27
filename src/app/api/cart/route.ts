import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// GET — fetch user's saved cart from server
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ items: [] })

  const cartItems = await db.cartItem.findMany({
    where: { userId: user.id },
    include: { product: { select: { name: true, slug: true, brand: true, images: true, stock: true, isActive: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    items: cartItems.map((c) => ({
      id: c.id,
      productId: c.productId,
      name: c.product.name,
      slug: c.product.slug,
      brand: c.product.brand,
      price: c.unitPrice,
      image: (() => { try { return JSON.parse(c.product.images || '[]')[0] || '' } catch { return '' } })(),
      quantity: c.quantity,
      stock: c.product.stock,
      variantKey: c.variantKey ?? c.productId,
      variantSelection: c.variantData ? JSON.parse(c.variantData) : undefined,
    })),
  })
}

// POST — sync entire cart (replace strategy: easiest and most robust)
type CartLineInput = {
  productId: string
  quantity: number
  unitPrice: number
  variantKey?: string
  variantData?: { color?: { name: string; hex: string }; size?: { name: string } }
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || 'sync')

  if (action === 'clear') {
    await db.cartItem.deleteMany({ where: { userId: user.id } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'sync') {
    const incoming: CartLineInput[] = Array.isArray(body.items) ? body.items : []
    // Validate all products exist & are active
    const ids = [...new Set(incoming.map((i) => i.productId))]
    const products = await db.product.findMany({ where: { id: { in: ids } }, select: { id: true, isActive: true } })
    const validIds = new Set(products.filter((p) => p.isActive).map((p) => p.id))

    const validLines = incoming
      .filter((i) => validIds.has(i.productId))
      .map((i) => ({
        userId: user.id,
        productId: i.productId,
        quantity: Math.max(1, Math.min(i.quantity, 99)),
        variantKey: i.variantKey ?? i.productId,
        variantData: i.variantData ? JSON.stringify(i.variantData) : null,
        unitPrice: i.unitPrice,
      }))

    // Replace strategy: delete all then re-insert
    await db.cartItem.deleteMany({ where: { userId: user.id } })
    if (validLines.length > 0) {
      // Use individual creates to avoid createMany limitations
      for (const line of validLines) {
        try {
          await db.cartItem.create({
            data: {
              userId: line.userId,
              productId: line.productId,
              quantity: line.quantity,
              variantKey: line.variantKey,
              variantData: line.variantData,
              unitPrice: line.unitPrice,
            },
          })
        } catch (e) {
          // Skip duplicates (shouldn't happen since we just deleted)
        }
      }
    }
    return NextResponse.json({ ok: true, saved: validLines.length })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
