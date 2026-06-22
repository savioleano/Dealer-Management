import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isSuperAdmin } from '@/lib/access'
import { Role } from '@prisma/client'

// Unified user management (Admins + Managers) — SUPER_ADMIN only.
const CREATABLE_ROLES = ['ADMIN', 'MANAGER'] as const

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { role, name, phone, email, password } = await req.json()

  if (!(CREATABLE_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json({ error: 'Role must be Admin or Manager' }, { status: 400 })
  }
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })

  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, password: await bcrypt.hash(password, 10), role: role as Role },
    select: { id: true, name: true, email: true, role: true },
  })

  return NextResponse.json(user, { status: 201 })
}
