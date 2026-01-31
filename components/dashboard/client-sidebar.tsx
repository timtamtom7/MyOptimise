'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Briefcase, 
  TrendingUp, 
  FileText,
  Settings,
  LogOut,
  Menu
} from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-user'
import { useCapabilities } from '@/hooks/use-capabilities'
import SignOutButton from '../auth/signout-button'

interface ClientSidebarProps {
  activeView: 'overview' | 'services' | 'performance' | 'reports'
  onViewChange: (view: 'overview' | 'services' | 'performance' | 'reports') => void
  isOpen?: boolean
  onToggle?: () => void
  user?: any
}

const navigationItems = [
  {
    id: 'overview' as const,
    label: 'Overview',
    icon: BarChart3,
    capability: 'analytics.read' as const,
  },
  {
    id: 'services' as const,
    label: 'Services',
    icon: Briefcase,
    capability: 'services.read' as const,
  },
  {
    id: 'performance' as const,
    label: 'Performance',
    icon: TrendingUp,
    capability: 'analytics.read' as const,
  },
  {
    id: 'reports' as const,
    label: 'Reports',
    icon: FileText,
    capability: 'analytics.read' as const,
  },
]

export function ClientSidebar({ activeView, onViewChange, isOpen, onToggle, user: propUser }: ClientSidebarProps) {
  const { user: hookUser } = useCurrentUser()
  const { hasCapability } = useCapabilities()
  const user = propUser || hookUser

  if (!user) return null

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {user.account?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {user.account?.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              Client Portal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const hasAccess = hasCapability(item.capability)
          if (!hasAccess) return null

          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start',
                activeView === item.id && 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
              )}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </Button>
          <SignOutButton className="w-full justify-start">
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </SignOutButton>
        </div>
      </div>
    </div>
  )
}