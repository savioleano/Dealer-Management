'use client'

import { useState } from 'react'
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api'

export interface DealerPin {
  id: string
  name: string
  mainCity: string | null
  district: string | null
  status: string
  contactPerson: string
  phone: string
  latitude: number
  longitude: number
}

const SRI_LANKA = { lat: 7.8731, lng: 80.7718 }
const containerStyle = { width: '100%', height: '70vh', borderRadius: '12px' }

// Classic Google map pin icons (hosted by Google, https-safe).
const PIN_ICON: Record<string, string> = {
  ACTIVE: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  PLANNED: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  INACTIVE: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  SUSPENDED: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
}

const LEGEND = [
  { label: 'Active', color: '#16a34a' },
  { label: 'Planned', color: '#f59e0b' },
  { label: 'Inactive', color: '#2563eb' },
  { label: 'Suspended', color: '#dc2626' },
]

export default function DealerMap({ dealers }: { dealers: DealerPin[] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const { isLoaded } = useJsApiLoader({ id: 'gmaps-script', googleMapsApiKey: apiKey ?? '' })
  const [activeId, setActiveId] = useState<string | null>(null)

  if (!apiKey) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-center px-6">
        <div>
          <p className="font-medium text-amber-800">Google Maps API key not configured</p>
          <p className="text-sm text-amber-700 mt-1">
            Set <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment, then redeploy.
          </p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return <div className="flex h-[70vh] items-center justify-center text-gray-500">Loading map…</div>
  }

  const active = dealers.find((d) => d.id === activeId) ?? null

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={SRI_LANKA}
        zoom={7}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
      >
        {dealers.map((d) => (
          <MarkerF
            key={d.id}
            position={{ lat: d.latitude, lng: d.longitude }}
            icon={PIN_ICON[d.status] ?? PIN_ICON.ACTIVE}
            onClick={() => setActiveId(d.id)}
          />
        ))}

        {active && (
          <InfoWindowF position={{ lat: active.latitude, lng: active.longitude }} onCloseClick={() => setActiveId(null)}>
            <div className="min-w-[180px] text-sm">
              <p className="font-semibold text-gray-900">{active.name}</p>
              <p className="text-gray-600">{[active.mainCity, active.district].filter(Boolean).join(', ') || '—'}</p>
              <p className="text-gray-600 mt-1">{active.contactPerson} · {active.phone}</p>
              <p className="mt-1">
                <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {active.status}
                </span>
              </p>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-white/95 border border-gray-200 shadow px-3 py-2">
        <p className="text-xs font-medium text-gray-500 uppercase mb-1.5">Legend</p>
        <ul className="space-y-1">
          {LEGEND.map((l) => (
            <li key={l.label} className="flex items-center gap-2 text-xs text-gray-700">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
