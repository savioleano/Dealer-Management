import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from './auth.config'

// Edge-safe NextAuth instance (no Prisma) for route protection.
const { auth } = NextAuth(authConfig)

const HOME: Record<string, string> = {
  ADMIN: '/admin',
  MANAGER: '/manager',
  DEALER: '/dealer',
}

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  const isLoginPage = nextUrl.pathname === '/login'
  const role = session?.user.role
  const home = role ? HOME[role] : '/login'

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(home, nextUrl))
  }

  // Which areas each role may enter. Admin has full access (admin + manager areas).
  const allowedAreas: Record<string, string[]> = {
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

