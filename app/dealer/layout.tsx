import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DealerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'DEALER') redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar role="DEALER" userName={session.user.name} />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
