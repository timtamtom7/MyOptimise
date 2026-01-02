'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser, UserWithCapabilities } from '../../../lib/supabase'
import AnalyticsOverview from '../../../components/dashboard/client/analytics-overview'
import ServiceList from '../../../components/dashboard/client/service-list'
import { LogOut, Settings, User as UserIcon, TrendingUp, Calendar, MessageSquare, Bell } from 'lucide-react'

export default function ClientDashboard() {
  const [user, setUser] = useState<UserWithCapabilities | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        if (currentUser.role !== 'client') {
          router.push('/dashboard/employee')
          return
        }

        setUser(currentUser)
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {/* TODO: Open notifications */}}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name || 'User'} className="h-8 w-8 rounded-full" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user.full_name || user.email}</p>
                  <p className="text-xs text-gray-500 capitalize">Client</p>
                </div>
              </div>
              
              <button
                onClick={() => {/* TODO: Open settings modal */}}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Welcome back, {user.full_name || user.email}!</h2>
              <p className="text-sm text-gray-500">Here's your marketing performance overview</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {/* TODO: Open calendar */}}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </button>
              <button
                onClick={() => {/* TODO: Open messages */}}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </button>
            </div>
          </div>
          
          <AnalyticsOverview userId={user.id} accountId={user.organization_id} userRole={user.role} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Marketing Services</h3>
              <ServiceList userId={user.id} accountId={user.organization_id} userRole={user.role} />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {/* TODO: Request new service */}}
                  className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Request New Service
                </button>
                <button
                  onClick={() => {/* TODO: Schedule consultation */}}
                  className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Schedule Consultation
                </button>
                <button
                  onClick={() => {/* TODO: View reports */}}
                  className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  View Detailed Reports
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Engagement is up 15%</p>
                    <p className="text-xs text-gray-500">Compared to last month</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Reach expanded</p>
                    <p className="text-xs text-gray-500">New audience segments discovered</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Eye className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Impressions growing</p>
                    <p className="text-xs text-gray-500">Content visibility improved</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Instagram campaign launched</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Email newsletter sent</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Facebook ad optimized</p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}