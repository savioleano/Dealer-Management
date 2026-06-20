import { prisma } from '@/lib/prisma'
import NewDealerForm from './NewDealerForm'

export default async function AdminNewDealerPage() {
  const managers = await prisma.user.findMany({
    where: { role: 'MANAGER' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Dealer</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create a dealer and assign it to a manager</p>
      </div>
      <NewDealerForm managers={managers} />
    </div>
  )
}
