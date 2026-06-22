'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteManagerButton({ id, name, dealerCount }: { id: string; name: string; dealerCount: number }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (dealerCount > 0) {
      alert(`"${name}" has ${dealerCount} dealer(s) assigned. Reassign or remove those dealers before deleting this manager.`)
      return
    }
    if (!window.confirm(`Delete manager "${name}"? This cannot be undone.`)) return
    setBusy(true)
    const res = await fetch(`/api/admin/managers/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Failed to delete manager.')
      setBusy(false)
      return
    }
    router.refresh()
  }

  return (
    <button onClick={handleDelete} disabled={busy} className="text-xs text-red-600 hover:underline disabled:opacity-50">
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  )
}
