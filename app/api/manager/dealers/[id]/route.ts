import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { DealerStatus } from '@prisma/client'
import { isStaff, dealerScope } from '@/lib/access'
import { validateCoords } from '@/lib/dealer'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !isStaff(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const {
    name,
    contactPerson,
    phone,
    phone2,
    operationalContactPerson,
    operationalContactNumber,
    email,
    address,
    mainCity,
    district,
    latitude,
    longitude,
    businessRegNo,
    bankGuaranteeValue,
    status,
    newPassword,
  } = body

  const dealer = await prisma.dealer.findFirst({
    where: { id, ...dealerScope(session) },
    include: { users: { where: { role: 'DEALER' }, select: { id: true } } },
  })
  if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 })

  const coord = validateCoords(latitude, longitude)
  if ('error' in coord) return NextResponse.json({ error: coord.error }, { status: 400 })

  if (bankGuaranteeValue != null && bankGuaranteeValue < dealer.bankGuaranteeUsed) {
    return NextResponse.json(
      { error: 'Guarantee limit cannot be below the amount already used' },
      { status: 400 }
    )
  }

  // Uniqueness checks (exclude this dealer)
  if (email && email !== dealer.email) {
    const taken = await prisma.dealer.findUnique({ where: { email } })
    if (taken) return NextResponse.json({ error: 'Business email already in use' }, { status: 409 })
  }
  if (businessRegNo && businessRegNo !== dealer.businessRegNo) {
    const taken = await prisma.dealer.findUnique({ where: { businessRegNo } })
    if (taken) return NextResponse.json({ error: 'Registration number already in use' }, { status: 409 })
  }

  if (newPassword && newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.dealer.update({
      where: { id },
      data: {
        name,
        contactPerson,
        phone,
        phone2: phone2 || null,
        operationalContactPerson: operationalContactPerson || null,
        operationalContactNumber: operationalContactNumber || null,
        email,
        address,
        mainCity,
        district,
        latitude: coord.lat,
        longitude: coord.lng,
        businessRegNo,
        bankGuaranteeValue,
        status: status as DealerStatus,
      },
    })

    if (newPassword && dealer.users[0]) {
      const hashed = await bcrypt.hash(newPassword, 10)
      await tx.user.update({ where: { id: dealer.users[0].id }, data: { password: hashed } })
    }
  })

  return NextResponse.json({ success: true })
}
