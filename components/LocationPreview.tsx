'use client'

import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api'

const SRI_LANKA = { lat: 7.8731, lng: 80.7718 }
const containerStyle = { width: '100%', height: '240px', borderRadius: '8px' }

// Small map preview that drops a pin once valid coordinates are entered.
export default function LocationPreview({ lat, lng }: { lat: number | null; lng: number | null }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const { isLoaded } = useJsApiLoader({ id: 'gmaps-script', googleMapsApiKey: apiKey ?? '' })

  const valid =
    lat != null && lng != null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180

  if (!apiKey) {
    return (
      <p className="text-xs text-amber-600">
        Map preview unavailable — NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set.
      </p>
    )
  }
  if (!isLoaded) {
    return <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">Loading preview…</div>
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={valid ? { lat: lat!, lng: lng! } : SRI_LANKA}
      zoom={valid ? 15 : 7}
      options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
    >
      {valid && <MarkerF position={{ lat: lat!, lng: lng! }} />}
    </GoogleMap>
  )
}
