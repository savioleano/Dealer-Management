import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'DEALER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { dealerId, date, lines } = await req.json()

  if (session.user.dealerId !== dealerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!lines?.length) {
    return NextResponse.json({ error: 'No sales lines provided' }, { status: 400 })
  }

  const logDate = new Date(date)

  // Check for duplicate log
  const existing = await prisma.salesLog.findFirst({
    where: {
      dealerId,
      date: { gte: logDate, lt: new Date(logDate.getTime() + 86400000) },
    },
  })
  if (existing) {
    return NextResponse.json({ error: 'Sales log already submitted for this date' }, { status: 409 })
  }

  // Validate stock
  for (const line of lines) {
    const stock = await prisma.stock.findUnique({
      where: { dealerId_productId: { dealerId, productId: line.productId } },
    })
    if (!stock || stock.quantity < line.unitsSold) {
      return NextResponse.json({ error: `Insufficient stock for product ${line.productId}` }, { status: 400 })
    }
  }

  // Create log and deduct stock in transaction
  await prisma.$transaction(async (tx) => {
    await tx.salesLog.create({
      data: {
        dealerId,
        date: logDate,
        lines: {
          create: lines.map((l: { productId: string; unitsSold: number; sellingPrice: number }) => ({
            productId: l.productId,
            unitsSold: l.unitsSold,
            sellingPrice: l.sellingPrice,
          })),
        },
      },
    })

    for (const line of lines) {
      await tx.stock.update({
        where: { dealerId_productId: { dealerId, productId: line.productId } },
        data: { quantity: { decrement: line.unitsSold } },
      })
    }
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
