import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isValidCategory, PRODUCT_CATEGORIES } from '@/lib/products'
import { isStaff } from '@/lib/access'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !isStaff(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Protect transactional history: refuse if used in any order or sales log.
  const [orderLineCount, salesLineCount] = await Promise.all([
    prisma.orderLine.count({ where: { productId: id } }),
    prisma.salesLogLine.count({ where: { productId: id } }),
  ])
  if (orderLineCount > 0 || salesLineCount > 0) {
    return NextResponse.json(
      { error: 'Cannot delete: this product appears in existing orders or sales records.' },
      { status: 409 }
    )
  }

  // Safe to remove — clean up dealer stock allocations, then the product.
  await prisma.$transaction([
    prisma.stock.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ])

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !isStaff(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { name, category, dealerPrice, sellingPrice } = await req.json()

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  if (category != null && !isValidCategory(category)) {
    return NextResponse.json({ error: `Category must be one of ${PRODUCT_CATEGORIES.join(', ')}` }, { status: 400 })
  }

  if (dealerPrice != null && dealerPrice < 0) {
    return NextResponse.json({ error: 'Dealer price must be zero or greater' }, { status: 400 })
  }
  if (sellingPrice != null && sellingPrice < 0) {
    return NextResponse.json({ error: 'Selling price must be zero or greater' }, { status: 400 })
  }

  const finalDealer = dealerPrice ?? product.dealerPrice
  const finalSelling = sellingPrice ?? product.sellingPrice
  if (finalSelling < finalDealer) {
    return NextResponse.json({ error: 'Selling price cannot be below the dealer price' }, { status: 400 })
  }

  if (name && name !== product.name) {
    const taken = await prisma.product.findUnique({ where: { name } })
    if (taken) return NextResponse.json({ error: 'A product with this name already exists' }, { status: 409 })
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { name, category, dealerPrice, sellingPrice },
  })

  return NextResponse.json(updated)
}
