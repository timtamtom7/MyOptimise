import { useState, useEffect } from 'react'
import { supabase, ClientService, ClientServiceWithMetrics, ServiceMetric, ServiceType, AnalyticsRollup } from '@/lib/supabase'

export interface AnalyticsFilters {
  serviceTypes?: ServiceType[]
  dateRange?: {
    start: string
    end: string
  }
}

export function useClientServices(organizationId: string) {
  const [services, setServices] = useState<ClientServiceWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!organizationId) {
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
            organization:organizations!client_services_organization_id_fkey(*),
            metrics:service_metrics!service_metrics_service_id_fkey(*)
          `)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setServices(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch client services'))
      } finally {
        setLoading(false)
      }
    }

    fetchServices()

    // Subscribe to service changes
    const channel = supabase
      .channel(`client_services:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_services',
          filter: `organization_id=eq.${organizationId}`,
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
  }, [organizationId])

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
          organization_id: organizationId,
        })
        .select()
        .single()

      if (error) throw error

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: userId,
        organization_id: organizationId,
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
        organization_id: organizationId,
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
        organization_id: organizationId,
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
        organization_id: organizationId,
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
            organization:organizations!client_services_organization_id_fkey(*),
            metrics:service_metrics!service_metrics_service_id_fkey(*)
          `)
          .eq('id', serviceId)
          .single()

        if (error) throw error
        setService(data)
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
            setService(payload.new as ClientServiceWithMetrics)
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

export function useAnalyticsRollups(organizationId: string, filters?: AnalyticsFilters) {
  const [rollups, setRollups] = useState<AnalyticsRollup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!organizationId) {
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
            organization:organizations!analytics_rollups_organization_id_fkey(*)
          `)
          .eq('organization_id', organizationId)
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
  }, [organizationId, JSON.stringify(filters)])

  return { rollups, loading, error }
}

export function useAnalyticsSummary(organizationId: string, serviceTypes?: ServiceType[]) {
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
    if (!organizationId) {
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
              organization:organizations(*)
            )
          `)
          .eq('service.organization_id', organizationId)

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

        data?.forEach(metric => {
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
          serviceBreakdown[serviceType].ctr /= metricCount
        })

        setSummary({
          totalImpressions,
          totalEngagement,
          totalConversions,
          averageCTR: totalCTR / metricCount,
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
  }, [organizationId, JSON.stringify(serviceTypes)])

  return { summary, loading, error }
}