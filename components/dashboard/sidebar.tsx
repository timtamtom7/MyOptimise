'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Users, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  if (!user) return null

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        data-collapsed={isCollapsed}
        className={cn(
          "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out h-full",
          // Mobile: absolute positioning, full height, transform based on state
          "fixed md:relative z-50 h-full",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop: width transition
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("flex items-center border-b border-gray-200 dark:border-gray-700", isCollapsed ? "p-2 justify-center" : "p-6 justify-between")}>
           {!isCollapsed && (
             <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-semibold text-lg">
                  {user.account?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {user.account?.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize truncate">
                  {t(user.role as any) || user.role}
                </p>
              </div>
            </div>
           )}
           {isCollapsed && (
             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-semibold text-lg">
                  {user.account?.name.charAt(0).toUpperCase()}
                </span>
              </div>
           )}

           {/* Desktop Collapse Toggle */}
           <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-6 w-6 ml-auto"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
        </div>

        <nav className="flex-1 p-2 space-y-2">
          {navigationItems.map((item) => {
            const hasAccess = hasCapability(item.capability)
            if (!hasAccess) return null

            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? 'default' : 'ghost'}
                className={cn(
                  'w-full',
                  isCollapsed ? 'justify-center px-2' : 'justify-start px-4',
                  activeView === item.id && 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                )}
                onClick={() => {
                  onViewChange(item.id)
                  setIsMobileOpen(false) // Close mobile menu on selection
                }}
                title={isCollapsed ? t(item.label) : undefined}
              >
                <Icon className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-3")} />
                {!isCollapsed && t(item.label)}
              </Button>
            )
          })}
        </nav>

        <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <Button 
              variant="ghost" 
              className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start px-4")}
              title={isCollapsed ? t('settings') : undefined}
            >
              <Settings className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-3")} />
              {!isCollapsed && t('settings')}
            </Button>
            
            {/* SignOutButton needs to handle collapsed state if it has children, checking implementation... */}
            {/* Assuming SignOutButton accepts className and children. We'll wrap it or style it similarly. */}
            <SignOutButton className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start px-4")}>
              <LogOut className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-3")} />
              {!isCollapsed && t('signOut')}
            </SignOutButton>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}