import { auth } from '@/auth'
import { isSuperAdmin } from '@/lib/access'
import { redirect } from 'next/navigation'
import NewAdminForm from './NewAdminForm'

export default async function NewAdminPage() {
  const session = (await auth())!
  if (!isSuperAdmin(session.user.role)) redirect('/admin')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Admin</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create an admin login (User Level: Admin)</p>
      </div>
      <NewAdminForm />
    </div>
  )
}
