import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export default async function MyStockPage() {
  const session = await auth()
  const dealerId = session!.user.dealerId!

  const stocks = await prisma.stock.findMany({
    where: { dealerId },
    include: { product: true },
    orderBy: { product: { name: 'asc' } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Stock</h1>
        <p className="text-sm text-gray-500 mt-0.5">Current inventory levels</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stocks.map((s) => (
          <div
            key={s.id}
            className={`bg-white rounded-xl border p-5 ${
              s.quantity < 3 ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-800">{s.product.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.product.category}</p>
              </div>
              {s.quantity < 3 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Low Stock</span>
              )}
            </div>
            <div className="mt-4">
              <p className={`text-3xl font-bold ${s.quantity < 3 ? 'text-red-600' : 'text-gray-900'}`}>
                {s.quantity}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">units in stock</p>
            </div>
          </div>
        ))}
      </div>

      {stocks.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No stock records found.
        </div>
      )}
    </div>
  )
}
