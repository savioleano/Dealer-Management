import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

const GENERIC = { success: true, message: 'If that email is registered, a reset link has been sent.' }

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })

  // Always return the same response so we never reveal which emails exist.
  if (!user) return NextResponse.json(GENERIC)

  // One active token per user.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  })

  const link = new URL(`/reset-password?token=${rawToken}`, req.nextUrl.origin).toString()
  try {
    await sendPasswordResetEmail(user.email, link)
  } catch (e) {
    console.error('Password reset email failed:', e)
    // Still return generic success — don't leak send failures.
  }

  return NextResponse.json(GENERIC)
}
