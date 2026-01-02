import { ReactNode } from 'react'
import { EmployeeSidebar } from './employee-sidebar'
import { EmployeeHeader } from './employee-header'

interface EmployeeDashboardLayoutProps {
  children: ReactNode
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    role: 'owner' | 'manager' | 'employee' | 'client'
    accountId: string
    organization: any
    isActive: boolean
  }
  onSearch?: (query: string) => void
  onFilter?: () => void
  onCreateTask?: () => void
  notifications?: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'success' | 'error'
    createdAt: string
    read: boolean
  }>
}

export function EmployeeDashboardLayout({ 
  children, 
  user, 
  onSearch, 
  onFilter, 
  onCreateTask,
  notifications 
}: EmployeeDashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <EmployeeSidebar user={user} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <EmployeeHeader 
          user={user}
          onSearch={onSearch}
          onFilter={onFilter}
          onCreateTask={onCreateTask}
          notifications={notifications}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}