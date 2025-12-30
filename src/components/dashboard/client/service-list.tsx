'use client'

import { useState, useEffect } from 'react'
import { ClientService } from '../../../lib/supabase'
import { AnalyticsService, createAnalyticsService, ServiceAnalytics } from '../../../lib/analytics-service'
import { Instagram, Facebook, Mail, Globe, Video, MessageCircle, Linkedin, TrendingUp, TrendingDown, Users, Eye, Heart } from 'lucide-react'

interface ServiceListProps {
  userId: string
}

const serviceIcons = {
  instagram: Instagram,
  facebook: Facebook,
  email: Mail,
  website: Globe,
  tiktok: Video,
  pinterest: MessageCircle,
  linkedin: Linkedin,
  youtube: Video
}

const serviceColors = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  facebook: 'bg-blue-600',
  email: 'bg-red-600',
  website: 'bg-gray-600',
  tiktok: 'bg-black',
  pinterest: 'bg-red-500',
  linkedin: 'bg-blue-700',
  youtube: 'bg-red-600'
}

export default function ServiceList({ userId }: ServiceListProps) {
  const [services, setServices] = useState<ServiceAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [analyticsService, setAnalyticsService] = useState<AnalyticsService | null>(null)

  useEffect(() => {
    const initAnalyticsService = async () => {
      try {
        const service = await createAnalyticsService(userId)
        setAnalyticsService(service)
        await loadServices(service)
      } catch (error) {
        console.error('Error initializing analytics service:', error)
      } finally {
        setLoading(false)
      }
    }

    initAnalyticsService()
  }, [userId])

  const loadServices = async (service: AnalyticsService) => {
    try {
      const serviceData = await service.getClientServices()
      const serviceAnalytics = await Promise.all(
        serviceData.map(async (service) => {
          const analytics = await service.getServiceAnalytics(service.id)
          return analytics
        })
      )
      setServices(serviceAnalytics.filter(sa => sa !== null) as ServiceAnalytics[])
    } catch (error) {
      console.error('Error loading services:', error)
    }
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
            <BarChart3 className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Found</h3>
          <p className="text-gray-500">No marketing services have been configured for your account yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((serviceAnalytics) => {
        const { service, total_engagement, total_reach, total_impressions, growth_rate } = serviceAnalytics
        const Icon = serviceIcons[service.service_type] || Globe
        const colorClass = serviceColors[service.service_type] || 'bg-gray-600'
        const isGrowing = growth_rate >= 0

        return (
          <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`p-3 ${colorClass} text-white rounded-lg`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{service.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{service.service_type}</p>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                  service.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {service.status}
                </div>
              </div>
            </div>

            {service.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span className="text-sm text-gray-600">Engagement</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(total_engagement)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Reach</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(total_reach)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-gray-600">Impressions</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(total_impressions)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  {isGrowing ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-600">Growth</span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    isGrowing ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(Math.abs(growth_rate))}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button className="w-full px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                View Details
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}