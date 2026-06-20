import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function Home() {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') redirect('/admin')
  if (session.user.role === 'MANAGER') redirect('/manager')
  redirect('/dealer')
}
