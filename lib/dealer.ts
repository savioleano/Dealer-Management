// Dealer status: shared options, badge styling, and map pin colors.

export const DEALER_STATUSES = ['ACTIVE', 'PLANNED', 'INACTIVE', 'SUSPENDED'] as const
export type DealerStatusValue = (typeof DEALER_STATUSES)[number]

// Tailwind badge classes per status.
export const DEALER_STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PLANNED: 'bg-amber-100 text-amber-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-red-100 text-red-700',
}

// Hex colors for Google Maps pins per status.
export const DEALER_STATUS_PIN_COLOR: Record<string, string> = {
  ACTIVE: '#16a34a', // green
  PLANNED: '#f59e0b', // amber/orange
  INACTIVE: '#9ca3af', // gray
  SUSPENDED: '#dc2626', // red
}

export function statusBadge(status: string): string {
  return DEALER_STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-600'
}

export function pinColor(status: string): string {
  return DEALER_STATUS_PIN_COLOR[status] ?? '#9ca3af'
}

export function isValidDealerStatus(v: unknown): v is DealerStatusValue {
  return typeof v === 'string' && (DEALER_STATUSES as readonly string[]).includes(v)
}

// Validate optional lat/long pair. Returns parsed numbers (or nulls when blank),
// or an { error } message when invalid.
export function validateCoords(
  latitude: unknown,
  longitude: unknown
): { lat: number | null; lng: number | null } | { error: string } {
  const hasLat = latitude !== null && latitude !== undefined && latitude !== ''
  const hasLng = longitude !== null && longitude !== undefined && longitude !== ''
  if (hasLat !== hasLng) return { error: 'Provide both latitude and longitude, or neither' }
  if (!hasLat) return { lat: null, lng: null }
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (Number.isNaN(lat) || lat < -90 || lat > 90) return { error: 'Latitude must be between -90 and 90' }
  if (Number.isNaN(lng) || lng < -180 || lng > 180) return { error: 'Longitude must be between -180 and 180' }
  return { lat, lng }
}
