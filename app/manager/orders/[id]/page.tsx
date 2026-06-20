import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import OrderActions from './OrderActions'
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYMENT_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/lib/orders'
import { dealerRelationScope } from '@/lib/access'

function formatLKR(v: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(v)
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  const order = await prisma.order.findFirst({
    where: { id, ...dealerRelationScope(session!) },
    include: {
      dealer: { include: { manager: { select: { name: true } } } },
      lines: { include: { product: true } },
    },
  })

  if (!order) notFound()

  const total = order.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{order.dealer.name} · {new Date(order.createdAt).toLocaleDateString('en-GB')}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} />
        </div>
      </div>

      {/* Dealer Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Dealer Information</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Dealer" value={order.dealer.name} />
          <Field label="Contact" value={order.dealer.contactPerson} />
          <Field label="Phone" value={order.dealer.phone} />
          <Field label="Email" value={order.dealer.email} />
          <Field label="Delivery Address" value={order.deliveryAddress} />
          {order.notes && <Field label="Notes" value={order.notes} />}
          {order.managerNote && <Field label="Manager Note" value={order.managerNote} />}
        </div>
      </div>

      {/* Payment Details (once the dealer has submitted) */}
      {order.paymentSubmittedAt && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Payment Details</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Method" value={order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : '—'} />
            <Field label="Payment Date" value={order.paymentDate ? new Date(order.paymentDate).toLocaleDateString('en-GB') : '—'} />
            <Field label="Reference" value={order.paymentReference ?? '—'} />
            <Field label="Submitted" value={new Date(order.paymentSubmittedAt).toLocaleString('en-GB')} />
          </div>
          {order.paymentSlipUrl && (
            <a href={order.paymentSlipUrl} target="_blank" rel="noopener noreferrer"
              className="inline-block mt-4 text-sm text-blue-600 hover:underline">
              View payment slip →
            </a>
          )}
        </div>
      )}

      {/* Order Lines */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Order Lines</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pb-3 text-xs text-gray-500 font-medium">Product</th>
              <th className="text-center pb-3 text-xs text-gray-500 font-medium">Qty</th>
              <th className="text-right pb-3 text-xs text-gray-500 font-medium">Unit Price</th>
              <th className="text-right pb-3 text-xs text-gray-500 font-medium">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.id} className="border-b border-gray-50">
                <td className="py-3 text-gray-800">{line.product.name}</td>
                <td className="py-3 text-center text-gray-600">{line.quantity}</td>
                <td className="py-3 text-right text-gray-600">{formatLKR(line.unitPrice)}</td>
                <td className="py-3 text-right font-medium text-gray-800">{formatLKR(line.quantity * line.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-4 text-right font-semibold text-gray-800">Total</td>
              <td className="pt-4 text-right font-bold text-blue-700 text-base">{formatLKR(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <OrderActions order={{ id: order.id, status: order.status, paymentStatus: order.paymentStatus }} />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${ORDER_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${PAYMENT_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
