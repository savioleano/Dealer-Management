import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

// Production-safe seed: ensures the first SUPER_ADMIN exists so someone can
// create Admins (and everything below). Idempotent — also promotes an existing
// admin@retailit.lk to SUPER_ADMIN. Set ADMIN_PASSWORD to control the password.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = 'admin@retailit.lk'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  await prisma.user.upsert({
    where: { email },
    update: { role: 'SUPER_ADMIN' },
    create: {
      name: 'Retail IT Super Admin',
      email,
      phone: '0770000000',
      password: await bcrypt.hash(password, 10),
      role: 'SUPER_ADMIN',
    },
  })
  console.log(`✓ Super Admin ready: ${email} / ${password}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
