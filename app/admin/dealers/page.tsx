import { prisma } from '@/lib/prisma'
import Link from 'next/link'

function formatLKR(v: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(v)
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-red-100 text-red-700',
}

export default async function AdminDealersPage() {
  const dealers = await prisma.dealer.findMany({
    include: { manager: { select: { name: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Dealers</h1>
          <p className="text-sm text-gray-500 mt-0.5">All dealers across all managers</p>
        </div>
        <Link
          href="/admin/dealers/new"
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Dealer
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dealer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Manager</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">City / District</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Guarantee Used</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dealers.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{d.name}</p>
                  <p className="text-xs text-gray-400">{d.contactPerson} · {d.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{d.manager.name}</td>
                <td className="px-4 py-3 text-gray-600">{[d.mainCity, d.district].filter(Boolean).join(' / ') || '—'}</td>
                <td className="px-4 py-3 text-right text-gray-700">{formatLKR(d.bankGuaranteeUsed)} / {formatLKR(d.bankGuaranteeValue)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[d.status]}`}>{d.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/manager/dealers/${d.id}`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {dealers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No dealers yet.</p>
            <Link href="/admin/dealers/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Create the first dealer →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
