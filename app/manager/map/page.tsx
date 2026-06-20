import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { dealerScope } from '@/lib/access'
import DealerMap from '@/components/DealerMap'
import RefreshButton from './RefreshButton'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const session = (await auth())!

  // Live query: every dealer (in scope) that has coordinates. New dealers appear
  // automatically on next load / refresh — no code change needed.
  const dealers = await prisma.dealer.findMany({
    where: { ...dealerScope(session), latitude: { not: null }, longitude: { not: null } },
    select: {
      id: true,
      name: true,
      mainCity: true,
      district: true,
      status: true,
      contactPerson: true,
      phone: true,
      latitude: true,
      longitude: true,
    },
    orderBy: { name: 'asc' },
  })

  const pins = dealers.map((d) => ({
    ...d,
    latitude: d.latitude as number,
    longitude: d.longitude as number,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dealer Map</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pins.length} dealer{pins.length === 1 ? '' : 's'} with location data</p>
        </div>
        <RefreshButton />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <DealerMap dealers={pins} />
      </div>

      {pins.length === 0 && (
        <p className="text-sm text-gray-400">
          No dealers have coordinates yet. Add Latitude/Longitude on the Add Dealer form to see them here.
        </p>
      )}
    </div>
  )
}
