import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json()

  if (!token || !newPassword) {
    return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired. Request a new one.' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: await bcrypt.hash(newPassword, 10) } }),
    // Single-use: clear all this user's reset tokens.
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ])

  return NextResponse.json({ success: true })
}
