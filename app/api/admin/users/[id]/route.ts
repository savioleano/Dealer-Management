import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isSuperAdmin } from '@/lib/access'

const MANAGEABLE = ['ADMIN', 'MANAGER', 'SUPER_ADMIN']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { name, email, phone, newPassword } = await req.json()

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || !MANAGEABLE.includes(user.role)) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }
  if (email !== user.email) {
    const taken = await prisma.user.findUnique({ where: { email } })
    if (taken) return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
  }
  if (newPassword && newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      phone: phone || null,
      ...(newPassword ? { password: await bcrypt.hash(newPassword, 10) } : {}),
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (id === session.user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { managedDealers: true } } },
  })
  if (!user || !MANAGEABLE.includes(user.role)) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  if (user.role === 'MANAGER' && user._count.managedDealers > 0) {
    return NextResponse.json(
      { error: 'This manager still has dealers assigned. Reassign or remove those dealers first.' },
      { status: 409 }
    )
  }

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
