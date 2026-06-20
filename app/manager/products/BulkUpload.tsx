'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRODUCT_CATEGORIES, isValidCategory } from '@/lib/products'

interface ParsedRow {
  name: string
  category: string
  dealerPrice: string
  sellingPrice: string
  error?: string
}

// Minimal CSV parser that handles quoted fields and embedded commas.
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    if (row.some((f) => f.trim() !== '')) rows.push(row)
  }
  return rows
}

function validateRow(r: { name: string; category: string; dealerPrice: string; sellingPrice: string }): string | undefined {
  if (!r.name.trim()) return 'Name is required'
  if (!isValidCategory(r.category.trim())) return `Category must be ${PRODUCT_CATEGORIES.join('/')}`
  const dp = Number(r.dealerPrice)
  const sp = Number(r.sellingPrice)
  if (!Number.isFinite(dp) || dp < 0) return 'Dealer Price invalid'
  if (!Number.isFinite(sp) || sp < 0) return 'Selling Price invalid'
  if (sp < dp) return 'Selling < Dealer'
  return undefined
}

const TEMPLATE = `Product Name,Category,Dealer Price,Selling Price
POS Device,POS,45000,54000
ECR Model,ECR,35000,42000
Barcode Scanner,Accessories,8500,10500
`

export default function BulkUpload() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number; errors: { row: number; message: string }[] } | null>(null)

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product-upload-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(file: File) {
    setParseError('')
    setResult(null)
    const text = await file.text()
    const grid = parseCSV(text)
    if (grid.length < 2) {
      setParseError('File appears empty or has no data rows.')
      setRows([])
      return
    }

    // Detect & skip a header row if the first row looks like headers.
    const first = grid[0].map((c) => c.trim().toLowerCase())
    const hasHeader = first.includes('product name') || first.includes('name') || first.includes('category')
    const dataRows = hasHeader ? grid.slice(1) : grid

    const parsed: ParsedRow[] = dataRows.map((cols) => {
      const r = {
        name: (cols[0] ?? '').trim(),
        category: (cols[1] ?? '').trim(),
        dealerPrice: (cols[2] ?? '').trim(),
        sellingPrice: (cols[3] ?? '').trim(),
      }
      return { ...r, error: validateRow(r) }
    })

    setFileName(file.name)
    setRows(parsed)
  }

  async function submit() {
    const validRows = rows.filter((r) => !r.error)
    if (validRows.length === 0) return
    setSubmitting(true)
    setResult(null)

    const res = await fetch('/api/manager/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows: validRows.map((r) => ({
          name: r.name,
          category: r.category,
          dealerPrice: Number(r.dealerPrice),
          sellingPrice: Number(r.sellingPrice),
        })),
      }),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setParseError(data.error ?? 'Upload failed.')
      return
    }
    setResult(data)
    setRows([])
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
    router.refresh()
  }

  const validCount = rows.filter((r) => !r.error).length
  const errorCount = rows.length - validCount

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-gray-800">Bulk Upload (CSV)</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Columns: Product Name, Category ({PRODUCT_CATEGORIES.join(' / ')}), Dealer Price (Ex VAT), Selling Price (Ex VAT).
            VAT is auto-calculated. Existing products (matched by name) are updated.
          </p>
        </div>
        <button onClick={downloadTemplate} className="text-sm text-blue-600 hover:underline whitespace-nowrap">
          ↓ Download template
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer"
        />
        {fileName && <span className="text-xs text-gray-400">{fileName}</span>}
      </div>

      {parseError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{parseError}</p>}

      {result && (
        <div className="text-sm bg-green-50 text-green-700 rounded-lg px-4 py-3 space-y-1">
          <p className="font-medium">Upload complete — {result.created} created, {result.updated} updated.</p>
          {result.errors.length > 0 && (
            <p className="text-amber-700">{result.errors.length} row(s) skipped due to errors.</p>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-700">{validCount} valid</span>
            {errorCount > 0 && <span className="text-red-600">{errorCount} with errors</span>}
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Category</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Dealer</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Selling</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr key={i} className={r.error ? 'bg-red-50/50' : ''}>
                    <td className="px-3 py-1.5 text-gray-800">{r.name}</td>
                    <td className="px-3 py-1.5 text-gray-600">{r.category}</td>
                    <td className="px-3 py-1.5 text-right text-gray-600">{r.dealerPrice}</td>
                    <td className="px-3 py-1.5 text-right text-gray-600">{r.sellingPrice}</td>
                    <td className="px-3 py-1.5 text-xs">
                      {r.error ? <span className="text-red-600">{r.error}</span> : <span className="text-green-600">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={submit}
            disabled={submitting || validCount === 0}
            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {submitting ? 'Importing…' : `Import ${validCount} product${validCount === 1 ? '' : 's'}`}
          </button>
        </div>
      )}
    </div>
  )
}
