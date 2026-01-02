import { useState, useEffect } from 'react'
import { supabase, ClientService, ClientServiceWithMetrics, ServiceMetric, ServiceType, AnalyticsRollup } from '@/lib/supabase'

export interface AnalyticsFilters {
  serviceTypes?: ServiceType[]
  dateRange?: {
    start: string
    end: string
  }
}

export function useClientServices(accountId: string) {
  const [services, setServices] = useState<ClientServiceWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }

    const fetchServices = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('client_services')
          .select(`
            *,
            account:organizations!client_services_organization_id_fkey(*),
            metrics:service_metrics!service_metrics_service_id_fkey(*)
          `)
          .eq('organization_id', accountId)
          .order('created_at', { ascending: false })

        if (error) throw error
        
        const servicesWithMetrics = (data || []).map((service: any) => {
          // Sort metrics by date descending
          const sortedMetrics = (service.metrics || []).sort((a: ServiceMetric, b: ServiceMetric) => 
            new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime()
          )
          
          const currentMetric = sortedMetrics[0] || {}
          // Mock revenue calculation: conversions * $50
          const revenue = (currentMetric.conversions || 0) * 50
          
          return {
            ...service,
            metrics: sortedMetrics,
            current_metrics: {
              ...currentMetric,
              revenue
            }
          }
        })
        
        setServices(servicesWithMetrics)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch client services'))
      } finally {
        setLoading(false)
      }
    }

    fetchServices()

    // Subscribe to service changes
    const channel = supabase
      .channel(`client_services:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_services',
          filter: `organization_id=eq.${accountId}`,
        },
        () => {
          fetchServices() // Refetch all services on any change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_metrics',
        },
        () => {
          fetchServices() // Refetch on metric changes
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [accountId])

  const createService = async (service: {
    name: string
    description?: string
    serviceType: ServiceType
    status: string
  }, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_services')
        .insert({
          name: service.name,
          description: service.description,
          service_type: service.serviceType,
          status: service.status,
          organization_id: accountId,
        })
        .select()
        .single()

      if (error) throw error

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: userId,
        organization_id: accountId,
        action: 'service_created',
        resource_type: 'client_service',
        resource_id: data.id,
      })

      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create client service')
    }
  }

  const updateService = async (serviceId: string, updates: Partial<ClientService>, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single()

      if (error) throw error

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: userId,
        organization_id: accountId,
        action: 'service_updated',
        resource_type: 'client_service',
        resource_id: serviceId,
        metadata: updates,
      })

      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update client service')
    }
  }

  const deleteService = async (serviceId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('client_services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: userId,
        organization_id: accountId,
        action: 'service_deleted',
        resource_type: 'client_service',
        resource_id: serviceId,
      })
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete client service')
    }
  }

  const addMetric = async (serviceId: string, metric: {
    impressions: number
    engagement: number
    conversions: number
    ctr: number
    reach: number
    likes: number
    shares: number
    clicks: number
    metricDate: string
  }) => {
    try {
      const { data, error } = await supabase
        .from('service_metrics')
        .insert({
          service_id: serviceId,
          impressions: metric.impressions,
          engagement: metric.engagement,
          conversions: metric.conversions,
          ctr: metric.ctr,
          reach: metric.reach,
          likes: metric.likes,
          shares: metric.shares,
          clicks: metric.clicks,
          metric_date: metric.metricDate,
          engagement_rate: metric.engagement / (metric.impressions || 1),
        })
        .select()
        .single()

      if (error) throw error

      // Emit event
      await supabase.from('event_bus').insert({
        organization_id: accountId,
        event_type: 'service_metric_updated',
        data: { service_id: serviceId, metric_id: data.id },
      })

      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add service metric')
    }
  }

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    addMetric,
  }
}

export function useClientService(serviceId: string) {
  const [service, setService] = useState<ClientServiceWithMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!serviceId) {
      setLoading(false)
      return
    }

    const fetchService = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('client_services')
          .select(`
            *,
            account:organizations!client_services_organization_id_fkey(*),
            metrics:service_metrics!service_metrics_service_id_fkey(*)
          `)
          .eq('id', serviceId)
          .single()

        if (error) throw error
        
        // Process metrics for the single service
        const sortedMetrics = (data.metrics || []).sort((a: ServiceMetric, b: ServiceMetric) => 
          new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime()
        )
        const currentMetric = sortedMetrics[0] || {}
        const revenue = (currentMetric.conversions || 0) * 50
        
        setService({
          ...data,
          metrics: sortedMetrics,
          current_metrics: {
            ...currentMetric,
            revenue
          }
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch client service'))
      } finally {
        setLoading(false)
      }
    }

    fetchService()

    // Subscribe to service changes
    const channel = supabase
      .channel(`client_service:${serviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_services',
          filter: `id=eq.${serviceId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            // Optimistic update - would ideally refetch to get metrics
            fetchService()
          } else if (payload.eventType === 'DELETE') {
            setService(null)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_metrics',
          filter: `service_id=eq.${serviceId}`,
        },
        () => {
          fetchService() // Refetch on metric changes
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [serviceId])

  return { service, loading, error }
}

export function useAnalyticsRollups(accountId: string, filters?: AnalyticsFilters) {
  const [rollups, setRollups] = useState<AnalyticsRollup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }

    const fetchRollups = async () => {
      try {
        setLoading(true)
        
        let query = supabase
          .from('analytics_rollups')
          .select(`
            *,
            account:organizations!analytics_rollups_organization_id_fkey(*)
          `)
          .eq('organization_id', accountId)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters?.serviceTypes?.length) {
          query = query.in('service_type', filters.serviceTypes)
        }
        if (filters?.dateRange) {
          query = query
            .gte('created_at', filters.dateRange.start)
            .lte('created_at', filters.dateRange.end)
        }

        const { data, error } = await query

        if (error) throw error
        setRollups(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch analytics rollups'))
      } finally {
        setLoading(false)
      }
    }

    fetchRollups()
  }, [accountId, JSON.stringify(filters)])

  return { rollups, loading, error }
}

export function useAnalyticsSummary(accountId: string, serviceTypes?: ServiceType[]) {
  const [summary, setSummary] = useState<{
    totalImpressions: number
    totalEngagement: number
    totalConversions: number
    averageCTR: number
    totalReach: number
    serviceBreakdown: Record<ServiceType, {
      impressions: number
      engagement: number
      conversions: number
      ctr: number
      reach: number
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }

    const fetchSummary = async () => {
      try {
        setLoading(true)
        
        // Get the latest metrics for each service
        let query = supabase
          .from('service_metrics')
          .select(`
            *,
            service:client_services!service_metrics_service_id_fkey(
              *,
              account:organizations(*)
            )
          `)
          .eq('service.organization_id', accountId)

        if (serviceTypes?.length) {
          query = query.in('service.service_type', serviceTypes)
        }

        const { data, error } = await query

        if (error) throw error

        // Calculate summary
        const serviceBreakdown: any = {}
        let totalImpressions = 0
        let totalEngagement = 0
        let totalConversions = 0
        let totalCTR = 0
        let totalReach = 0
        let metricCount = 0

        data?.forEach((metric: any) => {
          if (!metric.service) return
          const serviceType = metric.service.service_type
          if (!serviceBreakdown[serviceType]) {
            serviceBreakdown[serviceType] = {
              impressions: 0,
              engagement: 0,
              conversions: 0,
              ctr: 0,
              reach: 0,
            }
          }

          serviceBreakdown[serviceType].impressions += metric.impressions
          serviceBreakdown[serviceType].engagement += metric.engagement
          serviceBreakdown[serviceType].conversions += metric.conversions
          serviceBreakdown[serviceType].ctr += metric.ctr
          serviceBreakdown[serviceType].reach += metric.reach

          totalImpressions += metric.impressions
          totalEngagement += metric.engagement
          totalConversions += metric.conversions
          totalCTR += metric.ctr
          totalReach += metric.reach
          metricCount++
        })

        // Calculate averages
        Object.keys(serviceBreakdown).forEach(serviceType => {
          serviceBreakdown[serviceType].ctr /= metricCount || 1
        })

        setSummary({
          totalImpressions,
          totalEngagement,
          totalConversions,
          averageCTR: totalCTR / (metricCount || 1),
          totalReach,
          serviceBreakdown,
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch analytics summary'))
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [accountId, JSON.stringify(serviceTypes)])

  return { summary, loading, error }
}

export function useROIAnalysis(accountId: string) {
  const [data, setData] = useState<{ total_budget: number; total_revenue: number; roi: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }
    
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch services for budget
        const { data: services } = await supabase
          .from('client_services')
          .select('monthly_budget')
          .eq('organization_id', accountId)
          .eq('status', 'active')

        // Fetch metrics for revenue (mock: conversions * 50)
        const { data: metrics } = await supabase
          .from('service_metrics')
          .select('conversions')
          .eq('service_id', (await supabase.from('client_services').select('id').eq('organization_id', accountId)).data?.map(s => s.id) || [])

        // Actually we need to join or do separate queries correctly. 
        // Simplest: get all services with metrics
        const { data: servicesWithMetrics } = await supabase
          .from('client_services')
          .select(`
            monthly_budget,
            metrics:service_metrics(conversions)
          `)
          .eq('organization_id', accountId)
          
        let total_budget = 0
        let total_revenue = 0

        servicesWithMetrics?.forEach((s: any) => {
          total_budget += s.monthly_budget || 0
          s.metrics?.forEach((m: any) => {
            total_revenue += (m.conversions || 0) * 50
          })
        })

        const roi = total_budget > 0 ? (total_revenue - total_budget) / total_budget : 0

        setData({ total_budget, total_revenue, roi })
      } catch (e) {
        console.error(e)
        setData({ total_budget: 0, total_revenue: 0, roi: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [accountId])

  return { data, isLoading: loading }
}

export function useAudienceDemographics(accountId: string) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }
    // Mock implementation for now as we don't have demographics table
    setData({
      age_groups: {
        '18-24': 25,
        '25-34': 45,
        '35-44': 20,
        '45+': 10
      },
      locations: {
        'USA': 60,
        'UK': 15,
        'Canada': 10,
        'Other': 15
      }
    })
    setLoading(false)
  }, [accountId])

  return { data, isLoading: loading }
}

export function useTodayKeyMetrics(accountId: string) {
  const [data, setData] = useState<{ 
    total_followers: number; 
    new_followers: number; 
    engagement_rate: number;
    total_revenue: number;
    roi: number;
    total_clicks: number;
    total_conversions: number;
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }
    
    const fetchData = async () => {
      try {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]
        
        // Get all active services and their latest metrics
        const { data: services } = await supabase
          .from('client_services')
          .select(`
            monthly_budget,
            metrics:service_metrics(*)
          `)
          .eq('organization_id', accountId)
          .eq('status', 'active')

        let total_followers = 0
        let new_followers = 0
        let total_engagement = 0
        let total_revenue = 0
        let total_budget = 0
        let total_clicks = 0
        let total_conversions = 0
        let metric_count = 0

        services?.forEach((s: any) => {
          total_budget += s.monthly_budget || 0
          
          // Sort metrics desc
          const sorted = (s.metrics || []).sort((a: any, b: any) => 
            new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime()
          )
          
          if (sorted.length > 0) {
            const latest = sorted[0]
            // Assumption: likes ~ followers for mock? No, that's bad. 
            // Let's use reach as proxy for followers if followers not available, 
            // but ServiceMetric doesn't have followers column in schema I saw.
            // Wait, useClientServices in component showed 'service.current_metrics.followers'.
            // Schema check earlier: clicks, conversions, created_at, ctr, engagement_rate, impressions, likes, metric_date, reach, service_id, shares.
            // No 'followers'. So I will use 'reach' as total followers proxy.
            
            total_followers += latest.reach || 0
            total_engagement += latest.engagement_rate || 0
            total_clicks += latest.clicks || 0
            total_conversions += latest.conversions || 0
            total_revenue += (latest.conversions || 0) * 50
            metric_count++

            // New followers today? Mock it: 1% of reach
            new_followers += Math.floor((latest.reach || 0) * 0.01)
          }
        })

        const avg_engagement = metric_count > 0 ? total_engagement / metric_count : 0
        const roi = total_budget > 0 ? (total_revenue - total_budget) / total_budget : 0

        setData({ 
          total_followers, 
          new_followers, 
          engagement_rate: avg_engagement,
          total_revenue,
          roi,
          total_clicks,
          total_conversions
        })
      } catch (e) {
        console.error(e)
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [accountId])

  return { data, isLoading: loading }
}

export function useServiceMetrics(accountId: string) {
  const [data, setData] = useState<{
    total_services: number;
    active_services: number;
    total_budget: number;
    by_service_type: Record<string, { active_count: number; avg_engagement: number }>;
    top_performing: any[];
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: services } = await supabase
          .from('client_services')
          .select(`
            *,
            metrics:service_metrics(*)
          `)
          .eq('organization_id', accountId)

        const total_services = services?.length || 0
        const active_services = services?.filter(s => s.status === 'active').length || 0
        const total_budget = services?.reduce((sum, s) => sum + (s.monthly_budget || 0), 0) || 0
        
        const by_service_type: Record<string, { active_count: number; avg_engagement: number; count: number; total_eng: number }> = {}
        const service_performance: any[] = []

        services?.forEach((s: any) => {
          // By type
          if (!by_service_type[s.service_type]) {
            by_service_type[s.service_type] = { active_count: 0, avg_engagement: 0, count: 0, total_eng: 0 }
          }
          
          if (s.status === 'active') {
            by_service_type[s.service_type].active_count++
          }
          
          const sorted = (s.metrics || []).sort((a: any, b: any) => 
            new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime()
          )
          const latest = sorted[0]
          const eng = latest?.engagement_rate || 0
          
          by_service_type[s.service_type].count++
          by_service_type[s.service_type].total_eng += eng

          // Performance
          const revenue = (latest?.conversions || 0) * 50
          const roi = s.monthly_budget > 0 ? (revenue - s.monthly_budget) / s.monthly_budget : 0
          
          service_performance.push({
            service_name: s.name,
            service_type: s.service_type,
            engagement_rate: eng,
            roi
          })
        })

        // Finalize averages
        Object.keys(by_service_type).forEach(k => {
          by_service_type[k].avg_engagement = by_service_type[k].count > 0 
            ? by_service_type[k].total_eng / by_service_type[k].count 
            : 0
        })

        // Sort top performing
        service_performance.sort((a, b) => b.engagement_rate - a.engagement_rate)

        setData({
          total_services,
          active_services,
          total_budget,
          by_service_type,
          top_performing: service_performance
        })

      } catch (e) {
        console.error(e)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [accountId])

  return { data, isLoading: loading }
}

export function useEngagementTrends(accountId: string, days: number) {
  const [data, setData] = useState<{ dates: string[]; followers: number[]; engagement: number[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - days)
        
        // Fetch metrics for all services in range
        const { data: metrics } = await supabase
          .from('service_metrics')
          .select(`
            metric_date,
            reach,
            engagement_rate,
            service:client_services!inner(organization_id)
          `)
          .eq('service.organization_id', accountId)
          .gte('metric_date', startDate.toISOString())
          .lte('metric_date', endDate.toISOString())
          .order('metric_date', { ascending: true })
          
        // Aggregate by date
        const byDate: Record<string, { reach: number; engagement: number; count: number }> = {}
        
        metrics?.forEach((m: any) => {
          const date = m.metric_date.split('T')[0]
          if (!byDate[date]) {
            byDate[date] = { reach: 0, engagement: 0, count: 0 }
          }
          byDate[date].reach += m.reach || 0
          byDate[date].engagement += m.engagement_rate || 0
          byDate[date].count++
        })
        
        const dates = Object.keys(byDate).sort()
        const followers = dates.map(d => byDate[d].reach) // Mock followers as reach
        const engagement = dates.map(d => byDate[d].count > 0 ? byDate[d].engagement / byDate[d].count : 0)
        
        setData({ dates, followers, engagement })
      } catch (e) {
        console.error(e)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [accountId, days])

  return { data, isLoading: loading }
}
