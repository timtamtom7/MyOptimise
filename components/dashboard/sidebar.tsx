'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Users, 
  Settings,
  LogOut 
} from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-user'
import { useCapabilities } from '@/hooks/use-capabilities'
import SignOutButton from '../auth/signout-button'
import { useTranslation } from '@/hooks/use-translation'

interface SidebarProps {
  activeView: 'dashboard' | 'tasks' | 'calendar' | 'team'
  onViewChange: (view: 'dashboard' | 'tasks' | 'calendar' | 'team') => void
}

const navigationItems = [
  {
    id: 'dashboard' as const,
    label: 'dashboard',
    icon: LayoutDashboard,
    capability: 'analytics.read' as const,
  },
  {
    id: 'tasks' as const,
    label: 'tasks',
    icon: CheckSquare,
    capability: 'tasks.read' as const,
  },
  {
    id: 'calendar' as const,
    label: 'calendar',
    icon: Calendar,
    capability: 'calendar.read' as const,
  },
  {
    id: 'team' as const,
    label: 'team',
    icon: Users,
    capability: 'messages.read' as const,
  },
]

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { user } = useCurrentUser()
  const { hasCapability } = useCapabilities()
  const { t } = useTranslation()

  if (!user) return null

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {user.account?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {user.account?.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {t(user.role as any) || user.role}
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
                activeView === item.id && 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              )}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="mr-3 h-4 w-4" />
              {t(item.label)}
            </Button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-3 h-4 w-4" />
            {t('settings')}
          </Button>
          <SignOutButton className="w-full justify-start">
            <LogOut className="mr-3 h-4 w-4" />
            {t('signOut')}
          </SignOutButton>
        </div>
      </div>
    </div>
  )
}