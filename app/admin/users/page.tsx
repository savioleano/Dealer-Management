import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/access'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeleteUserButton from './DeleteUserButton'

const roleBadge: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  MANAGER: 'bg-teal-100 text-teal-700',
}
const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
}

export default async function UserManagementPage() {
  const session = (await auth())!
  if (!isSuperAdmin(session.user.role)) redirect('/admin')

  const users = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] } },
    include: { _count: { select: { managedDealers: true } } },
    orderBy: [{ role: 'desc' }, { name: 'asc' }],
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Admins and Managers</p>
        </div>
        <Link
          href="/admin/users/new"
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add User
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dealers</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {u.name}
                  {u.id === session.user.id && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[u.role]}`}>
                    {roleLabel[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.phone ?? '—'}</td>
                <td className="px-4 py-3 text-right text-gray-700">{u.role === 'MANAGER' ? u._count.managedDealers : '—'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link href={`/admin/users/${u.id}`} className="text-xs text-blue-600 hover:underline mr-3">Edit</Link>
                  {u.id === session.user.id || u.role === 'SUPER_ADMIN' ? (
                    <span className="text-xs text-gray-300">Delete</span>
                  ) : (
                    <DeleteUserButton id={u.id} name={u.name} role={u.role} dealerCount={u._count.managedDealers} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
