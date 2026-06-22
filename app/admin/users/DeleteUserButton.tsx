'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteUserButton({ id, name, role, dealerCount }: {
  id: string; name: string; role: string; dealerCount: number
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (role === 'MANAGER' && dealerCount > 0) {
      alert(`"${name}" has ${dealerCount} dealer(s) assigned. Reassign or remove those dealers before deleting this manager.`)
      return
    }
    if (!window.confirm(`Delete ${role === 'ADMIN' ? 'admin' : 'manager'} "${name}"? This cannot be undone.`)) return
    setBusy(true)
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Failed to delete user.')
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
