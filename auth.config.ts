import type { NextAuthConfig } from 'next-auth'
import type { Role } from '@prisma/client'

// Edge-safe config (no Prisma / no Node-only drivers).
// Used by middleware and spread into the full config in auth.ts.
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: Role }).role
        token.dealerId = (user as { dealerId: string | null }).dealerId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.dealerId = token.dealerId as string | null
      }
      return session
    },
  },
  providers: [], // real providers are added in auth.ts (Node runtime)
} satisfies NextAuthConfig
