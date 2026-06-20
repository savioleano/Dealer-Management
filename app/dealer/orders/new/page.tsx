import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import PlaceOrderForm from './PlaceOrderForm'

export default async function PlaceOrderPage() {
  const session = await auth()
  const dealerId = session!.user.dealerId!

  const [products, dealer] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
    prisma.dealer.findUnique({ where: { id: dealerId } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Place Order</h1>
        <p className="text-sm text-gray-500 mt-0.5">Add products and submit for manager approval</p>
      </div>
      <PlaceOrderForm products={products} dealerAddress={dealer?.address ?? ''} dealerId={dealerId} />
    </div>
  )
}
