'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTodayKeyMetrics, useServiceMetrics, useEngagementTrends } from '@/hooks/use-analytics'
import { useCurrentUser } from '@/hooks/use-user'
import { formatDate } from '@/lib/date-formatting'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Mail,
  Globe,
  Share2
} from 'lucide-react'
import { Instagram, Facebook } from '@/components/icons/brands'

export function AnalyticsOverview() {
  const { user } = useCurrentUser()
  const { data: keyMetrics, isLoading: metricsLoading } = useTodayKeyMetrics(user?.accountId || '')
  const { data: serviceMetrics, isLoading: servicesLoading } = useServiceMetrics(user?.accountId || '')
  const { data: engagementTrends, isLoading: trendsLoading } = useEngagementTrends(user?.accountId || '', 7)

  if (metricsLoading || servicesLoading || trendsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
          <p className="text-muted-foreground">
            Your marketing performance at a glance
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'instagram': return <Instagram className="h-4 w-4" />
      case 'facebook': return <Facebook className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'website': return <Globe className="h-4 w-4" />
      case 'pinterest': return <Share2 className="h-4 w-4" />
      default: return <TrendingUp className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
        <p className="text-muted-foreground">
          Your marketing performance at a glance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {keyMetrics?.total_followers?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{keyMetrics?.new_followers || 0} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(keyMetrics?.engagement_rate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${keyMetrics?.total_revenue?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              From marketing campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((keyMetrics?.roi || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Return on investment
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Service Performance</CardTitle>
            <CardDescription>
              Performance metrics by service type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(serviceMetrics?.by_service_type || {}).map(([type, metrics]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {getServiceIcon(type)}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{type}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {metrics.active_count} active services
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{metrics.avg_engagement.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      engagement
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Services</CardTitle>
            <CardDescription>
              Services with highest engagement rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceMetrics?.top_performing?.slice(0, 5).map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{service.service_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {service.service_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{service.engagement_rate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(service.roi * 100).toFixed(1)}% ROI
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Engagement Trends</CardTitle>
            <CardDescription>
              Follower growth and engagement over the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagementTrends?.dates?.map((date, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(date, 'EEE, MMM d')}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">
                      {engagementTrends?.followers?.[index]?.toLocaleString()} followers
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400">
                      +{engagementTrends?.engagement?.[index]?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Summary</CardTitle>
            <CardDescription>
              Overview of your active marketing services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Services</span>
                <span className="text-sm font-bold">{serviceMetrics?.total_services || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Services</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {serviceMetrics?.active_services || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Monthly Budget</span>
                <span className="text-sm font-bold">
                  ${serviceMetrics?.total_budget?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Clicks</span>
                <span className="text-sm font-bold">
                  {keyMetrics?.total_clicks?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Conversions</span>
                <span className="text-sm font-bold">
                  {keyMetrics?.total_conversions?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}