import NewDealerForm from './NewDealerForm'

export default function NewDealerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Dealer</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create a dealer and its login account</p>
      </div>
      <NewDealerForm />
    </div>
  )
}
