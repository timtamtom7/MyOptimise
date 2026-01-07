'use client'

import { useState } from 'react'
import { ClientHeader } from './client-header'
import { ClientSidebar } from './client-sidebar'

interface ClientDashboardLayoutProps {
  children: React.ReactNode
  user: any
  onSearch: (query: string) => void
  notifications: any[]
}

export function ClientDashboardLayout({ 
  children, 
  user, 
  onSearch, 
  notifications 
}: ClientDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientSidebar 
        user={user} 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        activeView="overview"
        onViewChange={() => {}}
      />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <ClientHeader 
          user={user} 
        />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}