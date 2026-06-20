'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface SidebarProps {
  role: 'DEALER' | 'MANAGER' | 'ADMIN'
  userName: string
}

const dealerNav: NavItem[] = [
  { href: '/dealer', label: 'Dashboard', icon: '◼' },
  { href: '/dealer/orders/new', label: 'Place Order', icon: '＋' },
  { href: '/dealer/orders', label: 'My Orders', icon: '📋' },
  { href: '/dealer/stock', label: 'My Stock', icon: '📦' },
  { href: '/dealer/sales', label: 'Daily Sales', icon: '📊' },
  { href: '/dealer/profile', label: 'My Profile', icon: '👤' },
]

const managerNav: NavItem[] = [
  { href: '/manager', label: 'Dashboard', icon: '◼' },
  { href: '/manager/map', label: 'Map', icon: '🗺️' },
  { href: '/manager/orders', label: 'Order Queue', icon: '📋' },
  { href: '/manager/stock', label: 'Dealer Stock', icon: '📦' },
  { href: '/manager/sales', label: 'Sales Reports', icon: '📊' },
  { href: '/manager/dealers', label: 'Manage Dealers', icon: '🏢' },
  { href: '/manager/products', label: 'Manage Products', icon: '🏷️' },
]

const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: '◼' },
  { href: '/manager/map', label: 'Map', icon: '🗺️' },
  { href: '/admin/managers', label: 'Manage Managers', icon: '👔' },
  { href: '/admin/dealers', label: 'Manage Dealers', icon: '🏢' },
  { href: '/manager/orders', label: 'Order Queue', icon: '📋' },
  { href: '/manager/stock', label: 'Dealer Stock', icon: '📦' },
  { href: '/manager/sales', label: 'Sales Reports', icon: '📊' },
  { href: '/manager/products', label: 'Manage Products', icon: '🏷️' },
]

const navByRole: Record<SidebarProps['role'], NavItem[]> = {
  DEALER: dealerNav,
  MANAGER: managerNav,
  ADMIN: adminNav,
}

const homeHref: Record<SidebarProps['role'], string> = {
  DEALER: '/dealer',
  MANAGER: '/manager',
  ADMIN: '/admin',
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const nav = navByRole[role]
  const home = homeHref[role]

  return (
    <aside className="w-64 flex-shrink-0 bg-blue-950 text-white flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-blue-900">
        <p className="text-xs text-blue-400 uppercase tracking-widest mb-0.5">Retail IT</p>
        <p className="font-semibold text-sm leading-snug">Dealer Management Portal</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = item.href === home ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? 'bg-blue-700 text-white font-medium' : 'text-blue-200 hover:bg-blue-900 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-blue-900">
        <p className="text-xs text-blue-400 truncate mb-2">{userName}</p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left text-xs text-blue-300 hover:text-white transition-colors"
        >
          Sign out →
        </button>
      </div>
    </aside>
  )
}
