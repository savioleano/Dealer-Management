import { auth } from '@/auth'
import { isSuperAdmin } from '@/lib/access'
import { redirect } from 'next/navigation'
import NewUserForm from './NewUserForm'

export default async function NewUserPage() {
  const session = (await auth())!
  if (!isSuperAdmin(session.user.role)) redirect('/admin')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add User</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create an Admin or Manager account</p>
      </div>
      <NewUserForm />
    </div>
  )
}
