'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser, UserWithCapabilities, TaskWithDetails } from '../../../lib/supabase'
import DashboardStats from '../../../components/dashboard/employee/dashboard-stats'
import TaskList from '../../../components/dashboard/employee/task-list'
import CalendarWidget from '../../../components/dashboard/employee/calendar-widget'
import MessageWidget from '../../../components/dashboard/shared/message-widget'
import { LogOut, Settings, User as UserIcon } from 'lucide-react'

export default function EmployeeDashboard() {
  const [user, setUser] = useState<UserWithCapabilities | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        if (currentUser.role === 'client') {
          router.push('/dashboard/client')
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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name || 'User'} className="h-8 w-8 rounded-full" />
                    ) : (
                      <UserIcon className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{user.full_name || user.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                  </div>
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
          <DashboardStats userId={user.id} accountId={user.organization_id} capabilities={user.capabilities} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <TaskList userId={user.id} accountId={user.organization_id} capabilities={user.capabilities} onTaskSelect={setSelectedTask} />
            </div>
            
            <div>
              <MessageWidget userId={user.id} accountId={user.organization_id} userRole={user.role} />
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <CalendarWidget userId={user.id} accountId={user.organization_id} />
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {/* TODO: Open create task modal */}}
                  className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Create New Task
                </button>
                <button
                  onClick={() => {/* TODO: Open calendar modal */}}
                  className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Schedule Meeting
                </button>
                <button
                  onClick={() => {/* TODO: Open message modal */}}
                  className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Send Message
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Capabilities</h3>
              <div className="space-y-2">
                {user.capabilities.map((capability) => (
                  <div key={capability} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 capitalize">
                      {capability.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedTask && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Selected Task</h3>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">{selectedTask.title}</h4>
                  {selectedTask.description && (
                    <p className="text-sm text-gray-600">{selectedTask.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Status: {selectedTask.status.replace('_', ' ')}</span>
                    <span>Priority: {selectedTask.priority}</span>
                  </div>
                  {selectedTask.due_date && (
                    <div className="text-sm text-gray-500">
                      Due: {new Date(selectedTask.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}