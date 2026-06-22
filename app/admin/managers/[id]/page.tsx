import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/access'
import { redirect, notFound } from 'next/navigation'
import EditManagerForm from './EditManagerForm'

export default async function EditManagerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = (await auth())!
  if (!isSuperAdmin(session.user.role)) redirect('/admin/managers')

  const { id } = await params
  const manager = await prisma.user.findFirst({
    where: { id, role: 'MANAGER' },
    select: { id: true, name: true, email: true, phone: true, _count: { select: { managedDealers: true } } },
  })
  if (!manager) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Manager</h1>
        <p className="text-sm text-gray-500 mt-0.5">{manager.name} · {manager._count.managedDealers} dealer(s)</p>
      </div>
      <EditManagerForm
        manager={{ id: manager.id, name: manager.name, email: manager.email, phone: manager.phone ?? '' }}
      />
    </div>
  )
}
