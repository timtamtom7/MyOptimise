'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useROIAnalysis, useAudienceDemographics } from '@/hooks/use-analytics'
import { useCurrentUser } from '@/hooks/use-user'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react'

export function PerformanceMetrics() {
  const { user } = useCurrentUser()
  const { data: roiData, isLoading: roiLoading } = useROIAnalysis(user?.accountId || '')
  const { data: demographics, isLoading: demographicsLoading } = useAudienceDemographics(user?.accountId || '')

  if (roiLoading || demographicsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Metrics</h1>
          <p className="text-muted-foreground">
            Detailed analytics and ROI analysis for your marketing campaigns
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const getROIColor = (roi: number) => {
    if (roi > 0.2) return 'text-green-600 dark:text-green-400'
    if (roi > 0.1) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getROIIcon = (roi: number) => {
    if (roi > 0.2) return <TrendingUp className="h-4 w-4" />
    if (roi > 0.1) return <TrendingUp className="h-4 w-4" />
    return <TrendingDown className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Metrics</h1>
        <p className="text-muted-foreground">
          Detailed analytics and ROI analysis for your marketing campaigns
        </p>
      </div>

      {/* ROI Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${roiData?.total_budget?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly marketing spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${roiData?.total_revenue?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Generated from campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall ROI</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getROIColor(roiData?.overall_roi || 0)}`}>
              {((roiData?.overall_roi || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Return on investment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${roiData?.total_profit?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue minus investment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Service ROI Performance</CardTitle>
          <CardDescription>
            Return on investment by individual marketing service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roiData?.services?.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium">{service.service_name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Budget: ${service.budget.toLocaleString()} • Revenue: ${service.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className={getROIColor(service.roi)}>
                    {getROIIcon(service.roi)}
                    <span className="ml-1">{service.roi_percentage.toFixed(1)}% ROI</span>
                  </Badge>
                  <div className="text-right">
                    <p className="font-medium text-green-600 dark:text-green-400">
                      +${service.profit.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">profit</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Audience Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Audience Demographics</CardTitle>
            <CardDescription>
              Breakdown of your audience by key demographics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Age Groups */}
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Age Groups
                </h4>
                <div className="space-y-2">
                  {Object.entries(demographics?.age_groups || {}).map(([age, count]) => (
                    <div key={age} className="flex items-center justify-between">
                      <span className="text-sm">{age}</span>
                      <span className="text-sm font-medium">{(count as number).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <h4 className="font-medium mb-3">Gender Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(demographics?.gender || {}).map(([gender, count]) => (
                    <div key={gender} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{gender}</span>
                      <span className="text-sm font-medium">{(count as number).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <PieChart className="h-4 w-4 mr-2" />
                  Top Locations
                </h4>
                <div className="space-y-2">
                  {Object.entries(demographics?.locations || {})
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([location, count]) => (
                      <div key={location} className="flex items-center justify-between">
                        <span className="text-sm">{location}</span>
                        <span className="text-sm font-medium">{(count as number).toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Audience Interests</CardTitle>
            <CardDescription>
              Top interests and preferences of your audience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(demographics?.interests || {})
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 10)
                .map(([interest, count], index) => (
                  <div key={interest} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm">{interest}</span>
                    </div>
                    <span className="text-sm font-medium">{(count as number).toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Summary</CardTitle>
          <CardDescription>
            Overall performance metrics for your marketing campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {demographics?.total_audience?.toLocaleString() || 0}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Audience</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {Object.keys(demographics?.age_groups || {}).length}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Age Segments</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {Object.keys(demographics?.interests || {}).length}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Interest Categories</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}