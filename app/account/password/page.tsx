import ChangePasswordForm from './ChangePasswordForm'

export default function ChangePasswordPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update the password for your own account</p>
      </div>
      <ChangePasswordForm />
    </div>
  )
}
