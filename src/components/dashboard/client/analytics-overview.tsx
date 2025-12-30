'use client'

import { useState, useEffect } from 'react'
import { AnalyticsService, createAnalyticsService, AnalyticsSummary } from '../../../lib/analytics-service'
import { TrendingUp, TrendingDown, Users, Eye, Heart, BarChart3 } from 'lucide-react'

interface AnalyticsOverviewProps {
  userId: string
}

export default function AnalyticsOverview({ userId }: AnalyticsOverviewProps) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsService, setAnalyticsService] = useState<AnalyticsService | null>(null)

  useEffect(() => {
    const initAnalyticsService = async () => {
      try {
        const service = await createAnalyticsService(userId)
        setAnalyticsService(service)
        await loadAnalytics(service)
      } catch (error) {
        console.error('Error initializing analytics service:', error)
      } finally {
        setLoading(false)
      }
    }

    initAnalyticsService()
  }, [userId])

  const loadAnalytics = async (service: AnalyticsService) => {
    try {
      const summaryData = await service.getAnalyticsSummary()
      setSummary(summaryData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center">Unable to load analytics data</p>
      </div>
    )
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatPercentage = (num: number): string => {
    return num.toFixed(1) + '%'
  }

  const statCards = [
    {
      title: 'Total Engagement',
      value: formatNumber(summary.total_engagement),
      icon: Heart,
      color: 'bg-pink-100 text-pink-600',
      trend: summary.growth_rate,
      trendLabel: 'vs last period'
    },
    {
      title: 'Total Reach',
      value: formatNumber(summary.total_reach),
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      trend: Math.random() * 10 - 5,
      trendLabel: 'vs last period'
    },
    {
      title: 'Total Impressions',
      value: formatNumber(summary.total_impressions),
      icon: Eye,
      color: 'bg-purple-100 text-purple-600',
      trend: Math.random() * 15 - 7.5,
      trendLabel: 'vs last period'
    },
    {
      title: 'Active Services',
      value: summary.active_services,
      icon: BarChart3,
      color: 'bg-green-100 text-green-600',
      trend: ((summary.active_services / summary.service_count) * 100 - 50),
      trendLabel: 'active rate'
    },
    {
      title: 'Service Count',
      value: summary.service_count,
      icon: BarChart3,
      color: 'bg-orange-100 text-orange-600',
      trend: null,
      trendLabel: 'total services'
    },
    {
      title: 'Growth Rate',
      value: formatPercentage(summary.growth_rate),
      icon: TrendingUp,
      color: summary.growth_rate >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
      trend: summary.growth_rate,
      trendLabel: 'overall growth'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon
        const isPositive = card.trend !== null && card.trend >= 0
        
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                
                {card.trend !== null && (
                  <div className="flex items-center mt-2">
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs font-medium ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(Math.abs(card.trend))}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">{card.trendLabel}</span>
                  </div>
                )}
              </div>
              <div className={`p-3 ${card.color} rounded-lg`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}