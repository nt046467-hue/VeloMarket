import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

async function requireAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user || user.role !== 'admin') return null
  return user
}

function parseImages(s: string | null): string[] {
  if (!s) return []
  try { return JSON.parse(s) } catch { return [] }
}

// GET /api/admin/products — list all products (incl. inactive) with pagination
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const url = new URL(req.url)
  const search = url.searchParams.get('q')?.trim() || ''
  const category = url.searchParams.get('category')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 200)

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { brand: { contains: search } },
      { slug: { contains: search } },
    ]
  }
  if (category && category !== 'all') {
    where.category = { slug: category }
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { category: true },
    }),
    db.product.count({ where }),
  ])

  return NextResponse.json({
    total,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      price: p.price,
      compareAt: p.compareAt,
      currency: p.currency,
      rating: p.rating,
      ratingCount: p.ratingCount,
      stock: p.stock,
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      categoryId: p.categoryId,
      category: p.category?.name,
      images: parseImages(p.images),
      createdAt: p.createdAt.toISOString(),
    })),
  })
}

// POST — create or update product
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || 'upsert')

  if (action === 'delete') {
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    // Check no orders reference this product first
    const orderCount = await db.orderItem.count({ where: { productId: id } })
    if (orderCount > 0) {
      // Soft delete instead
      await db.product.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ ok: true, softDeleted: true })
    }
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'toggleFeatured' || action === 'toggleActive') {
    const id = String(body.id || '')
    const product = await db.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const field = action === 'toggleFeatured' ? 'isFeatured' : 'isActive'
    await db.product.update({ where: { id }, data: { [field]: !product[field] } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'updateVariants') {
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const variants = body.variants
    if (!variants) return NextResponse.json({ error: 'variants required' }, { status: 400 })
    await db.product.update({
      where: { id },
      data: { variants: JSON.stringify(variants) },
    })
    return NextResponse.json({ ok: true })
  }

  // Upsert
  const data = {
    name: String(body.name || '').trim(),
    brand: String(body.brand || '').trim(),
    description: String(body.description || '').trim(),
    price: parseFloat(body.price),
    compareAt: body.compareAt ? parseFloat(body.compareAt) : null,
    stock: parseInt(body.stock || 0),
    isFeatured: !!body.isFeatured,
    isActive: body.isActive !== false,
    categoryId: String(body.categoryId || ''),
    images: JSON.stringify(Array.isArray(body.images) ? body.images.filter(Boolean) : []),
    specs: body.specs ? JSON.stringify(body.specs) : null,
    tags: body.tags ? JSON.stringify(body.tags) : null,
  }
  if (!data.name || !data.brand || isNaN(data.price) || !data.categoryId) {
    return NextResponse.json({ error: 'Missing required fields (name, brand, price, categoryId)' }, { status: 400 })
  }

  const id = String(body.id || '')
  if (id) {
    const updated = await db.product.update({ where: { id }, data })
    return NextResponse.json({ product: { id: updated.id } })
  }
  // Create new — generate slug
  const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 6)
  const created = await db.product.create({
    data: { ...data, slug: `${baseSlug}-${suffix}` },
  })
  return NextResponse.json({ product: { id: created.id } })
}
