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

  return { data: events, isLoading: loading, error }
}

export function useTodayCalendarEvents(accountId: string) {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0] + 'T00:00:00.000Z';
  const endDate = today.toISOString().split('T')[0] + 'T23:59:59.999Z';
  
  return useCalendarEvents(accountId, { startDate, endDate });
}

export function useWeekCalendarEvents(accountId: string) {
  return useCalendarEvents(accountId);
}

export function useCreateCalendarEvent() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createEvent = async (event: {
    title: string
    description?: string
    startTime: string
    endTime: string
    location?: string
    type: EventType
    attendeeIds?: string[]
  }, userId: string) => {
    setIsCreating(true);
    try {
      // Need accountId, but it's not passed here. Assuming context or requiring it in args.
      // The original code used a closure over accountId which was weird for a separate hook.
      // I'll update the signature to require accountId or fetch user session.
      // For now, I'll fetch the user's organization_id from the session if possible, 
      // or assume the caller passes it (which they don't in the example).
      // Let's look at the usage: createEvent({...}, user.id)
      
      // Wait, the usage in calendar-view.tsx is: createEvent({...}, user.id)
      // It doesn't pass accountId. This is a problem with the legacy code.
      // I will hack it to fetch the user's org from supabase if needed, or just require it.
      
      // Since this is legacy/backup code, I'll just do a best effort.
      
      // Fetch user's org
      const { data: userData } = await supabase.from('users').select('organization_id').eq('id', userId).single();
      const accountId = userData?.organization_id;

      if (!accountId) throw new Error("Organization not found");

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

      return eventData
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create event'));
      throw err;
    } finally {
      setIsCreating(false);
    }
  }

  return { createEvent, isCreating, error };
}
