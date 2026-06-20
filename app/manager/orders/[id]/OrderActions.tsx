'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  order: {
    id: string
    status: string
    paymentStatus: string
  }
}

export default function OrderActions({ order }: Props) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function updateOrder(action: string) {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/manager/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Action failed')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  const s = order.status
  const showNote = ['PENDING_REVIEW', 'PENDING_PAYMENT_APPROVAL', 'PREPARING'].includes(s)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="font-semibold text-gray-800">Actions</h2>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {showNote && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Manager Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Add a note…"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {s === 'PENDING_REVIEW' && (
          <>
            <button onClick={() => updateOrder('approve')} disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
              Approve Review
            </button>
            <button onClick={() => updateOrder('reject')} disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
              Reject
            </button>
          </>
        )}

        {s === 'PENDING_PAYMENT_APPROVAL' && (
          <>
            <button onClick={() => updateOrder('approve-payment')} disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
              Approve Payment
            </button>
            <button onClick={() => updateOrder('reject-payment')} disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
              Reject Payment
            </button>
          </>
        )}

        {s === 'PREPARING' && (
          <button onClick={() => updateOrder('dispatch')} disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
            Mark as Dispatched
          </button>
        )}
      </div>

      {s === 'PENDING_PAYMENT_CONFIRMATION' && (
        <p className="text-sm text-orange-600">Awaiting payment details from the dealer.</p>
      )}
      {s === 'DISPATCHED' && (
        <p className="text-sm text-purple-600">Dispatched — awaiting the dealer to confirm receipt.</p>
      )}
      {s === 'COMPLETED' && (
        <p className="text-sm text-green-600 font-medium">✓ Order completed — received by the dealer.</p>
      )}
      {s === 'DRAFT' && (
        <p className="text-sm text-gray-400">This order was rejected / is in draft state.</p>
      )}
    </div>
  )
}
