import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from './auth.config'

// Edge-safe NextAuth instance (no Prisma) for route protection.
const { auth } = NextAuth(authConfig)

const HOME: Record<string, string> = {
  SUPER_ADMIN: '/admin',
  ADMIN: '/admin',
  MANAGER: '/manager',
  DEALER: '/dealer',
}

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  const isLoginPage = nextUrl.pathname === '/login'
  // Public, auth-related pages reachable while logged out.
  const isPublicAuthPage =
    isLoginPage ||
    nextUrl.pathname === '/forgot-password' ||
    nextUrl.pathname === '/reset-password'
  const role = session?.user.role
  const home = role ? HOME[role] : '/login'

  if (!isLoggedIn && !isPublicAuthPage) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(home, nextUrl))
  }

  // Which areas each role may enter. Admin has full access (admin + manager areas).
  const allowedAreas: Record<string, string[]> = {
    SUPER_ADMIN: ['ADMIN', 'MANAGER'],
    ADMIN: ['ADMIN', 'MANAGER'],
    MANAGER: ['MANAGER'],
    DEALER: ['DEALER'],
  }

  const area = nextUrl.pathname.startsWith('/admin')
    ? 'ADMIN'
    : nextUrl.pathname.startsWith('/manager')
      ? 'MANAGER'
      : nextUrl.pathname.startsWith('/dealer')
        ? 'DEALER'
        : null

  if (area && role && !(allowedAreas[role] ?? []).includes(area)) {
    return NextResponse.redirect(new URL(home, nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  // Exclude API, Next internals, and static image files (e.g. the logo) so
  // public assets are served without auth redirects — needed for the logo on
  // the logged-out login page.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)'],
}


