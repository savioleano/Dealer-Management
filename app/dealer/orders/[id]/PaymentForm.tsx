'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/lib/orders'

export default function PaymentForm({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [method, setMethod] = useState('')
  const [date, setDate] = useState('')
  const [reference, setReference] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!method || !date || !reference.trim() || !file) {
      setError('All fields, including the payment slip, are required.')
      return
    }
    setSubmitting(true)
    setError('')

    const fd = new FormData()
    fd.append('paymentMethod', method)
    fd.append('paymentDate', date)
    fd.append('paymentReference', reference)
    fd.append('slip', file)

    const res = await fetch(`/api/dealer/orders/${orderId}`, { method: 'POST', body: fd })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit payment details.')
      setSubmitting(false)
      return
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-orange-200 p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-800">Submit Payment Details</h2>
        <p className="text-xs text-gray-500 mt-0.5">Your order is approved. Enter your payment details and upload the slip to proceed.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="">Select method…</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Made Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Transaction / cheque / deposit reference"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Slip</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer"
            required
          />
          <p className="text-xs text-gray-400 mt-1">Image (PNG/JPG/WEBP) or PDF, up to 5 MB.</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit Payment Details'}
      </button>
    </form>
  )
}
