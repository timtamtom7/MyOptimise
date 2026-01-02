'use client'

import { useState, useEffect } from 'react'
import { TaskService } from '@/lib/task-service'
import { supabase, Capability } from '@/lib/supabase'
import { BarChart3, Users, Calendar, MessageSquare, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface DashboardStatsProps {
  userId: string
  accountId: string
  capabilities: Capability[]
}

export default function DashboardStats({ userId, accountId, capabilities }: DashboardStatsProps) {
  const [stats, setStats] = useState<{
    total: number
    completed: number
    inProgress: number
    overdue: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const taskService = new TaskService(userId, accountId, capabilities)
        const taskStats = await taskService.getTaskStats()
        setStats(taskStats)
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [userId, accountId, capabilities])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center">
              <div className="p-2 bg-gray-200 rounded-lg">
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
              </div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center">Unable to load statistics</p>
      </div>
    )
  }

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-600',
      trend: null
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      trend: completionRate > 0 ? `+${completionRate}%` : null
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
      trend: null
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
      trend: stats.overdue > 0 ? 'Needs attention' : null
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 ${card.color} rounded-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  {card.trend && (
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-600 font-medium">{card.trend}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}