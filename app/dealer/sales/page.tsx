import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import DailySalesForm from './DailySalesForm'

export default async function DailySalesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const session = await auth()
  const dealerId = session!.user.dealerId!

  const { date: dateParam } = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const selectedDate = dateParam || today

  const [products, stocks, existingLog] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
    prisma.stock.findMany({ where: { dealerId }, include: { product: true } }),
    prisma.salesLog.findFirst({
      where: {
        dealerId,
        date: { gte: new Date(selectedDate), lt: new Date(new Date(selectedDate).getTime() + 86400000) },
      },
      include: { lines: { include: { product: true } } },
    }),
  ])

  const stockMap = Object.fromEntries(stocks.map((s) => [s.productId, s.quantity]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Sales</h1>
        <p className="text-sm text-gray-500 mt-0.5">Log sales and auto-deduct from stock</p>
      </div>

      <DailySalesForm
        products={products}
        stockMap={stockMap}
        dealerId={dealerId}
        selectedDate={selectedDate}
        existingLog={existingLog}
      />
    </div>
  )
}
