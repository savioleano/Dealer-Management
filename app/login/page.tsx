'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoOk, setLogoOk] = useState(true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          {logoOk ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src="/rit-logo.png" alt="Retail IT" className="h-16 w-auto" onError={() => setLogoOk(false)} />
          ) : (
            <p className="text-2xl font-bold text-green-800">RETAIL IT</p>
          )}
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mt-3">Dealer Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="you@retailit.lk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="••••••••"
            />
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-green-700 hover:underline">Forgot password?</Link>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
