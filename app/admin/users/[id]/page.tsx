import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/access'
import { redirect, notFound } from 'next/navigation'
import EditUserForm from './EditUserForm'

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = (await auth())!
  if (!isSuperAdmin(session.user.role)) redirect('/admin')

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true, _count: { select: { managedDealers: true } } },
  })
  if (!user || !['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(user.role)) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {roleLabel[user.role]}
          {user.role === 'MANAGER' && ` · ${user._count.managedDealers} dealer(s)`}
        </p>
      </div>
      <EditUserForm
        user={{ id: user.id, name: user.name, email: user.email, phone: user.phone ?? '', role: user.role }}
        isSelf={user.id === session.user.id}
      />
    </div>
  )
}
