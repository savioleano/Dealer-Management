import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function formatLKR(v: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(v)
}

export default async function ProfilePage() {
  const session = await auth()
  const dealerId = session!.user.dealerId!

  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    include: { manager: { select: { name: true, email: true, phone: true } } },
  })

  if (!dealer) return <p>Dealer not found.</p>

  const guaranteePercent = Math.min((dealer.bankGuaranteeUsed / dealer.bankGuaranteeValue) * 100, 100)
  const available = dealer.bankGuaranteeValue - dealer.bankGuaranteeUsed

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dealer Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-3">Business Information</h2>
          <Field label="Dealer Name" value={dealer.name} />
          <Field label="Business Reg. No." value={dealer.businessRegNo} />
          <Field label="Email Address" value={dealer.email} />
          <Field label="Address" value={dealer.address} />
          <Field label="Main City" value={dealer.mainCity ?? '—'} />
          <Field label="District" value={dealer.district ?? '—'} />
          <Field label="Onboarding Date" value={new Date(dealer.onboardingDate).toLocaleDateString('en-GB')} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 sm:w-40 flex-shrink-0">Status</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              dealer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : dealer.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
            }`}>{dealer.status}</span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Contacts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 border-b pb-3">Contacts</h2>
            <Field label="Owner (Name)" value={dealer.contactPerson} />
            <Field label="Contact Number 1" value={dealer.phone} />
            <Field label="Contact Number 2" value={dealer.phone2 ?? '—'} />
            <Field label="Operational Contact" value={dealer.operationalContactPerson ?? '—'} />
            <Field label="Operational Number" value={dealer.operationalContactNumber ?? '—'} />
          </div>

          {/* Manager */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h2 className="font-semibold text-gray-800 border-b pb-3">Assigned Manager</h2>
            <Field label="Name" value={dealer.manager.name} />
            <Field label="Email" value={dealer.manager.email} />
            <Field label="Contact" value={dealer.manager.phone ?? '—'} />
          </div>

          {/* Bank Guarantee */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 border-b pb-3">Bank Guarantee</h2>
            <Field label="Total Limit" value={formatLKR(dealer.bankGuaranteeValue)} />
            <Field label="Amount Used" value={formatLKR(dealer.bankGuaranteeUsed)} />
            <Field label="Available" value={formatLKR(available)} />
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Utilization</span>
                <span className={guaranteePercent >= 90 ? 'text-red-600 font-medium' : ''}>{guaranteePercent.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${guaranteePercent >= 90 ? 'bg-red-500' : guaranteePercent >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${guaranteePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
      <span className="text-sm text-gray-500 sm:w-40 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  )
}
