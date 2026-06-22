'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface SidebarProps {
  role: 'DEALER' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN'
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

// Super Admin: same as Admin, but the separate "Manage Managers" is replaced
// by a single "User Management" (Admins + Managers) below Map.
const superAdminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: '◼' },
  { href: '/manager/map', label: 'Map', icon: '🗺️' },
  { href: '/admin/users', label: 'User Management', icon: '👥' },
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
  SUPER_ADMIN: superAdminNav,
}

const homeHref: Record<SidebarProps['role'], string> = {
  DEALER: '/dealer',
  MANAGER: '/manager',
  ADMIN: '/admin',
  SUPER_ADMIN: '/admin',
}

const roleLabel: Record<SidebarProps['role'], string> = {
  DEALER: 'Dealer',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const nav = navByRole[role]
  const home = homeHref[role]
  const [logoOk, setLogoOk] = useState(true)

  return (
    <aside className="w-64 flex-shrink-0 bg-white text-gray-700 border-r border-gray-200 flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-gray-200">
        {logoOk ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src="/rit-logo.png" alt="Retail IT" className="h-12 w-auto mb-2" onError={() => setLogoOk(false)} />
        ) : (
          <p className="text-sm font-semibold uppercase tracking-widest mb-0.5 text-green-800">Retail IT</p>
        )}
        <p className="font-medium text-sm leading-snug text-gray-900">Dealer Management Portal</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = item.href === home ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm border-l-[3px] transition-colors ${
                active
                  ? 'bg-gray-100 text-green-800 font-medium border-green-700'
                  : 'text-gray-700 border-transparent hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-900 truncate">{roleLabel[role]}</p>
        <p className="text-xs text-gray-500 truncate mb-2">{userName}</p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Sign out →
        </button>
      </div>
    </aside>
  )
}
