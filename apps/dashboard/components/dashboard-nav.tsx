'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Code,
  Inbox,
  BarChart3
} from 'lucide-react'
import { useUnreadCount, useRealtimeFeedbacks } from '@/hooks/use-feedbacks'

const PROJECT_ID = 'demo-project' // In production, get from context/auth

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

function useNavItems(): NavItem[] {
  const { unreadCount } = useRealtimeFeedbacks(PROJECT_ID)

  return [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'Feedbacks',
      href: '/admin/feedbacks',
      icon: Inbox,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
    },
    {
      label: 'Configurações',
      href: '/admin/settings',
      icon: Settings,
    },
    {
      label: 'Widget',
      href: '/feedback',
      icon: Code,
    },
  ]
}

export function DashboardNav() {
  const pathname = usePathname()
  const navItems = useNavItems()

  return (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4" />
              {item.label}
            </div>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-red-500 rounded-full">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
