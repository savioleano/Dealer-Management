import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isStaff } from '@/lib/access'

interface Update {
  dealerId: string
  productId: string
  quantity: number
}

// Save dealer stock quantities. MANAGER (own dealers), ADMIN, SUPER_ADMIN.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !isStaff(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const updates: Update[] = Array.isArray(body?.updates) ? body.updates : []
  if (updates.length === 0) return NextResponse.json({ success: true, saved: 0 })

  // Validate quantities.
  for (const u of updates) {
    const q = Number(u.quantity)
    if (!u.dealerId || !u.productId || !Number.isInteger(q) || q < 0) {
      return NextResponse.json({ error: 'Each stock value must be a whole number ≥ 0' }, { status: 400 })
    }
  }

  // Managers may only edit stock for their own dealers.
  if (session.user.role === 'MANAGER') {
    const dealerIds = [...new Set(updates.map((u) => u.dealerId))]
    const owned = await prisma.dealer.count({
      where: { id: { in: dealerIds }, managerId: session.user.id },
    })
    if (owned !== dealerIds.length) {
      return NextResponse.json({ error: 'You can only edit stock for your own dealers' }, { status: 403 })
    }
  }

  await prisma.$transaction(
    updates.map((u) =>
      prisma.stock.upsert({
        where: { dealerId_productId: { dealerId: u.dealerId, productId: u.productId } },
        update: { quantity: Number(u.quantity) },
        create: { dealerId: u.dealerId, productId: u.productId, quantity: Number(u.quantity) },
      })
    )
  )

  return NextResponse.json({ success: true, saved: updates.length })
}
