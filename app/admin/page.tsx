import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [managerCount, dealerCount] = await Promise.all([
    prisma.user.count({ where: { role: 'MANAGER' } }),
    prisma.dealer.count(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">System administration</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/admin/managers" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 transition-colors">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Managers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{managerCount}</p>
          <p className="text-xs text-blue-600 mt-2">Manage managers →</p>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Dealers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{dealerCount}</p>
          <p className="text-xs text-gray-400 mt-2">Created by managers</p>
        </div>
      </div>
    </div>
  )
}
