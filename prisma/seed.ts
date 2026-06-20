import 'dotenv/config'
import { PrismaClient, Role, DealerStatus, OrderStatus, PaymentStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Products
  const products = await Promise.all([
    prisma.product.upsert({ where: { name: 'POS Device' }, update: {}, create: { name: 'POS Device', category: 'POS', dealerPrice: 45000, sellingPrice: 54000 } }),
    prisma.product.upsert({ where: { name: 'Thermal Printer' }, update: {}, create: { name: 'Thermal Printer', category: 'Accessories', dealerPrice: 12000, sellingPrice: 15000 } }),
    prisma.product.upsert({ where: { name: 'Barcode Scanner' }, update: {}, create: { name: 'Barcode Scanner', category: 'Accessories', dealerPrice: 8500, sellingPrice: 10500 } }),
    prisma.product.upsert({ where: { name: 'ECR Model' }, update: {}, create: { name: 'ECR Model', category: 'ECR', dealerPrice: 35000, sellingPrice: 42000 } }),
    prisma.product.upsert({ where: { name: 'POS Software' }, update: {}, create: { name: 'POS Software', category: 'POS', dealerPrice: 15000, sellingPrice: 19000 } }),
  ])

  const [posDevice, thermalPrinter, barcodeScanner, ecrModel, posSoftware] = products
  console.log('✓ Products seeded')

  // Admin
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@retailit.lk' },
    update: {},
    create: {
      name: 'Savio Super Admin',
      email: 'admin@retailit.lk',
      phone: '0770000000',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
    },
  })
  console.log('✓ Super Admin seeded')

  // Manager
  const managerPassword = await bcrypt.hash('manager123', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@retailit.lk' },
    update: {},
    create: {
      name: 'Savio Manager',
      email: 'manager@retailit.lk',
      phone: '0771111111',
      password: managerPassword,
      role: Role.MANAGER,
    },
  })
  console.log('✓ Manager seeded')

  // Dealers
  const dealerData = [
    {
      name: 'TechPoint Solutions',
      contactPerson: 'Ashan Fernando',
      phone: '0771234567',
      email: 'techpoint@dealer.lk',
      address: 'No. 45, Galle Road, Colombo 03',
      businessRegNo: 'BP-2021-001',
      userEmail: 'dealer1@retailit.lk',
      userName: 'Ashan Fernando',
    },
    {
      name: 'DigiMart Lanka',
      contactPerson: 'Nishani Perera',
      phone: '0772345678',
      email: 'digimart@dealer.lk',
      address: 'No. 12, Kandy Road, Kegalle',
      businessRegNo: 'BP-2021-002',
      userEmail: 'dealer2@retailit.lk',
      userName: 'Nishani Perera',
    },
    {
      name: 'NetRetail PVT Ltd',
      contactPerson: 'Chamara Silva',
      phone: '0773456789',
      email: 'netretail@dealer.lk',
      address: 'No. 78, Main Street, Kurunegala',
      businessRegNo: 'BP-2022-003',
      userEmail: 'dealer3@retailit.lk',
      userName: 'Chamara Silva',
    },
    {
      name: 'SmartPOS Colombo',
      contactPerson: 'Dilanka Jayawardena',
      phone: '0774567890',
      email: 'smartpos@dealer.lk',
      address: 'No. 33, Union Place, Colombo 02',
      businessRegNo: 'BP-2022-004',
      userEmail: 'dealer4@retailit.lk',
      userName: 'Dilanka Jayawardena',
    },
  ]

  const dealerPassword = await bcrypt.hash('dealer123', 10)

  for (const d of dealerData) {
    const dealer = await prisma.dealer.upsert({
      where: { businessRegNo: d.businessRegNo },
      update: {},
      create: {
        name: d.name,
        contactPerson: d.contactPerson,
        phone: d.phone,
        phone2: null,
        operationalContactPerson: d.contactPerson,
        operationalContactNumber: d.phone,
        email: d.email,
        address: d.address,
        mainCity: 'Colombo',
        district: 'Colombo',
        businessRegNo: d.businessRegNo,
        bankGuaranteeValue: 1000000,
        bankGuaranteeUsed: 0,
        status: DealerStatus.ACTIVE,
        managerId: manager.id,
      },
    })

    await prisma.user.upsert({
      where: { email: d.userEmail },
      update: {},
      create: {
        name: d.userName,
        email: d.userEmail,
        password: dealerPassword,
        role: Role.DEALER,
        dealerId: dealer.id,
      },
    })

    // Stock for each dealer
    for (const product of products) {
      await prisma.stock.upsert({
        where: { dealerId_productId: { dealerId: dealer.id, productId: product.id } },
        update: {},
        create: { dealerId: dealer.id, productId: product.id, quantity: Math.floor(Math.random() * 10) + 2 },
      })
    }

    // Sample approved order (first order — bank guarantee)
    const existingOrder = await prisma.order.findFirst({ where: { dealerId: dealer.id } })
    if (!existingOrder) {
      const order = await prisma.order.create({
        data: {
          dealerId: dealer.id,
          status: OrderStatus.COMPLETED,
          paymentStatus: PaymentStatus.WAIVED,
          deliveryAddress: d.address,
          notes: 'Initial stock order',
          lines: {
            create: [
              { productId: posDevice.id, quantity: 2, unitPrice: posDevice.dealerPrice },
              { productId: thermalPrinter.id, quantity: 3, unitPrice: thermalPrinter.dealerPrice },
              { productId: posSoftware.id, quantity: 2, unitPrice: posSoftware.dealerPrice },
            ],
          },
        },
      })

      // Update bank guarantee used
      const orderTotal = 2 * posDevice.dealerPrice + 3 * thermalPrinter.dealerPrice + 2 * posSoftware.dealerPrice
      await prisma.dealer.update({
        where: { id: dealer.id },
        data: { bankGuaranteeUsed: { increment: orderTotal } },
      })
    }

    // Sample pending order
    const pendingOrder = await prisma.order.findFirst({ where: { dealerId: dealer.id, status: OrderStatus.PENDING_REVIEW } })
    if (!pendingOrder) {
      await prisma.order.create({
        data: {
          dealerId: dealer.id,
          status: OrderStatus.PENDING_REVIEW,
          paymentStatus: PaymentStatus.PENDING,
          deliveryAddress: d.address,
          notes: 'Restock order',
          lines: {
            create: [
              { productId: barcodeScanner.id, quantity: 5, unitPrice: barcodeScanner.dealerPrice },
              { productId: ecrModel.id, quantity: 2, unitPrice: ecrModel.dealerPrice },
            ],
          },
        },
      })
    }
  }

  console.log('✓ Dealers, users, stock, and sample orders seeded')
  console.log('\nLogin credentials:')
  console.log('  Manager: manager@retailit.lk / manager123')
  console.log('  Dealer 1: dealer1@retailit.lk / dealer123')
  console.log('  Dealer 2: dealer2@retailit.lk / dealer123')
  console.log('  Dealer 3: dealer3@retailit.lk / dealer123')
  console.log('  Dealer 4: dealer4@retailit.lk / dealer123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
