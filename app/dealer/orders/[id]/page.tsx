import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PaymentForm from './PaymentForm'
import ReceiveButton from './ReceiveButton'
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/orders'

function formatLKR(v: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(v)
}

export default async function DealerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  const order = await prisma.order.findFirst({
    where: { id, dealerId: session!.user.dealerId ?? undefined },
    include: { lines: { include: { product: true } } },
  })

  if (!order) notFound()

  const total = order.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dealer/orders" className="text-xs text-blue-600 hover:underline">← My Orders</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Order #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-GB')}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${PAYMENT_STATUS_COLORS[order.paymentStatus]}`}>
            {order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Step prompts based on status */}
      {order.status === 'PENDING_REVIEW' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Your order has been submitted and is awaiting manager review.
        </div>
      )}
      {order.status === 'PENDING_PAYMENT_CONFIRMATION' && (
        <PaymentForm orderId={order.id} />
      )}
      {order.status === 'PENDING_PAYMENT_APPROVAL' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Payment details submitted. Awaiting the manager to approve your payment.
        </div>
      )}
      {order.status === 'PREPARING' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          Payment approved — your order is being prepared.
        </div>
      )}
      {order.status === 'DISPATCHED' && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-purple-800">Your order has been dispatched. Mark it received once it arrives.</p>
          <ReceiveButton orderId={order.id} />
        </div>
      )}
      {order.status === 'COMPLETED' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 font-medium">
          ✓ Order completed — thank you.
        </div>
      )}
      {order.status === 'DRAFT' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          This order was rejected by the manager.{order.managerNote ? ` Note: ${order.managerNote}` : ''}
        </div>
      )}

      {/* Submitted payment details */}
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

      {/* Order lines */}
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
              <td colSpan={3} className="pt-4 text-right font-semibold text-gray-800">Total (Ex VAT)</td>
              <td className="pt-4 text-right font-bold text-blue-700 text-base">{formatLKR(total)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="text-xs text-gray-400 mt-2">Delivery to: {order.deliveryAddress}</p>
      </div>
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
