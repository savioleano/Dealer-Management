'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRODUCT_CATEGORIES, VAT_RATE, vatAmount, withVat } from '@/lib/products'

interface Product {
  id: string
  name: string
  category: string
  dealerPrice: number
  sellingPrice: number
}

function formatLKR(v: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(v)
}

// Dealer margin (on Ex-VAT values). % is gross margin on the selling price.
function marginValue(dealerEx: number, sellingEx: number) {
  return sellingEx - dealerEx
}
function marginPct(dealerEx: number, sellingEx: number) {
  if (!sellingEx) return 0
  return ((sellingEx - dealerEx) / sellingEx) * 100
}

function MarginCell({ dealerEx, sellingEx }: { dealerEx: number; sellingEx: number }) {
  const val = marginValue(dealerEx, sellingEx)
  const pct = marginPct(dealerEx, sellingEx)
  const color = val < 0 ? 'text-red-600' : val === 0 ? 'text-gray-500' : 'text-green-700'
  return (
    <div className={`text-right ${color}`}>
      <p className="font-medium">{formatLKR(val)}</p>
      <p className="text-[11px]">{pct.toFixed(1)}%</p>
    </div>
  )
}

const VAT_PCT = Math.round(VAT_RATE * 100)

export default function ProductsManager({ products }: { products: Product[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ name: '', category: '', dealerPrice: 0, sellingPrice: 0 })
  const [adding, setAdding] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', category: '', dealerPrice: 0, sellingPrice: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function startEdit(p: Product) {
    setEditingId(p.id)
    setDraft({ name: p.name, category: p.category, dealerPrice: p.dealerPrice, sellingPrice: p.sellingPrice })
    setError('')
  }

  async function saveEdit(id: string) {
    setBusy(true)
    setError('')
    const res = await fetch(`/api/manager/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to update product.')
      setBusy(false)
      return
    }
    setEditingId(null)
    router.refresh()
    setBusy(false)
  }

  async function deleteProduct(p: Product) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    setBusy(true)
    setError('')
    const res = await fetch(`/api/manager/products/${p.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to delete product.')
      setBusy(false)
      return
    }
    router.refresh()
    setBusy(false)
  }

  async function createProduct() {
    if (!newProduct.name || !newProduct.category) {
      setError('Name and category are required.')
      return
    }
    setBusy(true)
    setError('')
    const res = await fetch('/api/manager/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to create product.')
      setBusy(false)
      return
    }
    setAdding(false)
    setNewProduct({ name: '', category: '', dealerPrice: 0, sellingPrice: 0 })
    router.refresh()
    setBusy(false)
  }

  const priceInput = 'w-28 text-right rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none'
  const textInput = 'w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none'

  // Read-only computed cell
  const calc = 'px-3 py-3 text-right text-gray-500 whitespace-nowrap'
  const calcEdit = 'px-3 py-2 text-right text-gray-500 whitespace-nowrap text-sm'

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase bg-sky-50/60">Dealer<br/>Ex VAT</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase bg-sky-50/60">Dealer<br/>VAT {VAT_PCT}%</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase bg-sky-50/60">Dealer<br/>Inc VAT</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase bg-amber-50/60">Selling<br/>Ex VAT</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase bg-amber-50/60">Customer<br/>VAT {VAT_PCT}%</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase bg-amber-50/60">Selling<br/>Inc VAT</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Margin<br/>Ex VAT</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                {editingId === p.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={textInput} />
                    </td>
                    <td className="px-4 py-2">
                      <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={textInput}>
                        <option value="">Select…</option>
                        {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 bg-sky-50/60">
                      <input
                        type="number" min={0} step="0.01" value={draft.dealerPrice}
                        onChange={(e) => setDraft({ ...draft, dealerPrice: parseFloat(e.target.value) || 0 })}
                        className={priceInput}
                      />
                    </td>
                    <td className={`${calcEdit} bg-sky-50/60`}>{formatLKR(vatAmount(draft.dealerPrice))}</td>
                    <td className={`${calcEdit} bg-sky-50/60 font-medium text-gray-700`}>{formatLKR(withVat(draft.dealerPrice))}</td>
                    <td className="px-3 py-2 bg-amber-50/60">
                      <input
                        type="number" min={0} step="0.01" value={draft.sellingPrice}
                        onChange={(e) => setDraft({ ...draft, sellingPrice: parseFloat(e.target.value) || 0 })}
                        className={priceInput}
                      />
                    </td>
                    <td className={`${calcEdit} bg-amber-50/60`}>{formatLKR(vatAmount(draft.sellingPrice))}</td>
                    <td className={`${calcEdit} bg-amber-50/60 font-medium text-gray-700`}>{formatLKR(withVat(draft.sellingPrice))}</td>
                    <td className="px-3 py-2">
                      <MarginCell dealerEx={draft.dealerPrice} sellingEx={draft.sellingPrice} />
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button onClick={() => saveEdit(p.id)} disabled={busy} className="text-xs text-green-600 hover:underline mr-3">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.category}</td>
                    <td className="px-3 py-3 text-right text-gray-800 bg-sky-50/60 whitespace-nowrap">{formatLKR(p.dealerPrice)}</td>
                    <td className={`${calc} bg-sky-50/60`}>{formatLKR(vatAmount(p.dealerPrice))}</td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800 bg-sky-50/60 whitespace-nowrap">{formatLKR(withVat(p.dealerPrice))}</td>
                    <td className="px-3 py-3 text-right text-gray-800 bg-amber-50/60 whitespace-nowrap">{formatLKR(p.sellingPrice)}</td>
                    <td className={`${calc} bg-amber-50/60`}>{formatLKR(vatAmount(p.sellingPrice))}</td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800 bg-amber-50/60 whitespace-nowrap">{formatLKR(withVat(p.sellingPrice))}</td>
                    <td className="px-3 py-3">
                      <MarginCell dealerEx={p.dealerPrice} sellingEx={p.sellingPrice} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(p)} className="text-xs text-blue-600 hover:underline mr-3">Edit</button>
                      <button onClick={() => deleteProduct(p)} disabled={busy} className="text-xs text-red-600 hover:underline">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {adding && (
              <tr className="bg-blue-50/40">
                <td className="px-4 py-2">
                  <input autoFocus placeholder="Product name" value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className={textInput} />
                </td>
                <td className="px-4 py-2">
                  <select value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className={textInput}>
                    <option value="">Select…</option>
                    {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 bg-sky-50/60">
                  <input type="number" min={0} step="0.01" placeholder="0" value={newProduct.dealerPrice || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, dealerPrice: parseFloat(e.target.value) || 0 })} className={priceInput} />
                </td>
                <td className={`${calcEdit} bg-sky-50/60`}>{formatLKR(vatAmount(newProduct.dealerPrice))}</td>
                <td className={`${calcEdit} bg-sky-50/60 font-medium text-gray-700`}>{formatLKR(withVat(newProduct.dealerPrice))}</td>
                <td className="px-3 py-2 bg-amber-50/60">
                  <input type="number" min={0} step="0.01" placeholder="0" value={newProduct.sellingPrice || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: parseFloat(e.target.value) || 0 })} className={priceInput} />
                </td>
                <td className={`${calcEdit} bg-amber-50/60`}>{formatLKR(vatAmount(newProduct.sellingPrice))}</td>
                <td className={`${calcEdit} bg-amber-50/60 font-medium text-gray-700`}>{formatLKR(withVat(newProduct.sellingPrice))}</td>
                <td className="px-3 py-2">
                  <MarginCell dealerEx={newProduct.dealerPrice} sellingEx={newProduct.sellingPrice} />
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button onClick={createProduct} disabled={busy} className="text-xs text-green-600 hover:underline mr-3">Add</button>
                  <button onClick={() => setAdding(false)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Dealer & Selling prices are entered <strong>Ex VAT</strong>. VAT ({VAT_PCT}%) and Inc-VAT amounts are auto-calculated.
        Margin = Selling − Dealer (Ex VAT); % is gross margin on the selling price.
      </p>

      {!adding && (
        <button
          onClick={() => { setAdding(true); setError('') }}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Product
        </button>
      )}
    </div>
  )
}
