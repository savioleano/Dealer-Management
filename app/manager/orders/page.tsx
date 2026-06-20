import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '@/lib/orders'
import { dealerRelationScope } from '@/lib/access'

function formatLKR(v: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(v)
}

export default async function OrderQueuePage() {
  const session = await auth()

  const orders = await prisma.order.findMany({
    where: dealerRelationScope(session!),
    include: { dealer: true, lines: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // Orders needing a manager action: reviews and payment approvals.
  const actionable = orders.filter(
    (o) => o.status === 'PENDING_REVIEW' || o.status === 'PENDING_PAYMENT_APPROVAL'
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Order Queue</h1>

      {actionable.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">
            Needs your action ({actionable.length})
          </h2>
          <div className="space-y-3">
            {actionable.map((order) => {
              const total = order.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
              const cta = order.status === 'PENDING_REVIEW' ? 'Review →' : 'Approve payment →'
              return (
                <Link
                  key={order.id}
                  href={`/manager/orders/${order.id}`}
                  className="block bg-white border border-amber-200 rounded-xl p-4 hover:border-amber-400 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{order.dealer.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        #{order.id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString('en-GB')} · {order.lines.length} item(s)
                      </p>
                      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{formatLKR(total)}</p>
                      <p className="text-xs text-blue-600 mt-0.5">{cta}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">All Orders</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dealer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const total = order.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">#{order.id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{order.dealer.name}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{formatLKR(total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_STATUS_COLORS[order.paymentStatus]}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/manager/orders/${order.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
