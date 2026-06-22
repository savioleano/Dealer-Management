import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { DealerStatus } from '@prisma/client'
import { validateCoords, isValidDealerStatus } from '@/lib/dealer'
import { isAdmin } from '@/lib/access'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    managerId,
    name,
    businessRegNo,
    onboardingDate,
    address,
    mainCity,
    district,
    email,
    contactPerson,
    phone,
    phone2,
    operationalContactPerson,
    operationalContactNumber,
    status,
    latitude,
    longitude,
    loginPassword,
  } = body

  if (!managerId) {
    return NextResponse.json({ error: 'A manager must be assigned' }, { status: 400 })
  }
  if (!name || !contactPerson || !phone || !email || !address || !businessRegNo || !mainCity || !district) {
    return NextResponse.json({ error: 'Please fill all required dealer fields' }, { status: 400 })
  }
  if (!loginPassword || loginPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const coord = validateCoords(latitude, longitude)
  if ('error' in coord) return NextResponse.json({ error: coord.error }, { status: 400 })
  const dealerStatus = isValidDealerStatus(status) ? status : 'ACTIVE'

  const manager = await prisma.user.findFirst({ where: { id: managerId, role: 'MANAGER' } })
  if (!manager) return NextResponse.json({ error: 'Selected manager not found' }, { status: 400 })

  const [emailTaken, regTaken, userTaken] = await Promise.all([
    prisma.dealer.findUnique({ where: { email } }),
    prisma.dealer.findUnique({ where: { businessRegNo } }),
    prisma.user.findUnique({ where: { email } }),
  ])
  if (emailTaken) return NextResponse.json({ error: 'A dealer with this email already exists' }, { status: 409 })
  if (regTaken) return NextResponse.json({ error: 'A dealer with this registration number already exists' }, { status: 409 })
  if (userTaken) return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })

  const hashed = await bcrypt.hash(loginPassword, 10)
  const onboarding = onboardingDate ? new Date(onboardingDate) : new Date()

  const dealer = await prisma.$transaction(async (tx) => {
    const created = await tx.dealer.create({
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
        status: dealerStatus as DealerStatus,
        businessRegNo,
        onboardingDate: onboarding,
        managerId,
      },
    })

    await tx.user.create({
      data: { name, email, password: hashed, role: 'DEALER', dealerId: created.id },
    })

    return created
  })

  return NextResponse.json(dealer, { status: 201 })
}
