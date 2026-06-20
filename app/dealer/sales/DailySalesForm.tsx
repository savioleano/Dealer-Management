'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product { id: string; name: string; sellingPrice: number }
interface SalesLine { productId: string; unitsSold: number; sellingPrice: number }
interface ExistingLog {
  id: string
  lines: { product: { name: string }; unitsSold: number; sellingPrice: number }[]
}

interface Props {
  products: Product[]
  stockMap: Record<string, number>
  dealerId: string
  selectedDate: string
  existingLog: ExistingLog | null
}

function formatLKR(v: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(v)
}

export default function DailySalesForm({ products, stockMap, dealerId, selectedDate, existingLog }: Props) {
  const router = useRouter()
  const [date, setDate] = useState(selectedDate)
  const [lines, setLines] = useState<SalesLine[]>(
    products.map((p) => ({ productId: p.id, unitsSold: 0, sellingPrice: p.sellingPrice }))
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function updateLine(i: number, field: keyof SalesLine, value: string) {
    setLines(lines.map((l, idx) =>
      idx !== i ? l : { ...l, [field]: parseFloat(value) || 0 }
    ))
  }

  const dailyTotal = lines.reduce((s, l) => s + l.unitsSold * l.sellingPrice, 0)
  const activelines = lines.filter((l) => l.unitsSold > 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (activelines.length === 0) {
      setError('Enter at least one sale.')
      return
    }
    for (const l of activelines) {
      const stock = stockMap[l.productId] ?? 0
      if (l.unitsSold > stock) {
        const p = products.find((p) => p.id === l.productId)
        setError(`Insufficient stock for ${p?.name}. Available: ${stock}`)
        return
      }
    }
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/dealer/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealerId, date, lines: activelines }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to save sales log.')
      setSubmitting(false)
      return
    }

    setSuccess('Sales log saved successfully!')
    router.refresh()
    setSubmitting(false)
  }

  function navigateDate(offset: number) {
    const d = new Date(date)
    d.setDate(d.getDate() + offset)
    const newDate = d.toISOString().split('T')[0]
    router.push(`/dealer/sales?date=${newDate}`)
  }

  if (existingLog) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigateDate(-1)} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">←</button>
          <input
            type="date"
            value={date}
            onChange={(e) => router.push(`/dealer/sales?date=${e.target.value}`)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button onClick={() => navigateDate(1)} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">→</button>
        </div>

        <div className="bg-white rounded-xl border border-green-200 p-5">
          <p className="text-sm font-medium text-green-700 mb-4">✓ Sales log submitted for this date</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-xs text-gray-500">Product</th>
                <th className="text-right py-2 text-xs text-gray-500">Units Sold</th>
                <th className="text-right py-2 text-xs text-gray-500">Selling Price</th>
                <th className="text-right py-2 text-xs text-gray-500">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {existingLog.lines.map((l, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">{l.product.name}</td>
                  <td className="py-2 text-right text-gray-700">{l.unitsSold}</td>
                  <td className="py-2 text-right text-gray-700">{formatLKR(l.sellingPrice)}</td>
                  <td className="py-2 text-right font-medium text-gray-800">{formatLKR(l.unitsSold * l.sellingPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-3 text-right font-semibold text-gray-800 text-sm">Daily Total</td>
                <td className="pt-3 text-right font-bold text-blue-700">
                  {formatLKR(existingLog.lines.reduce((s, l) => s + l.unitsSold * l.sellingPrice, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigateDate(-1)} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">←</button>
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); router.push(`/dealer/sales?date=${e.target.value}`) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="button" onClick={() => navigateDate(1)} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">→</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pb-3 text-xs text-gray-500 font-medium">Product</th>
              <th className="text-center pb-3 text-xs text-gray-500 font-medium">In Stock</th>
              <th className="text-center pb-3 text-xs text-gray-500 font-medium">Units Sold</th>
              <th className="text-center pb-3 text-xs text-gray-500 font-medium">Selling Price</th>
              <th className="text-right pb-3 text-xs text-gray-500 font-medium">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const product = products.find((p) => p.id === line.productId)!
              const stock = stockMap[line.productId] ?? 0
              const lineTotal = line.unitsSold * line.sellingPrice
              return (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-3 text-gray-800 font-medium">{product.name}</td>
                  <td className="py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${stock < 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {stock}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <input
                      type="number"
                      min={0}
                      max={stock}
                      value={line.unitsSold || ''}
                      onChange={(e) => updateLine(i, 'unitsSold', e.target.value)}
                      className="w-20 text-center rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-3 text-center">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.sellingPrice || ''}
                      onChange={(e) => updateLine(i, 'sellingPrice', e.target.value)}
                      className="w-28 text-center rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="py-3 text-right font-medium text-gray-700">
                    {lineTotal > 0 ? formatLKR(lineTotal) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="pt-4 text-right font-semibold text-gray-800">Daily Total</td>
              <td className="pt-4 text-right font-bold text-blue-700 text-base">{formatLKR(dailyTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2">{success}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || dailyTotal === 0}
          className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {submitting ? 'Saving…' : 'Submit Sales Log'}
        </button>
      </div>
    </form>
  )
}
