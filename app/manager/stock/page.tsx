import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { dealerScope } from '@/lib/access'
import StockEditor from './StockEditor'

export default async function DealerStockOverviewPage() {
  const session = (await auth())!

  const dealers = await prisma.dealer.findMany({
    where: dealerScope(session),
    include: { stocks: { select: { productId: true, quantity: true } } },
    orderBy: { name: 'asc' },
  })

  const products = await prisma.product.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dealer Stock Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Edit stock levels and save</p>
      </div>

      <StockEditor
        dealers={dealers.map((d) => ({ id: d.id, name: d.name, stocks: d.stocks }))}
        products={products}
      />
    </div>
  )
}
