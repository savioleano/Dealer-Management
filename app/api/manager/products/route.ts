import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isValidCategory, PRODUCT_CATEGORIES } from '@/lib/products'
import { isStaff } from '@/lib/access'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !isStaff(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, category, dealerPrice, sellingPrice } = await req.json()

  if (!name || !category) {
    return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
  }
  if (!isValidCategory(category)) {
    return NextResponse.json({ error: `Category must be one of ${PRODUCT_CATEGORIES.join(', ')}` }, { status: 400 })
  }
  if (dealerPrice == null || dealerPrice < 0) {
    return NextResponse.json({ error: 'Dealer price must be zero or greater' }, { status: 400 })
  }
  if (sellingPrice == null || sellingPrice < 0) {
    return NextResponse.json({ error: 'Selling price must be zero or greater' }, { status: 400 })
  }
  if (sellingPrice < dealerPrice) {
    return NextResponse.json({ error: 'Selling price cannot be below the dealer price' }, { status: 400 })
  }

  const existing = await prisma.product.findUnique({ where: { name } })
  if (existing) return NextResponse.json({ error: 'A product with this name already exists' }, { status: 409 })

  const product = await prisma.product.create({
    data: { name, category, dealerPrice, sellingPrice },
  })

  return NextResponse.json(product, { status: 201 })
}
