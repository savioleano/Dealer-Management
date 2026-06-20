import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slipDir, slipTypeFromExt } from '@/lib/slip-storage'

// Serves a payment slip to the owning dealer or the dealer's manager.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { dealer: { select: { managerId: true } } },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwningDealer = session.user.role === 'DEALER' && order.dealerId === session.user.dealerId
  const isManager = session.user.role === 'MANAGER' && order.dealer.managerId === session.user.id
  if (!isOwningDealer && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const dir = slipDir()
  const file = (await readdir(dir).catch(() => [])).find((f) => f.startsWith(`${id}.`))
  if (!file) {
    return NextResponse.json({ error: 'Slip file not available' }, { status: 404 })
  }

  const bytes = await readFile(path.join(dir, file))
  const ext = path.extname(file)
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': slipTypeFromExt(ext),
      'Content-Disposition': `inline; filename="payment-slip${ext}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
