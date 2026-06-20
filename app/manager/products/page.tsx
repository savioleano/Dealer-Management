import { prisma } from '@/lib/prisma'
import ProductsManager from './ProductsManager'
import BulkUpload from './BulkUpload'

export default async function ManageProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Products</h1>
        <p className="text-sm text-gray-500 mt-0.5">Add products and update pricing</p>
      </div>
      <BulkUpload />

      <ProductsManager
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          dealerPrice: p.dealerPrice,
          sellingPrice: p.sellingPrice,
        }))}
      />
    </div>
  )
}
