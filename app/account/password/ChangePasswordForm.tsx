'use client'

import { useState } from 'react'

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function update(field: keyof typeof form, value: string) {
    setForm({ ...form, [field]: value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    setSaving(true)
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to change password.')
      setSaving(false)
      return
    }
    setSuccess('Password changed successfully.')
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <Field label="Current Password" value={form.currentPassword} onChange={(v) => update('currentPassword', v)} />
      <Field label="New Password" value={form.newPassword} onChange={(v) => update('newPassword', v)} />
      <Field label="Confirm New Password" value={form.confirmPassword} onChange={(v) => update('confirmPassword', v)} />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2">{success}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {saving ? 'Saving…' : 'Change Password'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  )
}
