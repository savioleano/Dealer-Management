import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { dealerScope, dealerRelationScope } from '@/lib/access'

function formatLKR(v: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(v)
}

export default async function ManagerDashboard() {
  const session = (await auth())!

  const [dealers, pendingOrders, salesLogs] = await Promise.all([
    prisma.dealer.findMany({
      where: dealerScope(session),
      include: {
        orders: { include: { lines: true } },
        stocks: { include: { product: true } },
      },
    }),
    prisma.order.findMany({
      where: {
        status: { in: ['PENDING_REVIEW', 'PENDING_PAYMENT_APPROVAL'] },
        ...dealerRelationScope(session),
      },
      include: { dealer: true, lines: true },
    }),
    prisma.salesLog.findMany({
      where: {
        ...dealerRelationScope(session),
        date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      include: { lines: true },
    }),
  ])

  const monthlySales = salesLogs.reduce(
    (sum, log) => sum + log.lines.reduce((s, l) => s + l.unitsSold * l.sellingPrice, 0),
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Overview of all dealers</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Dealers" value={dealers.length} />
        <StatCard label="Pending Orders" value={pendingOrders.length} highlight={pendingOrders.length > 0} href="/manager/orders" />
        <StatCard label="Monthly Sales" value={formatLKR(monthlySales)} />
      </div>

      {/* Dealer cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {dealers.map((dealer) => {
          const pending = dealer.orders.filter((o) =>
            ['PENDING_REVIEW', 'PENDING_PAYMENT_APPROVAL'].includes(o.status)
          ).length
          const totalOrders = dealer.orders.length
          const guaranteePercent = Math.min((dealer.bankGuaranteeUsed / dealer.bankGuaranteeValue) * 100, 100)
          const lowStock = dealer.stocks.filter((s) => s.quantity < 3).length

          return (
            <div key={dealer.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-800">{dealer.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{dealer.contactPerson} · {dealer.phone}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  dealer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>{dealer.status}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <MiniStat label="Orders" value={totalOrders} />
                <MiniStat label="Pending" value={pending} alert={pending > 0} />
                <MiniStat label="Low Stock" value={lowStock} alert={lowStock > 0} />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Bank Guarantee</span>
                  <span>{guaranteePercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${guaranteePercent >= 90 ? 'bg-red-500' : guaranteePercent >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${guaranteePercent}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pending orders quick list */}
      {pendingOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Pending Approval</h2>
            <Link href="/manager/orders" className="text-sm text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {pendingOrders.slice(0, 5).map((order) => {
              const total = order.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
              return (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{order.dealer.name}</p>
                    <p className="text-xs text-gray-400">#{order.id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{formatLKR(total)}</p>
                    <Link href={`/manager/orders/${order.id}`} className="text-xs text-blue-600 hover:underline">Review →</Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, highlight, href }: { label: string; value: string | number; highlight?: boolean; href?: string }) {
  const content = (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function MiniStat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${alert ? 'text-amber-600' : 'text-gray-800'}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}
