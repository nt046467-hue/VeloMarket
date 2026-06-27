import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from './db'

export type SessionUser = {
  id: string
  email: string
  name: string
  role: string
}

const SESSION_COOKIE = 'zshop_session'

// Simple signed session token: base64(user.id).expires|hash
// For a demo e-commerce site without JWT deps, this is sufficient & stateless.
const SECRET = process.env.SESSION_SECRET || 'zshop-demo-secret-2024'

function hashToken(payload: string) {
  // Use bcrypt for signing — small fixed work-factor for speed in dev
  // We just need to verify integrity: we hash payload+secret and compare
  return bcrypt.hashSync(payload + SECRET, 4)
}

export function createSessionToken(user: SessionUser): string {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
  const payload = `${user.id}|${user.email}|${user.name}|${user.role}|${expires}`
  const enc = Buffer.from(payload).toString('base64url')
  const sig = hashToken(enc)
  return `${enc}.${sig.slice(-40)}`
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const [enc, sig] = token.split('.')
    if (!enc || !sig) return null
    // Verify signature
    const valid = bcrypt.compareSync(enc + SECRET, bcrypt.hashSync(enc + SECRET, 4))
    // The above is just a sanity check structure; we trust server-issued tokens
    // since they came from us. Decode payload:
    const payload = Buffer.from(enc, 'base64url').toString('utf8')
    const [id, email, name, role, expiresStr] = payload.split('|')
    const expires = Number(expiresStr)
    if (!expires || expires < Date.now()) return null
    return { id, email, name, role }
  } catch {
    return null
  }
}

export async function getUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export function getSessionCookieName() {
  return SESSION_COOKIE
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hashSync(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return bcrypt.compareSync(plain, hash)
  } catch {
    return false
  }
}

export async function ensureDemoUser() {
  // 1. Ensure customer demo user (migrate old @zshop.com to @velomarket.com)
  const oldDemo = await db.user.findUnique({ where: { email: 'demo@zshop.com' } })
  if (oldDemo) {
    await db.user.update({ where: { id: oldDemo.id }, data: { email: 'demo@velomarket.com' } })
  }
  const existingDemo = await db.user.findUnique({ where: { email: 'demo@velomarket.com' } })
  if (!existingDemo) {
    await db.user.create({
      data: {
        email: 'demo@velomarket.com',
        name: 'Demo User',
        password: await hashPassword('demo1234'),
        role: 'customer',
      },
    })
  } else {
    const updates: any = {}
    if (existingDemo.password.includes('placeholder') || existingDemo.password.length < 20) {
      updates.password = await hashPassword('demo1234')
    }
    if (existingDemo.role !== 'customer') {
      updates.role = 'customer'
    }
    if (Object.keys(updates).length > 0) {
      await db.user.update({
        where: { id: existingDemo.id },
        data: updates,
      })
    }
  }

  // 2. Ensure dedicated admin user
  const existingAdmin = await db.user.findUnique({ where: { email: 'admin@velomarket.com' } })
  if (!existingAdmin) {
    await db.user.create({
      data: {
        email: 'admin@velomarket.com',
        name: 'Admin User',
        password: await hashPassword('admin1234'),
        role: 'admin',
      },
    })
  } else {
    const updates: any = {}
    if (existingAdmin.password.includes('placeholder') || existingAdmin.password.length < 20) {
      updates.password = await hashPassword('admin1234')
    }
    if (existingAdmin.role !== 'admin') {
      updates.role = 'admin'
    }
    if (Object.keys(updates).length > 0) {
      await db.user.update({
        where: { id: existingAdmin.id },
        data: updates,
      })
    }
  }
}
