import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isStaff, dealerRelationScope } from '@/lib/access'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !isStaff(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { action, note } = await req.json()

  const order = await prisma.order.findFirst({
    where: { id, ...dealerRelationScope(session) },
    include: { lines: true },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (action === 'approve') {
    // Approve the review. Bank-guarantee (waived) orders skip the payment steps.
    if (order.status !== 'PENDING_REVIEW') {
      return NextResponse.json({ error: 'Order is not pending review' }, { status: 400 })
    }
    const nextStatus = order.paymentStatus === 'WAIVED' ? 'PREPARING' : 'PENDING_PAYMENT_CONFIRMATION'
    await prisma.order.update({
      where: { id },
      data: { status: nextStatus, managerNote: note || null },
    })
  } else if (action === 'reject') {
    await prisma.order.update({
      where: { id },
      data: { status: 'DRAFT', managerNote: note || null },
    })
  } else if (action === 'approve-payment') {
    // Manager approves the dealer-submitted payment.
    if (order.status !== 'PENDING_PAYMENT_APPROVAL') {
      return NextResponse.json({ error: 'Order has no payment awaiting approval' }, { status: 400 })
    }
    await prisma.order.update({
      where: { id },
      data: { status: 'PREPARING', paymentStatus: 'CONFIRMED', managerNote: note || null },
    })
  } else if (action === 'reject-payment') {
    // Send the payment back to the dealer to re-enter.
    if (order.status !== 'PENDING_PAYMENT_APPROVAL') {
      return NextResponse.json({ error: 'Order has no payment awaiting approval' }, { status: 400 })
    }
    await prisma.order.update({
      where: { id },
      data: { status: 'PENDING_PAYMENT_CONFIRMATION', managerNote: note || null },
    })
  } else if (action === 'dispatch') {
    if (order.status !== 'PREPARING') {
      return NextResponse.json({ error: 'Order must be in preparation before dispatch' }, { status: 400 })
    }

    // Auto-increment stock on dispatch
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: 'DISPATCHED', managerNote: note || null },
      })

      for (const line of order.lines) {
        await tx.stock.upsert({
          where: { dealerId_productId: { dealerId: order.dealerId, productId: line.productId } },
          update: { quantity: { increment: line.quantity } },
          create: { dealerId: order.dealerId, productId: line.productId, quantity: line.quantity },
        })
      }
    })
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
