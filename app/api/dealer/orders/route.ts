import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'DEALER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { dealerId, lines, deliveryAddress, notes } = await req.json()

  if (session.user.dealerId !== dealerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!lines?.length || !deliveryAddress) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Normalise incoming lines (dealer only chooses product + quantity).
  const requested: { productId: string; quantity: number }[] = lines.map(
    (l: { productId: string; quantity: number }) => ({
      productId: l.productId,
      quantity: Math.max(1, Math.floor(Number(l.quantity) || 0)),
    })
  )
  if (requested.some((l) => !l.productId)) {
    return NextResponse.json({ error: 'Each line must have a product selected' }, { status: 400 })
  }

  // Price comes from the manager-set product price, never from the client.
  const productIds = [...new Set(requested.map((l) => l.productId))]
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
  const priceMap = new Map(products.map((p) => [p.id, p.dealerPrice]))
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more selected products no longer exist' }, { status: 400 })
  }

  // Determine if this is the first order (bank guarantee applies)
  const existingOrders = await prisma.order.count({ where: { dealerId } })
  const isFirstOrder = existingOrders === 0

  const order = await prisma.order.create({
    data: {
      dealerId,
      status: 'PENDING_REVIEW',
      paymentStatus: isFirstOrder ? 'WAIVED' : 'PENDING',
      deliveryAddress,
      notes: notes || null,
      lines: {
        create: requested.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: priceMap.get(l.productId)!,
        })),
      },
    },
    include: { lines: true },
  })

  // Update bank guarantee used
  const orderTotal = order.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  await prisma.dealer.update({
    where: { id: dealerId },
    data: { bankGuaranteeUsed: { increment: orderTotal } },
  })

  return NextResponse.json(order, { status: 201 })
}
