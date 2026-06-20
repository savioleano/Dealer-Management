import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isSuperAdmin } from '@/lib/access'

// Creating ADMIN users is exclusive to SUPER_ADMIN.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, phone, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })

  const hashed = await bcrypt.hash(password, 10)
  const admin = await prisma.user.create({
    data: { name, email, phone: phone || null, password: hashed, role: 'ADMIN' },
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json(admin, { status: 201 })
}
