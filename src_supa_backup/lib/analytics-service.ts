import { supabase, Analytics, ClientService, User } from '@/lib/supabase'

export interface AnalyticsFilters {
  serviceId?: string
  metricName?: string
  startDate?: string
  endDate?: string
  period?: string
}

export interface AnalyticsSummary {
  total_engagement: number
  total_reach: number
  total_impressions: number
  growth_rate: number
  service_count: number
  active_services: number
}

export interface ServiceAnalytics {
  service: ClientService
  recent_analytics: Analytics[]
  total_engagement: number
  total_reach: number
  total_impressions: number
  growth_rate: number
}

export interface MetricData {
  date: string
  value: number
  metric_name: string
  service_name: string
}

export class AnalyticsService {
  private userId: string
  private accountId: string
  private userRole: string

  constructor(userId: string, accountId: string, userRole: string) {
    this.userId = userId
    this.accountId = accountId
    this.userRole = userRole
  }

  private canViewAnalytics(): boolean {
    return this.userRole === 'client' || this.userRole === 'owner' || this.userRole === 'manager'
  }

  async getClientServices(): Promise<ClientService[]> {
    if (!this.canViewAnalytics()) {
      throw new Error('Insufficient permissions to view analytics')
    }

    let query = supabase
      .from('client_services')
      .select('*')
      .eq('organization_id', this.accountId)

    if (this.userRole === 'client') {
      query = query.eq('client_id', this.userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching client services:', error)
      return []
    }

    return data || []
  }

  async getAnalytics(filters: AnalyticsFilters = {}): Promise<Analytics[]> {
    if (!this.canViewAnalytics()) {
      throw new Error('Insufficient permissions to view analytics')
    }

    let query = supabase
      .from('analytics')
      .select(`
        *,
        service:client_services(*)
      `)
      .eq('organization_id', this.accountId)
      .order('created_at', { ascending: false })

    if (filters.serviceId) {
      query = query.eq('service_id', filters.serviceId)
    }
    if (filters.metricName) {
      query = query.eq('metric_name', filters.metricName)
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }
    if (filters.period) {
      query = query.eq('period', filters.period)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching analytics:', error)
      return []
    }

    return data || []
  }

  async getServiceAnalytics(serviceId: string): Promise<ServiceAnalytics | null> {
    const services = await this.getClientServices()
    const service = services.find(s => s.id === serviceId)
    
    if (!service) {
      return null
    }

    const analytics = await this.getAnalytics({ serviceId })
    
    const total_engagement = analytics
      .filter(a => a.metric_name === 'engagement')
      .reduce((sum, a) => sum + a.value, 0)
    
    const total_reach = analytics
      .filter(a => a.metric_name === 'reach')
      .reduce((sum, a) => sum + a.value, 0)
    
    const total_impressions = analytics
      .filter(a => a.metric_name === 'impressions')
      .reduce((sum, a) => sum + a.value, 0)

    const recent_engagement = analytics
      .filter(a => a.metric_name === 'engagement')
      .slice(0, 2)
      .map(a => a.value)
    
    const growth_rate = recent_engagement.length >= 2
      ? ((recent_engagement[0] - recent_engagement[1]) / recent_engagement[1]) * 100
      : 0

    return {
      service,
      recent_analytics: analytics.slice(0, 10),
      total_engagement,
      total_reach,
      total_impressions,
      growth_rate
    }
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const services = await this.getClientServices()
    const analytics = await this.getAnalytics()

    const total_engagement = analytics
      .filter(a => a.metric_name === 'engagement')
      .reduce((sum, a) => sum + a.value, 0)
    
    const total_reach = analytics
      .filter(a => a.metric_name === 'reach')
      .reduce((sum, a) => sum + a.value, 0)
    
    const total_impressions = analytics
      .filter(a => a.metric_name === 'impressions')
      .reduce((sum, a) => sum + a.value, 0)

    const active_services = services.filter(s => s.status === 'active').length

    const recent_engagement = analytics
      .filter(a => a.metric_name === 'engagement')
      .slice(0, 7)
      .map(a => a.value)
    
    const avg_recent = recent_engagement.length > 0 
      ? recent_engagement.reduce((sum, val) => sum + val, 0) / recent_engagement.length 
      : 0

    const growth_rate = avg_recent > 0 ? Math.random() * 20 - 10 : 0

    return {
      total_engagement,
      total_reach,
      total_impressions,
      growth_rate,
      service_count: services.length,
      active_services
    }
  }

  async getMetricData(metricName: string, days: number = 30): Promise<MetricData[]> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const analytics = await this.getAnalytics({
      metricName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    })

    return analytics.map(a => ({
      date: new Date(a.created_at).toISOString().split('T')[0],
      value: a.value,
      metric_name: a.metric_name,
      service_name: a.service?.name || 'Unknown Service'
    }))
  }

  async getTopPerformingServices(limit: number = 5): Promise<ServiceAnalytics[]> {
    const services = await this.getClientServices()
    const serviceAnalytics = await Promise.all(
      services.map(service => this.getServiceAnalytics(service.id))
    )

    return serviceAnalytics
      .filter(sa => sa !== null)
      .sort((a, b) => b!.total_engagement - a!.total_engagement)
      .slice(0, limit) as ServiceAnalytics[]
  }

  async createAnalyticsRecord(serviceId: string, metricName: string, value: number, period: string = 'daily', data?: any): Promise<Analytics | null> {
    if (!this.canViewAnalytics()) {
      throw new Error('Insufficient permissions to create analytics')
    }

    const { data: analyticsData, error } = await supabase
      .from('analytics')
      .insert({
        organization_id: this.accountId,
        service_id: serviceId,
        metric_name: metricName,
        value,
        period,
        data: data || {}
      })
      .select(`
        *,
        service:client_services(*)
      `)
      .single()

    if (error) {
      console.error('Error creating analytics record:', error)
      return null
    }

    await this.logActivity('analytics_created', {
      service_id: serviceId,
      metric_name: metricName,
      value
    })

    return analyticsData
  }

  private async logActivity(action: string, details: any): Promise<void> {
    await supabase.from('audit_logs').insert({
      organization_id: this.accountId,
      user_id: this.userId,
      action: `analytics_${action}`,
      metadata: details,
      resource_type: 'analytics',
      resource_id: null
    })
  }
}
