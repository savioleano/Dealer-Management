'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RefreshButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <button
      onClick={() => {
        setBusy(true)
        router.refresh()
        setTimeout(() => setBusy(false), 600)
      }}
      disabled={busy}
      className="text-sm border border-gray-300 hover:bg-gray-100 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
    >
      {busy ? 'Refreshing…' : '↻ Refresh'}
    </button>
  )
}
