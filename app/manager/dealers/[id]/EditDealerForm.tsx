'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LocationPreview from '@/components/LocationPreview'
import { DEALER_STATUSES } from '@/lib/dealer'

interface Dealer {
  id: string
  name: string
  contactPerson: string
  phone: string
  phone2: string
  operationalContactPerson: string
  operationalContactNumber: string
  email: string
  address: string
  mainCity: string
  district: string
  latitude: string
  longitude: string
  businessRegNo: string
  bankGuaranteeValue: number
  bankGuaranteeUsed: number
  status: string
}

interface Login {
  id: string
  name: string
  email: string
}

function formatLKR(v: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(v)
}

export default function EditDealerForm({ dealer, login }: { dealer: Dealer; login: Login | null }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: dealer.name,
    contactPerson: dealer.contactPerson,
    phone: dealer.phone,
    phone2: dealer.phone2,
    operationalContactPerson: dealer.operationalContactPerson,
    operationalContactNumber: dealer.operationalContactNumber,
    email: dealer.email,
    address: dealer.address,
    mainCity: dealer.mainCity,
    district: dealer.district,
    latitude: dealer.latitude,
    longitude: dealer.longitude,
    businessRegNo: dealer.businessRegNo,
    bankGuaranteeValue: dealer.bankGuaranteeValue,
    status: dealer.status,
  })
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function update(field: keyof typeof form, value: string | number) {
    setForm({ ...form, [field]: value })
  }

  const latNum = form.latitude === '' ? null : Number(form.latitude)
  const lngNum = form.longitude === '' ? null : Number(form.longitude)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if ((form.latitude === '') !== (form.longitude === '')) {
      setError('Enter both latitude and longitude, or leave both blank.')
      return
    }
    if (latNum !== null && (Number.isNaN(latNum) || latNum < -90 || latNum > 90)) {
      setError('Latitude must be a number between -90 and 90.')
      return
    }
    if (lngNum !== null && (Number.isNaN(lngNum) || lngNum < -180 || lngNum > 180)) {
      setError('Longitude must be a number between -180 and 180.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const res = await fetch(`/api/manager/dealers/${dealer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, latitude: latNum, longitude: lngNum, newPassword: newPassword || undefined }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to update dealer.')
      setSaving(false)
      return
    }

    setSuccess('Dealer updated successfully.')
    setNewPassword('')
    router.refresh()
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Business Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Dealer Name" value={form.name} onChange={(v) => update('name', v)} required />
          <TextField label="Business Reg. No." value={form.businessRegNo} onChange={(v) => update('businessRegNo', v)} required />
          <TextField label="Email Address" type="email" value={form.email} onChange={(v) => update('email', v)} required />
          <TextField label="Main City" value={form.mainCity} onChange={(v) => update('mainCity', v)} required />
          <TextField label="District" value={form.district} onChange={(v) => update('district', v)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {DEALER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Location</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input type="number" step="any" min={-90} max={90} value={form.latitude}
              onChange={(e) => update('latitude', e.target.value)} placeholder="e.g. 6.9271"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input type="number" step="any" min={-180} max={180} value={form.longitude}
              onChange={(e) => update('longitude', e.target.value)} placeholder="e.g. 79.8612"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
        </div>
        <p className="text-xs text-gray-400">Right-click the location on Google Maps and click the coordinates to copy them.</p>
        <LocationPreview lat={latNum} lng={lngNum} />
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

      {/* Bank Guarantee */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Bank Guarantee</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guarantee Limit (LKR)</label>
            <input
              type="number"
              min={dealer.bankGuaranteeUsed}
              value={form.bankGuaranteeValue}
              onChange={(e) => update('bankGuaranteeValue', parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currently Used</label>
            <p className="px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg">{formatLKR(dealer.bankGuaranteeUsed)}</p>
          </div>
        </div>
      </div>

      {/* Login Account */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Login Account</h2>
        {login ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Login Name</p>
                <p className="text-gray-800 font-medium">{login.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Login Email</p>
                <p className="text-gray-800 font-medium">{login.email}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reset Password (optional)</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-amber-600">This dealer has no login account.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2">{success}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/manager/dealers')}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  )
}
