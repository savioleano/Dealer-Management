'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
}
interface Dealer {
  id: string
  name: string
  stocks: { productId: string; quantity: number }[]
}

function key(dealerId: string, productId: string) {
  return `${dealerId}:${productId}`
}

function cellColor(qty: number) {
  if (qty < 3) return 'border-red-300 bg-red-50 text-red-700'
  if (qty < 6) return 'border-amber-300 bg-amber-50 text-amber-700'
  return 'border-green-300 bg-green-50 text-green-700'
}

export default function StockEditor({ dealers, products }: { dealers: Dealer[]; products: Product[] }) {
  const router = useRouter()

  const initial: Record<string, number> = {}
  for (const d of dealers) {
    const map = Object.fromEntries(d.stocks.map((s) => [s.productId, s.quantity]))
    for (const p of products) initial[key(d.id, p.id)] = map[p.id] ?? 0
  }

  const [values, setValues] = useState<Record<string, number>>(initial)
  const [baseline, setBaseline] = useState<Record<string, number>>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const dirtyKeys = Object.keys(values).filter((k) => values[k] !== baseline[k])
  const dirty = dirtyKeys.length > 0

  function setVal(dealerId: string, productId: string, raw: string) {
    const n = Math.max(0, Math.floor(Number(raw) || 0))
    setValues((v) => ({ ...v, [key(dealerId, productId)]: n }))
    setSuccess('')
  }

  async function save() {
    setSaving(true)
    setError('')
    setSuccess('')
    const updates = dirtyKeys.map((k) => {
      const [dealerId, productId] = k.split(':')
      return { dealerId, productId, quantity: values[k] }
    })
    const res = await fetch('/api/manager/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save stock.')
      setSaving(false)
      return
    }
    setBaseline({ ...values })
    setSuccess(`Saved ${updates.length} change${updates.length === 1 ? '' : 's'}.`)
    router.refresh()
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dealer</th>
              {products.map((p) => (
                <th key={p.id} className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dealers.map((dealer) => (
              <tr key={dealer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{dealer.name}</td>
                {products.map((p) => {
                  const qty = values[key(dealer.id, p.id)] ?? 0
                  return (
                    <td key={p.id} className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(e) => setVal(dealer.id, p.id, e.target.value)}
                        className={`w-16 text-center rounded-lg border px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 ${cellColor(qty)}`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-400" /> Low (&lt;3)</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-amber-400" /> Medium (3–5)</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-green-400" /> Good (6+)</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {error && <span className="text-sm text-red-600">{error}</span>}
          {success && <span className="text-sm text-green-700">{success}</span>}
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Saving…' : dirty ? `Save changes (${dirtyKeys.length})` : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
