# Retail IT — Dealer Management Portal

A web-based dealer management portal built with Next.js 16 (App Router), Prisma 7, NextAuth v5, and Tailwind CSS 4.

## Roles

Hierarchy: **SUPER_ADMIN > ADMIN > MANAGER > DEALER**

- **DEALER** — places orders, tracks stock, logs daily sales, views own profile & bank guarantee.
- **MANAGER** — approves orders, dispatches/delivers, sees their own dealers' stock & sales; creates Dealers.
- **ADMIN** — full access across all managers' data; creates Managers and Dealers. Cannot create other Admins.
- **SUPER_ADMIN** — everything an Admin can do, **plus** the exclusive ability to create Admin users (Manage Admins). The first Super Admin is seeded as `admin@retailit.lk` (`npm run db:seed:admin`).

Permission matrix:

| Capability | DEALER | MANAGER | ADMIN | SUPER_ADMIN |
| --- | :---: | :---: | :---: | :---: |
| Own orders / stock / sales | ✓ | — | — | — |
| Manage own dealers | — | ✓ | ✓ (all) | ✓ (all) |
| Approve orders / dispatch | — | ✓ | ✓ | ✓ |
| Create Dealers | — | ✓ | ✓ | ✓ |
| Create Managers | — | — | ✓ | ✓ |
| Create Admins | — | — | — | ✓ |

## Tech stack

| Concern        | Choice                                        |
| -------------- | --------------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack)            |
| Database       | PostgreSQL via Prisma 7 (`pg` driver adapter) |
| Auth           | NextAuth v5 (Credentials, JWT sessions)       |
| Styling        | Tailwind CSS 4                                |
| Deploy target  | Vercel                                        |

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Provide a PostgreSQL database

For local development, the easiest path is Prisma's built-in local Postgres server:

```bash
npx prisma dev
```

Leave it running. It prints a `DATABASE_URL` (and `SHADOW_DATABASE_URL`) — copy them into `.env`.
Alternatively, point `DATABASE_URL` at any Postgres instance (local install, Docker, Neon, Supabase, etc.).

### 3. Configure environment

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL="postgres://..."
AUTH_SECRET="<random-string>"
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="<your-google-maps-js-api-key>"
```

### Google Maps API key

The **Map** page and the Add Dealer location preview use the Google Maps
JavaScript API. Create a key in the Google Cloud Console with the **Maps
JavaScript API** enabled, then set it as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`:

- **Local:** add it to `.env`.
- **Production (Vercel):** add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in
  Project → Settings → Environment Variables, then redeploy.

> Note: this is a `NEXT_PUBLIC_*` variable, so it is embedded in the client
> bundle **at build time** — after adding/changing it you must redeploy.
> Restrict the key to your domains (HTTP referrers) in Google Cloud.

Without a key, the map areas show a "key not configured" message; the rest of
the app works normally.

### 4. Sync schema & seed

```bash
npx prisma db push     # or: npx prisma migrate dev --name init  (needs a shadow DB)
npm run db:seed
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000 and sign in.

## Seeded login credentials

| Role    | Email                   | Password    |
| ------- | ----------------------- | ----------- |
| Manager | manager@retailit.lk     | manager123  |
| Dealer  | dealer1@retailit.lk     | dealer123   |
| Dealer  | dealer2@retailit.lk     | dealer123   |
| Dealer  | dealer3@retailit.lk     | dealer123   |
| Dealer  | dealer4@retailit.lk     | dealer123   |

## Business rules

- **First order** per dealer is covered by the bank guarantee (payment `WAIVED`).
- **Subsequent orders** must have payment `CONFIRMED` before they can be dispatched.
- **Dispatch** auto-increments the dealer's stock for each order line.
- **Sales log submission** auto-decrements the dealer's stock and is validated against available quantity.
- **Bank guarantee utilization** = sum of order values against a 1,000,000 LKR limit per dealer.

## Project layout

```
app/
  login/            # shared login page
  dealer/           # DEALER portal (dashboard, orders, stock, sales, profile)
  manager/          # MANAGER portal (dashboard, order queue/detail, stock, reports)
  api/              # route handlers (auth, dealer orders/sales, manager order actions)
auth.ts             # full NextAuth config (Node runtime, Prisma-backed)
auth.config.ts      # edge-safe config used by proxy.ts (no Prisma)
proxy.ts            # route protection + role-based redirects (Next.js 16 "proxy", formerly middleware)
lib/prisma.ts       # Prisma client with pg driver adapter
prisma/
  schema.prisma     # data models
  seed.ts           # seed script
```

## Deploying to Vercel

1. Push to a Git repo and import into Vercel.
2. Set env vars (`DATABASE_URL`, `NEXTAUTH_SECRET`, `AUTH_SECRET`, `NEXTAUTH_URL`) in the Vercel dashboard. Point `DATABASE_URL` at a hosted Postgres (Neon, Supabase, Prisma Postgres, etc.).
3. Run `npx prisma db push` (or migrations) against the production database, then seed if desired.
