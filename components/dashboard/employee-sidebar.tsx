"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  MessageSquare, 
  Users, 
  BarChart3,
  Settings,
  LogOut,
  FileText,
  Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { generateBlueGradient } from '@/lib/utils'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from 'next-auth/react'
import { useTranslation } from '@/hooks/use-translation'

interface EmployeeSidebarProps {
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    role: 'owner' | 'manager' | 'employee' | 'client'
    accountId: string
  }
}

const navigation = [
  { name: 'nav_dashboard', href: '/dashboard/employee', icon: LayoutDashboard },
  { name: 'nav_tasks', href: '/dashboard/employee/tasks', icon: CheckSquare },
  { name: 'nav_clients', href: '/dashboard/employee/clients', icon: Briefcase },
  { name: 'nav_schedule', href: '/dashboard/employee/schedule', icon: Calendar },
  { name: 'nav_messages', href: '/dashboard/employee/messages', icon: MessageSquare },
  { name: 'nav_documents', href: '/dashboard/employee/documents', icon: FileText },
  { name: 'nav_team', href: '/dashboard/employee/team', icon: Users },
  { name: 'nav_analytics', href: '/dashboard/employee/analytics', icon: BarChart3 },
  { name: 'nav_settings', href: '/dashboard/employee/settings', icon: Settings },
]

export function EmployeeSidebar({ user }: EmployeeSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { t } = useTranslation()

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo and Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <Link href="/dashboard/employee" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MO</span>
            </div>
            <span className="font-semibold text-gray-900">MyOptimise</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 h-8 w-8"
        >
          <span className="sr-only">Toggle sidebar</span>
          <div className={cn(
            "w-4 h-4 border-2 border-gray-400 rounded-sm transition-transform",
            isCollapsed ? "rotate-180" : ""
          )} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                isCollapsed ? "justify-center" : "justify-start"
              )}
              title={isCollapsed ? t(item.name) : undefined}
            >
              <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "")} />
              {!isCollapsed && <span>{t(item.name)}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "w-full justify-start p-2 hover:bg-gray-100 rounded-lg transition-colors",
              isCollapsed ? "justify-center" : "justify-start"
            )}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback 
                  style={{ background: generateBlueGradient(user.email) }}
                  className="text-white"
                >
                  {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.fullName || user.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {t('role_' + user.role) || user.role}
                  </p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('nav_my_account')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/employee/settings">
                {t('nav_settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('nav_sign_out')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}