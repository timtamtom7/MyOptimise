import { useState, useEffect } from 'react'
import { supabase, CalendarEvent, CalendarEventWithDetails, EventType } from '@/lib/supabase'

export interface CalendarFilters {
  eventType?: EventType[]
  startDate?: string
  endDate?: string
  userId?: string
}

export function useCalendarEvents(accountId: string, filters?: CalendarFilters) {
  const [events, setEvents] = useState<CalendarEventWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }

    const fetchEvents = async () => {
      try {
        setLoading(true)
        
        let query = supabase
          .from('calendar_events')
          .select(`
            *,
            creator:users!calendar_events_created_by_fkey(*),
            account:organizations(*),
            attendees:event_attendees!event_attendees_calendar_event_id_fkey(
              *,
              user:users!event_attendees_user_id_fkey(*)
            )
          `)
          .eq('organization_id', accountId)
          .order('start_time', { ascending: true })

        // Apply filters
        if (filters?.eventType?.length) {
          query = query.in('type', filters.eventType)
        }
        if (filters?.startDate) {
          query = query.gte('start_time', filters.startDate)
        }
        if (filters?.endDate) {
          query = query.lte('end_time', filters.endDate)
        }

        const { data, error } = await query

        if (error) throw error

        // Filter by attendee if specified
        let filteredEvents = data || []
        if (filters?.userId) {
          filteredEvents = filteredEvents.filter(event => 
            event.attendees.some((attendee: any) => attendee.user_id === filters.userId)
          )
        }

        setEvents(filteredEvents)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch calendar events'))
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()

    // Subscribe to event changes
    const channel = supabase
      .channel(`calendar:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `organization_id=eq.${accountId}`,
        },
        () => {
          fetchEvents() // Refetch all events on any change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendees',
        },
        () => {
          fetchEvents() // Refetch on attendee changes
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [accountId, JSON.stringify(filters)])

  const createEvent = async (event: {
    title: string
    description?: string
    startTime: string
    endTime: string
    location?: string
    type: EventType
    attendeeIds?: string[]
  }, userId: string) => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('calendar_events')
        .insert({
          title: event.title,
          description: event.description,
          start_time: event.startTime,
          end_time: event.endTime,
          location: event.location,
          type: event.type,
          organization_id: accountId,
          created_by: userId,
        })
        .select()
        .single()

      if (eventError) throw eventError

      // Create attendees
      if (event.attendeeIds?.length) {
        const attendees = event.attendeeIds.map(attendeeId => ({
          calendar_event_id: eventData.id,
          user_id: attendeeId,
        }))

        const { error: attendeeError } = await supabase
          .from('event_attendees')
          .insert(attendees)

        if (attendeeError) throw attendeeError
      }

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: userId,
        organization_id: accountId,
        action: 'event_created',
        resource_type: 'calendar_event',
        resource_id: eventData.id,
      })

      // Emit event
      await supabase.from('event_bus').insert({
        organization_id: accountId,
        user_id: userId,
        event_type: 'event_created',
        data: { event_id: eventData.id, title: event.title },
      })

      return eventData
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create calendar event')
    }
  }

  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single()

      if (error) throw error

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: userId,
        organization_id: accountId,
        action: 'event_updated',
        resource_type: 'calendar_event',
        resource_id: eventId,
        metadata: updates,
      })

      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update calendar event')
    }
  }

  const deleteEvent = async (eventId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: userId,
        organization_id: accountId,
        action: 'event_deleted',
        resource_type: 'calendar_event',
        resource_id: eventId,
      })
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete calendar event')
    }
  }

  const addAttendee = async (eventId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .insert({
          calendar_event_id: eventId,
          user_id: userId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add attendee')
    }
  }

  const removeAttendee = async (eventId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('calendar_event_id', eventId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to remove attendee')
    }
  }

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    addAttendee,
    removeAttendee,
  }
}

export function useCalendarEvent(eventId: string) {
  const [event, setEvent] = useState<CalendarEventWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }

    const fetchEvent = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('calendar_events')
          .select(`
            *,
            creator:users!calendar_events_created_by_fkey(*),
            organization:organizations(*),
            attendees:event_attendees!event_attendees_calendar_event_id_fkey(
              *,
              user:users!event_attendees_user_id_fkey(*)
            )
          `)
          .eq('id', eventId)
          .single()

        if (error) throw error
        setEvent(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch calendar event'))
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()

    // Subscribe to event changes
    const channel = supabase
      .channel(`calendar_event:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setEvent(payload.new as CalendarEventWithDetails)
          } else if (payload.eventType === 'DELETE') {
            setEvent(null)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendees',
          filter: `calendar_event_id=eq.${eventId}`,
        },
        () => {
          fetchEvent() // Refetch on attendee changes
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  return { event, loading, error }
}

export function useUpcomingEvents(accountId: string, limit: number = 5) {
  const [events, setEvents] = useState<CalendarEventWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }

    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true)
        const now = new Date().toISOString()
        
        const { data, error } = await supabase
          .from('calendar_events')
          .select(`
            *,
            creator:users!calendar_events_created_by_fkey(*),
            organization:organizations(*),
            attendees:event_attendees!event_attendees_calendar_event_id_fkey(
              *,
              user:users!event_attendees_user_id_fkey(*)
            )
          `)
          .eq('organization_id', accountId)
          .gte('start_time', now)
          .order('start_time', { ascending: true })
          .limit(limit)

        if (error) throw error
        setEvents(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch upcoming events'))
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingEvents()

    // Subscribe to event changes
    const channel = supabase
      .channel(`upcoming_events:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `organization_id=eq.${accountId}`,
        },
        () => {
          fetchUpcomingEvents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [accountId, limit])

  return { events, loading, error }
}

export function useTodayCalendarEvents(accountId: string) {
  const [events, setEvents] = useState<CalendarEventWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }

    const fetchTodayEvents = async () => {
      try {
        setLoading(true)
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
          .from('calendar_events')
          .select(`
            *,
            creator:users!calendar_events_created_by_fkey(*),
            organization:organizations(*),
            attendees:event_attendees!event_attendees_calendar_event_id_fkey(
              *,
              user:users!event_attendees_user_id_fkey(*)
            )
          `)
          .eq('organization_id', accountId)
          .gte('start_time', todayStart.toISOString())
          .lte('start_time', todayEnd.toISOString())
          .order('start_time', { ascending: true })

        if (error) throw error
        setEvents(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch today events'))
      } finally {
        setLoading(false)
      }
    }

    fetchTodayEvents()
    
    // Subscribe to event changes
    const channel = supabase
      .channel(`today_events:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `organization_id=eq.${accountId}`,
        },
        () => {
          fetchTodayEvents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [accountId])

  return { data: events, isLoading: loading, error }
}