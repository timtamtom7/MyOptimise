'use client'

import { useState } from 'react'
import { useClientServices } from '@/hooks/use-analytics'
import { useCurrentUser } from '@/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Settings, 
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Instagram,
  Facebook,
  Mail,
  Globe,
  Share2,
  Target,
  Briefcase
} from 'lucide-react'

export function ServicesDashboard() {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const { user } = useCurrentUser()
  const { data: services, isLoading } = useClientServices(user?.organization_id || '', user?.id)

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'instagram': return <Instagram className="h-5 w-5" />
      case 'facebook': return <Facebook className="h-5 w-5" />
      case 'email': return <Mail className="h-5 w-5" />
      case 'website': return <Globe className="h-5 w-5" />
      case 'pinterest': return <Share2 className="h-5 w-5" />
      default: return <TrendingUp className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Services</h1>
            <p className="text-muted-foreground">Manage your marketing services and campaigns</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage your marketing services and campaigns</p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Service
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services?.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    {getServiceIcon(service.service_type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{service.service_name}</CardTitle>
                    <CardDescription className="capitalize">
                      {service.service_type} Marketing
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(service.status)}>
                  {service.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold">
                    {service.current_metrics.followers?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Followers</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold">
                    {service.current_metrics.engagement_rate?.toFixed(1) || 0}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Engagement</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold">
                    ${service.current_metrics.revenue?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Revenue</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="text-2xl font-bold">
                    {service.current_metrics.conversions?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Conversions</div>
                </div>
              </div>

              {/* Budget and Duration */}
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Monthly Budget:</span>
                  <span className="font-medium ml-1">${service.monthly_budget.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Started:</span>
                  <span className="font-medium ml-1">
                    {format(new Date(service.start_date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setSelectedService(service.id)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services?.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Services Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You don&apos;t have any active marketing services yet.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Service
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Service Details Dialog */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Service Settings</DialogTitle>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Service Configuration</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure your service settings and preferences here.
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Active</Button>
                    <Button variant="outline" size="sm">Paused</Button>
                    <Button variant="outline" size="sm">Cancelled</Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Monthly Budget</label>
                  <div className="text-2xl font-bold">
                    ${services?.find(s => s.id === selectedService)?.monthly_budget.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}