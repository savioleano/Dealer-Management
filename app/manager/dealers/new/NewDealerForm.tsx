'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CityAutocomplete from '@/components/CityAutocomplete'

const today = new Date().toISOString().split('T')[0]

export default function NewDealerForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    businessRegNo: '',
    onboardingDate: today,
    address: '',
    mainCity: '',
    district: '',
    email: '',
    contactPerson: '', // Owner (Name)
    phone: '', // Contact number 1
    phone2: '', // Contact number 2
    operationalContactPerson: '',
    operationalContactNumber: '',
    loginPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof typeof form, value: string) {
    setForm({ ...form, [field]: value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/manager/dealers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to create dealer.')
      setSubmitting(false)
      return
    }

    router.push('/manager/dealers')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">User Level: Dealer</div>
        <h2 className="font-semibold text-gray-800">Business Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Dealer Name" value={form.name} onChange={(v) => update('name', v)} required />
          <TextField label="Business Reg. No." value={form.businessRegNo} onChange={(v) => update('businessRegNo', v)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Onboarding Date</label>
            <input type="date" value={form.onboardingDate} onChange={(e) => update('onboardingDate', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
          </div>
          <TextField label="Email Address" type="email" value={form.email} onChange={(v) => update('email', v)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Main City</label>
            <CityAutocomplete
              value={form.mainCity}
              onChange={(city, district) => setForm((f) => ({ ...f, mainCity: city, district }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <input
              type="text"
              value={form.district}
              readOnly
              placeholder="Auto-filled from city"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea value={form.address} onChange={(e) => update('address', e.target.value)} rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
        </div>
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Contacts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Owner (Name)" value={form.contactPerson} onChange={(v) => update('contactPerson', v)} required />
          <div className="hidden sm:block" />
          <TextField label="Contact Number 1" value={form.phone} onChange={(v) => update('phone', v)} required />
          <TextField label="Contact Number 2" value={form.phone2} onChange={(v) => update('phone2', v)} />
          <TextField label="Operational Contact Person" value={form.operationalContactPerson} onChange={(v) => update('operationalContactPerson', v)} />
          <TextField label="Contact Number" value={form.operationalContactNumber} onChange={(v) => update('operationalContactNumber', v)} />
        </div>
      </div>

      {/* Login Account */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Login Account</h2>
        <p className="text-xs text-gray-500">The dealer signs in with the email above and this password.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Password Setting" type="text" value={form.loginPassword} onChange={(v) => update('loginPassword', v)} required />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push('/manager/dealers')}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={submitting}
          className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors">
          {submitting ? 'Creating…' : 'Create Dealer'}
        </button>
      </div>
    </form>
  )
}

function TextField({ label, value, onChange, type = 'text', required }: {
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
