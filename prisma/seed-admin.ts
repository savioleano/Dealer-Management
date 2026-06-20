import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

// Production-safe seed: creates ONLY the admin login so you can sign in and
// build the rest (managers, dealers, products) through the UI. Idempotent.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = 'admin@retailit.lk'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      name: 'Retail IT Admin',
      email,
      phone: '0770000000',
      password: await bcrypt.hash(password, 10),
      role: 'ADMIN',
    },
  })
  console.log(`✓ Admin ready: ${email} / ${password}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
