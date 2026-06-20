import NewManagerForm from './NewManagerForm'

export default function NewManagerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Manager</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create a manager login (User Level: Manager)</p>
      </div>
      <NewManagerForm />
    </div>
  )
}
