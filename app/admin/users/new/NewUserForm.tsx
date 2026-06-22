'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewUserForm() {
  const router = useRouter()
  const [form, setForm] = useState({ role: 'MANAGER', name: '', phone: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof typeof form, value: string) {
    setForm({ ...form, [field]: value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to create user.')
      setSubmitting(false)
      return
    }
    router.push('/admin/users')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Level</label>
            <select value={form.role} onChange={(e) => update('role', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="hidden sm:block" />
          <Field label="Name" value={form.name} onChange={(v) => update('name', v)} required />
          <Field label="Contact Number" value={form.phone} onChange={(v) => update('phone', v)} required />
          <Field label="Email Address" type="email" value={form.email} onChange={(v) => update('email', v)} required />
          <Field label="Password Setting" type="text" value={form.password} onChange={(v) => update('password', v)} required />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push('/admin/users')}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting}
          className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors">
          {submitting ? 'Creating…' : 'Create User'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, value, onChange, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
    </div>
  )
}
