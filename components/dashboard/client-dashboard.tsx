'use client'

import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-user'
import { useCapabilities } from '@/hooks/use-capabilities'
import { useTodayKeyMetrics, useServiceMetrics, useEngagementTrends, useROIAnalysis } from '@/hooks/use-analytics'
import { ClientSidebar } from './client-sidebar'
import { ClientHeader } from './client-header'
import { AnalyticsOverview } from './analytics-overview'
import { ServicesDashboard } from './services-dashboard'
import { PerformanceMetrics } from './performance-metrics'
import { LoadingSpinner } from '../ui/loading-spinner'
import { Alert, AlertDescription } from '../ui/alert'

export function ClientDashboard() {
  const [activeView, setActiveView] = useState<'overview' | 'services' | 'performance' | 'reports'>('overview')
  const { user, loading: isLoading, error } = useCurrentUser()
  const { hasCapability } = useCapabilities()
  const isClient = hasCapability("client.access"); // Assuming this is how we check, or just check user role

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

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            You don’t have permission to access the client dashboard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return <AnalyticsOverview />
      case 'services':
        return <ServicesDashboard />
      case 'performance':
        return <PerformanceMetrics />
      case 'reports':
        return <div>Reports coming soon...</div>
      default:
        return <AnalyticsOverview />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <ClientSidebar activeView={activeView} onViewChange={setActiveView} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ClientHeader user={user} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  )
}
