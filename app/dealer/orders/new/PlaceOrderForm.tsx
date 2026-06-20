'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VAT_RATE, vatAmount, withVat } from '@/lib/products'

interface Product {
  id: string
  name: string
  dealerPrice: number
  sellingPrice: number
  category: string
}

interface OrderLine {
  productId: string
  quantity: number
  unitPrice: number
}

interface Props {
  products: Product[]
  dealerAddress: string
  dealerId: string
}

function formatLKR(v: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(v)
}

const VAT_PCT = Math.round(VAT_RATE * 100)

const DASH = '—'

export default function PlaceOrderForm({ products, dealerAddress, dealerId }: Props) {
  const router = useRouter()
  const [lines, setLines] = useState<OrderLine[]>([{ productId: '', quantity: 1, unitPrice: 0 }])
  const [deliveryAddress, setDeliveryAddress] = useState(dealerAddress)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function addLine() {
    setLines([...lines, { productId: '', quantity: 1, unitPrice: 0 }])
  }

  function removeLine(i: number) {
    setLines(lines.filter((_, idx) => idx !== i))
  }

  // Dealer chooses product + quantity only; unit price comes from the product (manager-set).
  function selectProduct(i: number, productId: string) {
    setLines(lines.map((l, idx) => {
      if (idx !== i) return l
      const product = products.find((p) => p.id === productId)
      return { ...l, productId, unitPrice: product?.dealerPrice ?? 0 }
    }))
  }

  function setQuantity(i: number, value: string) {
    setLines(lines.map((l, idx) => (idx === i ? { ...l, quantity: parseInt(value) || 1 } : l)))
  }

  const totalEx = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const totalVat = vatAmount(totalEx)
  const totalInc = withVat(totalEx)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (lines.some((l) => !l.productId || l.quantity < 1)) {
      setError('Please fill all order lines correctly.')
      return
    }
    if (!deliveryAddress.trim()) {
      setError('Delivery address is required.')
      return
    }
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/dealer/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealerId, lines, deliveryAddress, notes }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to place order.')
      setSubmitting(false)
      return
    }

    router.push('/dealer/orders')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Lines */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Order Lines</h2>
        <p className="text-xs text-gray-400 mb-3">Prices are dealer prices, Ex VAT. VAT ({VAT_PCT}%) is added automatically.</p>

        <div className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: 920 }}>
            <thead>
              <tr className="text-xs font-medium text-gray-500 text-center">
                <th rowSpan={2} className="text-left align-bottom pb-2 pr-3 min-w-[220px]">Product</th>
                <th rowSpan={2} className="align-bottom pb-2 px-2 w-16">Qty</th>
                <th colSpan={3} className="py-1.5 bg-sky-50 text-sky-800 rounded-t-md">Dealer</th>
                <th colSpan={3} className="py-1.5 bg-amber-50 text-amber-800 rounded-t-md">Selling / Customer</th>
                <th rowSpan={2} className="align-bottom pb-2 px-2 bg-green-50 text-green-800">Margin<br />Ex VAT</th>
                <th rowSpan={2} className="w-8"></th>
              </tr>
              <tr className="text-[11px] font-normal text-gray-400 text-right">
                <th className="py-1 px-3 bg-sky-50 font-normal">Ex VAT</th>
                <th className="py-1 px-3 bg-sky-50 font-normal">VAT {VAT_PCT}%</th>
                <th className="py-1 px-3 bg-sky-50 font-normal">Inc VAT</th>
                <th className="py-1 px-3 bg-amber-50 font-normal">Ex VAT</th>
                <th className="py-1 px-3 bg-amber-50 font-normal">VAT {VAT_PCT}%</th>
                <th className="py-1 px-3 bg-amber-50 font-normal">Inc VAT</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const p = products.find((pr) => pr.id === line.productId)
                const marginEx = p ? p.sellingPrice - p.dealerPrice : 0
                const marginPct = p && p.sellingPrice ? (marginEx / p.sellingPrice) * 100 : 0
                return (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="py-2 pr-3">
                      <select
                        value={line.productId}
                        onChange={(e) => selectProduct(i, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        required
                      >
                        <option value="">Select product…</option>
                        {products.map((pr) => (
                          <option key={pr.id} value={pr.id}>{pr.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number" min={1} value={line.quantity}
                        onChange={(e) => setQuantity(i, e.target.value)}
                        className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </td>
                    <td className="py-2 px-3 text-right bg-sky-50/40 text-gray-800 whitespace-nowrap">{p ? formatLKR(p.dealerPrice) : DASH}</td>
                    <td className="py-2 px-3 text-right bg-sky-50/40 text-gray-500 whitespace-nowrap">{p ? formatLKR(vatAmount(p.dealerPrice)) : DASH}</td>
                    <td className="py-2 px-3 text-right bg-sky-50/40 font-medium text-gray-800 whitespace-nowrap">{p ? formatLKR(withVat(p.dealerPrice)) : DASH}</td>
                    <td className="py-2 px-3 text-right bg-amber-50/40 text-gray-800 whitespace-nowrap">{p ? formatLKR(p.sellingPrice) : DASH}</td>
                    <td className="py-2 px-3 text-right bg-amber-50/40 text-gray-500 whitespace-nowrap">{p ? formatLKR(vatAmount(p.sellingPrice)) : DASH}</td>
                    <td className="py-2 px-3 text-right bg-amber-50/40 font-medium text-gray-800 whitespace-nowrap">{p ? formatLKR(withVat(p.sellingPrice)) : DASH}</td>
                    <td className="py-2 px-3 text-right bg-green-50/50 text-green-700 font-medium whitespace-nowrap">
                      {p ? (
                        <>
                          {formatLKR(marginEx)}
                          <span className="block text-[11px]">{marginPct.toFixed(1)}%</span>
                        </>
                      ) : DASH}
                    </td>
                    <td className="py-2 text-right">
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none"
                          aria-label="Remove line"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addLine}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add line
        </button>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal (dealer, Ex VAT)</span>
              <span>{formatLKR(totalEx)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>VAT ({VAT_PCT}%)</span>
              <span>{formatLKR(totalVat)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
              <span>Total (Inc VAT)</span>
              <span className="text-blue-700">{formatLKR(totalInc)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery & Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Delivery Details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit for Approval'}
        </button>
      </div>
    </form>
  )
}
