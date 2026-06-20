import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/orders'

function formatLKR(value: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(value)
}

export default async function DealerDashboard() {
  const session = await auth()
  const dealerId = session!.user.dealerId!

  const [dealer, orders, stocks, salesLogs] = await Promise.all([
    prisma.dealer.findUnique({
      where: { id: dealerId },
      include: { manager: { select: { name: true } } },
    }),
    prisma.order.findMany({
      where: { dealerId },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stock.findMany({
      where: { dealerId },
      include: { product: true },
    }),
    prisma.salesLog.findMany({
      where: {
        dealerId,
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      include: { lines: true },
    }),
  ])

  const pendingOrders = orders.filter((o) =>
    ['PENDING_REVIEW', 'PENDING_PAYMENT_CONFIRMATION', 'PENDING_PAYMENT_APPROVAL'].includes(o.status)
  )
  const activeOrders = orders.filter((o) => !['COMPLETED', 'DRAFT'].includes(o.status))
  const guaranteePercent = dealer
    ? Math.min((dealer.bankGuaranteeUsed / dealer.bankGuaranteeValue) * 100, 100)
    : 0

  const monthlySalesTotal = salesLogs.reduce(
    (sum, log) => sum + log.lines.reduce((s, l) => s + l.unitsSold * l.sellingPrice, 0),
    0
  )

  const lowStock = stocks.filter((s) => s.quantity < 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Welcome back, {session!.user.name}</p>
      </div>

      {/* Bank Guarantee */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-600">Bank Guarantee Utilization</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatLKR(dealer?.bankGuaranteeUsed ?? 0)} of {formatLKR(dealer?.bankGuaranteeValue ?? 1000000)}
            </p>
          </div>
          <span
            className={`text-sm font-semibold ${guaranteePercent >= 90 ? 'text-red-600' : guaranteePercent >= 70 ? 'text-amber-600' : 'text-green-600'}`}
          >
            {guaranteePercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${guaranteePercent >= 90 ? 'bg-red-500' : guaranteePercent >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ width: `${guaranteePercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={orders.length} />
        <StatCard label="Pending Approval" value={pendingOrders.length} highlight={pendingOrders.length > 0} />
        <StatCard label="Active Orders" value={activeOrders.length} />
        <StatCard label="Monthly Sales" value={formatLKR(monthlySalesTotal)} />
      </div>

      {/* Stock Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Stock Summary</h2>
          <Link href="/dealer/stock" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        <div className="space-y-2">
          {stocks.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{s.product.name}</span>
              <span
                className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                  s.quantity < 3 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {s.quantity} units
              </span>
            </div>
          ))}
        </div>
        {lowStock.length > 0 && (
          <p className="mt-3 text-xs text-red-600">⚠ {lowStock.length} product(s) running low on stock</p>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Recent Orders</h2>
          <Link href="/dealer/orders" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">#{order.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={order.status} />
                  <PaymentBadge status={order.paymentStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-red-100 text-red-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    WAIVED: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
