import type { Session } from 'next-auth'

// MANAGER and ADMIN are both "staff". ADMIN has full, unscoped access;
// MANAGER is scoped to the dealers they own.
export function isStaff(role?: string | null): boolean {
  return role === 'MANAGER' || role === 'ADMIN'
}

// Where-fragment for querying Dealers: admin sees all, manager sees own.
export function dealerScope(session: Session): { managerId?: string } {
  return session.user.role === 'ADMIN' ? {} : { managerId: session.user.id }
}

// Where-fragment for records that relate to a dealer (Order, SalesLog):
// admin sees all, manager sees only their dealers' records.
export function dealerRelationScope(session: Session): { dealer?: { managerId: string } } {
  return session.user.role === 'ADMIN' ? {} : { dealer: { managerId: session.user.id } }
}
