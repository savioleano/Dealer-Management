import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { dealerScope, dealerRelationScope } from '@/lib/access'

function formatLKR(v: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(v)
}

export default async function SalesReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ dealerId?: string; from?: string; to?: string }>
}) {
  const session = (await auth())!
  const { dealerId, from, to } = await searchParams

  const dealers = await prisma.dealer.findMany({
    where: dealerScope(session),
    orderBy: { name: 'asc' },
  })

  const dateFrom = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const dateTo = to ? new Date(to) : new Date()

  const salesLogs = await prisma.salesLog.findMany({
    where: {
      ...dealerRelationScope(session),
      ...(dealerId ? { dealerId } : {}),
      date: { gte: dateFrom, lte: dateTo },
    },
    include: {
      dealer: true,
      lines: { include: { product: true } },
    },
    orderBy: { date: 'desc' },
  })

  // Aggregate by dealer
  const dealerTotals: Record<string, { name: string; total: number; logs: number }> = {}
  const productTotals: Record<string, { name: string; units: number; revenue: number }> = {}

  for (const log of salesLogs) {
    if (!dealerTotals[log.dealerId]) {
      dealerTotals[log.dealerId] = { name: log.dealer.name, total: 0, logs: 0 }
    }
    dealerTotals[log.dealerId].logs += 1

    for (const line of log.lines) {
      const lineTotal = line.unitsSold * line.sellingPrice
      dealerTotals[log.dealerId].total += lineTotal

      if (!productTotals[line.productId]) {
        productTotals[line.productId] = { name: line.product.name, units: 0, revenue: 0 }
      }
      productTotals[line.productId].units += line.unitsSold
      productTotals[line.productId].revenue += lineTotal
    }
  }

  const grandTotal = Object.values(dealerTotals).reduce((s, d) => s + d.total, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Dealer</label>
          <select
            name="dealerId"
            defaultValue={dealerId ?? ''}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="">All Dealers</option>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From</label>
          <input
            type="date"
            name="from"
            defaultValue={dateFrom.toISOString().split('T')[0]}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To</label>
          <input
            type="date"
            name="to"
            defaultValue={dateTo.toISOString().split('T')[0]}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-800 transition-colors"
        >
          Apply
        </button>
      </form>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Dealer */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">By Dealer</h2>
          {Object.keys(dealerTotals).length === 0 ? (
            <p className="text-sm text-gray-400">No sales in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-xs text-gray-500">Dealer</th>
                  <th className="text-center pb-2 text-xs text-gray-500">Logs</th>
                  <th className="text-right pb-2 text-xs text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(dealerTotals).map((d, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-800 font-medium">{d.name}</td>
                    <td className="py-2 text-center text-gray-500">{d.logs}</td>
                    <td className="py-2 text-right font-medium text-gray-800">{formatLKR(d.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="pt-3 font-semibold text-gray-800">Grand Total</td>
                  <td className="pt-3 text-right font-bold text-blue-700">{formatLKR(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* By Product */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">By Product</h2>
          {Object.keys(productTotals).length === 0 ? (
            <p className="text-sm text-gray-400">No sales in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-xs text-gray-500">Product</th>
                  <th className="text-center pb-2 text-xs text-gray-500">Units</th>
                  <th className="text-right pb-2 text-xs text-gray-500">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(productTotals).map((p, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-800 font-medium">{p.name}</td>
                    <td className="py-2 text-center text-gray-500">{p.units}</td>
                    <td className="py-2 text-right font-medium text-gray-800">{formatLKR(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sales log table */}
      {salesLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Sales Log Entries</h2>
          <div className="space-y-4">
            {salesLogs.map((log) => (
              <div key={log.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-medium text-gray-800">{log.dealer.name}</p>
                    <p className="text-xs text-gray-400">{new Date(log.date).toLocaleDateString('en-GB')}</p>
                  </div>
                  <p className="font-semibold text-gray-800">
                    {formatLKR(log.lines.reduce((s, l) => s + l.unitsSold * l.sellingPrice, 0))}
                  </p>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {log.lines.map((line) => (
                      <tr key={line.id} className="border-t border-gray-50">
                        <td className="py-1 text-gray-600">{line.product.name}</td>
                        <td className="py-1 text-center text-gray-500">{line.unitsSold} units</td>
                        <td className="py-1 text-right text-gray-600">@ {formatLKR(line.sellingPrice)}</td>
                        <td className="py-1 text-right font-medium text-gray-800">{formatLKR(line.unitsSold * line.sellingPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
