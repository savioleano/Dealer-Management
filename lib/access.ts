import type { Session } from 'next-auth'

// Role tiers:
//   SUPER_ADMIN > ADMIN > MANAGER > DEALER
// SUPER_ADMIN and ADMIN share all "admin" access; SUPER_ADMIN additionally can
// create ADMIN users. MANAGER is scoped to its own dealers.

export function isSuperAdmin(role?: string | null): boolean {
  return role === 'SUPER_ADMIN'
}

// Admin-level access (covers both ADMIN and SUPER_ADMIN).
export function isAdmin(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

// "Staff" = anyone who can use the manager area (MANAGER, ADMIN, SUPER_ADMIN).
export function isStaff(role?: string | null): boolean {
  return role === 'MANAGER' || isAdmin(role)
}

// Where-fragment for querying Dealers: managers see only their own; admin tiers see all.
export function dealerScope(session: Session): { managerId?: string } {
  return session.user.role === 'MANAGER' ? { managerId: session.user.id } : {}
}

// Where-fragment for records that relate to a dealer (Order, SalesLog).
export function dealerRelationScope(session: Session): { dealer?: { managerId: string } } {
  return session.user.role === 'MANAGER' ? { dealer: { managerId: session.user.id } } : {}
}
