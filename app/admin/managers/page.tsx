import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ManageManagersPage() {
  const managers = await prisma.user.findMany({
    where: { role: 'MANAGER' },
    include: { _count: { select: { managedDealers: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Managers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage manager accounts</p>
        </div>
        <Link
          href="/admin/managers/new"
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Manager
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dealers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {managers.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                <td className="px-4 py-3 text-gray-600">{m.email}</td>
                <td className="px-4 py-3 text-gray-600">{m.phone ?? '—'}</td>
                <td className="px-4 py-3 text-right text-gray-700">{m._count.managedDealers}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {managers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No managers yet.</p>
            <Link href="/admin/managers/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Create your first manager →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
