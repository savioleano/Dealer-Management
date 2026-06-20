import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isValidCategory, PRODUCT_CATEGORIES } from '@/lib/products'
import { isStaff } from '@/lib/access'

interface IncomingRow {
  name?: string
  category?: string
  dealerPrice?: number | string
  sellingPrice?: number | string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !isStaff(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const rows: IncomingRow[] = Array.isArray(body?.rows) ? body.rows : []

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }
  if (rows.length > 1000) {
    return NextResponse.json({ error: 'Too many rows (max 1000 per upload)' }, { status: 400 })
  }

  const errors: { row: number; message: string }[] = []
  const valid: { name: string; category: string; dealerPrice: number; sellingPrice: number }[] = []
  const seenNames = new Set<string>()

  rows.forEach((raw, i) => {
    const rowNum = i + 1
    const name = String(raw.name ?? '').trim()
    const category = String(raw.category ?? '').trim()
    const dealerPrice = Number(raw.dealerPrice)
    const sellingPrice = Number(raw.sellingPrice)

    if (!name) return errors.push({ row: rowNum, message: 'Product name is required' })
    if (!isValidCategory(category))
      return errors.push({ row: rowNum, message: `Category must be one of ${PRODUCT_CATEGORIES.join(', ')}` })
    if (!Number.isFinite(dealerPrice) || dealerPrice < 0)
      return errors.push({ row: rowNum, message: 'Dealer Price must be a number ≥ 0' })
    if (!Number.isFinite(sellingPrice) || sellingPrice < 0)
      return errors.push({ row: rowNum, message: 'Selling Price must be a number ≥ 0' })
    if (sellingPrice < dealerPrice)
      return errors.push({ row: rowNum, message: 'Selling Price cannot be below Dealer Price' })

    const key = name.toLowerCase()
    if (seenNames.has(key))
      return errors.push({ row: rowNum, message: `Duplicate product name in file: "${name}"` })
    seenNames.add(key)

    valid.push({ name, category, dealerPrice, sellingPrice })
  })

  if (valid.length === 0) {
    return NextResponse.json(
      { error: 'No valid rows to import', errors, created: 0, updated: 0 },
      { status: 400 }
    )
  }

  // Upsert by unique product name: update price/category if it exists, else create.
  let created = 0
  let updated = 0

  await prisma.$transaction(async (tx) => {
    for (const p of valid) {
      const existing = await tx.product.findUnique({ where: { name: p.name } })
      if (existing) {
        await tx.product.update({
          where: { id: existing.id },
          data: { category: p.category, dealerPrice: p.dealerPrice, sellingPrice: p.sellingPrice },
        })
        updated++
      } else {
        await tx.product.create({ data: p })
        created++
      }
    }
  })

  return NextResponse.json({ created, updated, errors, total: valid.length })
}
