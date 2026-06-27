import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const sessionUser = await getUserFromRequest(req)
  if (!sessionUser) return NextResponse.json({ user: null })
  // Fetch fresh loyalty points + role from DB
  const fresh = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { loyaltyPoints: true, role: true, name: true, email: true },
  })
  if (!fresh) return NextResponse.json({ user: null })
  return NextResponse.json({
    user: {
      id: sessionUser.id,
      email: fresh.email,
      name: fresh.name,
      role: fresh.role,
      loyaltyPoints: fresh.loyaltyPoints,
    },
  })
}
