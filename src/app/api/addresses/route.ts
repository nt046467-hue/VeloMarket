import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ addresses: [] })

  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({
    addresses: addresses.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      zip: a.zip,
      country: a.country,
      isDefault: a.isDefault,
      createdAt: a.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to manage addresses' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || 'save')

  if (action === 'delete') {
    const id = String(body.id || '')
    const addr = await db.address.findFirst({ where: { id, userId: user.id } })
    if (!addr) return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    await db.address.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'setDefault') {
    const id = String(body.id || '')
    const addr = await db.address.findFirst({ where: { id, userId: user.id } })
    if (!addr) return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } })
    await db.address.update({ where: { id }, data: { isDefault: true } })
    return NextResponse.json({ ok: true })
  }

  // Save new address
  const data = {
    fullName: String(body.fullName || '').trim(),
    phone: String(body.phone || '').trim(),
    line1: String(body.line1 || '').trim(),
    line2: String(body.line2 || '').trim() || null,
    city: String(body.city || '').trim(),
    state: String(body.state || '').trim(),
    zip: String(body.zip || '').trim(),
    country: String(body.country || 'United States').trim(),
    isDefault: !!body.isDefault,
  }
  if (!data.fullName || !data.phone || !data.line1 || !data.city || !data.state || !data.zip) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // If setting as default, clear others
  if (data.isDefault) {
    await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } })
  }

  // Check if user has any addresses; if not, make this default
  const count = await db.address.count({ where: { userId: user.id } })
  if (count === 0) data.isDefault = true

  const created = await db.address.create({
    data: { ...data, userId: user.id },
  })

  return NextResponse.json({
    address: {
      id: created.id,
      ...data,
      createdAt: created.createdAt.toISOString(),
    },
  })
}
