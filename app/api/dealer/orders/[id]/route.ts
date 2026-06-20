import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, rm } from 'fs/promises'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isValidPaymentMethod } from '@/lib/orders'
import { slipDir, slipExtFromType } from '@/lib/slip-storage'
import { PaymentMethod } from '@prisma/client'
import path from 'path'

const MAX_SLIP_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']

// Dealer submits payment details + slip (multipart/form-data).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'DEALER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const order = await prisma.order.findFirst({ where: { id, dealerId: session.user.dealerId ?? undefined } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status !== 'PENDING_PAYMENT_CONFIRMATION') {
    return NextResponse.json({ error: 'This order is not awaiting payment details' }, { status: 400 })
  }

  const form = await req.formData()
  const method = String(form.get('paymentMethod') ?? '')
  const dateStr = String(form.get('paymentDate') ?? '')
  const reference = String(form.get('paymentReference') ?? '').trim()
  const slip = form.get('slip')

  if (!isValidPaymentMethod(method)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  }
  const paymentDate = new Date(dateStr)
  if (isNaN(paymentDate.getTime())) {
    return NextResponse.json({ error: 'A valid payment date is required' }, { status: 400 })
  }
  if (!reference) {
    return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 })
  }
  if (!(slip instanceof File) || slip.size === 0) {
    return NextResponse.json({ error: 'A payment slip file is required' }, { status: 400 })
  }
  if (slip.size > MAX_SLIP_BYTES) {
    return NextResponse.json({ error: 'Payment slip must be 5 MB or smaller' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(slip.type)) {
    return NextResponse.json({ error: 'Slip must be an image (PNG/JPG/WEBP) or PDF' }, { status: 400 })
  }

  // Save the slip OUTSIDE the project tree (OS temp dir) so the dev file-watcher
  // isn't triggered, and served via /api/payment-slip/[id]. One slip per order.
  const bytes = Buffer.from(await slip.arrayBuffer())
  const ext = (path.extname(slip.name) || slipExtFromType(slip.type)).toLowerCase()
  const dir = slipDir()
  await mkdir(dir, { recursive: true })
  // Remove any previous slip for this order (e.g. resubmission with a different ext).
  for (const f of await readdir(dir).catch(() => [])) {
    if (f.startsWith(`${id}.`)) await rm(path.join(dir, f)).catch(() => {})
  }
  await writeFile(path.join(dir, `${id}${ext}`), bytes)

  await prisma.order.update({
    where: { id },
    data: {
      paymentMethod: method as PaymentMethod,
      paymentDate,
      paymentReference: reference,
      paymentSlipUrl: `/api/payment-slip/${id}`,
      paymentSubmittedAt: new Date(),
      status: 'PENDING_PAYMENT_APPROVAL',
    },
  })

  return NextResponse.json({ success: true })
}

// Dealer marks a dispatched order as received -> Order Completed.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'DEALER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { action } = await req.json()

  const order = await prisma.order.findFirst({ where: { id, dealerId: session.user.dealerId ?? undefined } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (action === 'receive') {
    if (order.status !== 'DISPATCHED') {
      return NextResponse.json({ error: 'Only dispatched orders can be marked received' }, { status: 400 })
    }
    await prisma.order.update({ where: { id }, data: { status: 'COMPLETED' } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
