'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Package,
  Search,
  Thermometer,
  MessageSquare,
  PackageOpen,
  Wrench,
  LayoutDashboard,
  Building2,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const userNavItems: NavItem[] = [
  { label: '홈', href: '/dashboard', icon: Home },
  { label: '분실물', href: '/lost-found', icon: Search },
  { label: '전산장비', href: '/equipment', icon: Package },
  { label: '온도 민원', href: '/temperature', icon: Thermometer },
  { label: '불편사항', href: '/complaint', icon: MessageSquare },
  { label: '택배', href: '/parcel', icon: PackageOpen },
  { label: '시설 수리', href: '/facility', icon: Wrench },
]

const adminNavItems: NavItem[] = [
  { label: '운영 현황', href: '/admin', icon: LayoutDashboard },
  { label: '민원 관리', href: '/admin/complaints', icon: MessageSquare },
  { label: '택배 관리', href: '/admin/parcels', icon: PackageOpen },
  { label: '장비 관리', href: '/admin/equipment', icon: Package },
  { label: '시설 관리', href: '/admin/facility', icon: Wrench },
]

interface SidebarProps {
  userRole: UserRole
  userName: string
  userEmail: string
  avatarUrl: string | null
}

export function Sidebar({ userRole, userName, userEmail, avatarUrl: _avatarUrl }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = userRole === 'admin' || userRole === 'operator'

  function getInitials(name: string) {
    return name.trim().slice(0, 2)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-white border-r border-gray-100 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shadow-sm">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900 leading-tight">GA Portal</div>
          <div className="text-[10px] text-gray-400 leading-tight">총무 업무 포털</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {/* User nav section */}
        <div className="mb-1">
          <p className="px-2 mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            서비스
          </p>
          {userNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-white' : 'text-gray-500')} />
                {item.label}
                {active && <ChevronRight className="ml-auto w-3.5 h-3.5 text-blue-200" />}
              </Link>
            )
          })}
        </div>

        {/* Admin nav section */}
        {isAdmin && (
          <div className="mt-4">
            <p className="px-2 mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              관리자
            </p>
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon
                    className={cn('w-4 h-4 shrink-0', active ? 'text-white' : 'text-gray-500')}
                  />
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* User Profile + Logout */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          {/* Avatar */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold shrink-0">
            {getInitials(userName || '?')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{userName}</div>
            <div className="text-[11px] text-gray-400 truncate">{userEmail}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors mt-0.5"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
