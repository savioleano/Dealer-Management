'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">This reset link is missing its token. Please request a new one.</p>
        <Link href="/forgot-password" className="inline-block text-sm text-blue-700 hover:underline">Request a new link</Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">Your password has been updated. You can now sign in.</p>
        <Link href="/login" className="inline-block w-full text-center bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">Go to sign in</Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Could not reset password.')
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
      >
        {loading ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
