'use client'

import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-user'
import { useCapabilities } from '@/hooks/use-capabilities'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { TaskBoard } from './task-board'
import { CalendarView } from './calendar-view'
import { TeamChat } from './team-chat'
import { DashboardStats } from './dashboard-stats'
import { LoadingSpinner } from '../ui/loading-spinner'
import { Alert, AlertDescription } from '../ui/alert'

export function EmployeeDashboard() {
  const [activeView, setActiveView] = useState<'dashboard' | 'tasks' | 'calendar' | 'team'>('dashboard')
  const { user, loading: isLoading, error } = useCurrentUser()
  const { hasCapability } = useCapabilities()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to load dashboard. Please refresh the page or contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            Please log in to access the dashboard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardStats />
      case 'tasks':
        return <TaskBoard />
      case 'calendar':
        return <CalendarView />
      case 'team':
        return <TeamChat />
      default:
        return <DashboardStats />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  )
}