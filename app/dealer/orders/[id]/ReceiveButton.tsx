'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReceiveButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markReceived() {
    if (!window.confirm('Confirm you have received this order?')) return
    setLoading(true)
    const res = await fetch(`/api/dealer/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'receive' }),
    })
    if (res.ok) router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={markReceived}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm whitespace-nowrap transition-colors"
    >
      {loading ? 'Saving…' : 'Mark as Received'}
    </button>
  )
}
