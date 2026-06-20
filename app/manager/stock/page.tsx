import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { dealerScope } from '@/lib/access'

export default async function DealerStockOverviewPage() {
  const session = (await auth())!

  const dealers = await prisma.dealer.findMany({
    where: dealerScope(session),
    include: {
      stocks: { include: { product: true }, orderBy: { product: { name: 'asc' } } },
    },
    orderBy: { name: 'asc' },
  })

  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dealer Stock Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Stock levels across all dealers</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dealer</th>
              {products.map((p) => (
                <th key={p.id} className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dealers.map((dealer) => {
              const stockMap = Object.fromEntries(dealer.stocks.map((s) => [s.productId, s.quantity]))
              return (
                <tr key={dealer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{dealer.name}</td>
                  {products.map((p) => {
                    const qty = stockMap[p.id] ?? 0
                    return (
                      <td key={p.id} className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                          qty < 3 ? 'bg-red-100 text-red-700' : qty < 6 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {qty}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-400" /> Low (&lt;3)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-amber-400" /> Medium (3–5)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-green-400" /> Good (6+)</span>
      </div>
    </div>
  )
}
