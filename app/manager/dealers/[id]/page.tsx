import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EditDealerForm from './EditDealerForm'
import { dealerScope } from '@/lib/access'

export default async function EditDealerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = (await auth())!
  const { id } = await params

  const dealer = await prisma.dealer.findFirst({
    where: { id, ...dealerScope(session) },
    include: { users: { where: { role: 'DEALER' }, select: { id: true, name: true, email: true } } },
  })

  if (!dealer) notFound()

  const login = dealer.users[0] ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Dealer</h1>
        <p className="text-sm text-gray-500 mt-0.5">{dealer.name}</p>
      </div>
      <EditDealerForm
        dealer={{
          id: dealer.id,
          name: dealer.name,
          contactPerson: dealer.contactPerson,
          phone: dealer.phone,
          phone2: dealer.phone2 ?? '',
          operationalContactPerson: dealer.operationalContactPerson ?? '',
          operationalContactNumber: dealer.operationalContactNumber ?? '',
          email: dealer.email,
          address: dealer.address,
          mainCity: dealer.mainCity ?? '',
          district: dealer.district ?? '',
          latitude: dealer.latitude?.toString() ?? '',
          longitude: dealer.longitude?.toString() ?? '',
          businessRegNo: dealer.businessRegNo,
          bankGuaranteeValue: dealer.bankGuaranteeValue,
          bankGuaranteeUsed: dealer.bankGuaranteeUsed,
          status: dealer.status,
        }}
        login={login}
      />
    </div>
  )
}
