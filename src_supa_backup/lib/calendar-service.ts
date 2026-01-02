import { supabase, CalendarEvent, CalendarEventWithAttendees, User } from '@/lib/supabase'

export interface CalendarFilters {
  startDate?: string
  endDate?: string
  userId?: string
  search?: string
}

export interface CalendarEventCreateData {
  title: string
  description?: string
  startTime: string
  endTime: string
  attendeeIds?: string[]
}

export interface CalendarEventUpdateData {
  title?: string
  description?: string
  startTime?: string
  endTime?: string
  attendeeIds?: string[]
}

export class CalendarService {
  private userId: string
  private accountId: string

  constructor(userId: string, accountId: string) {
    this.userId = userId
    this.accountId = accountId
  }

  async getEvents(filters: CalendarFilters = {}): Promise<CalendarEventWithAttendees[]> {
    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        created_by_user:users!calendar_events_created_by_fkey(*),
        calendar_event_attendees(*, user:users(*))
      `)
      .eq('organization_id', this.accountId)
      .order('start_time', { ascending: true })

    if (filters.startDate) {
      query = query.gte('start_time', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('end_time', filters.endDate)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching calendar events:', error)
      return []
    }

    return (data || []).map(event => ({
      ...event,
      created_by_user: event.created_by_user,
      attendees: event.calendar_event_attendees?.map((attendee: any) => attendee.user) || []
    }))
  }

  async getEventById(eventId: string): Promise<CalendarEventWithDetails | null> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select(`
        *,
        created_by_user:users!calendar_events_created_by_fkey(*),
        account:organizations(*),
        calendar_event_attendees(*, user:users(*))
      `)
      .eq('id', eventId)
      .eq('organization_id', this.accountId)
      .single()

    if (error || !data) {
      console.error('Error fetching calendar event:', error)
      return null
    }

    return {
      ...data,
      created_by_user: data.created_by_user,
      attendees: data.calendar_event_attendees?.map((attendee: any) => attendee.user) || []
    }
  }

  async createEvent(eventData: CalendarEventCreateData): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        organization_id: this.accountId,
        created_by: this.userId,
        title: eventData.title,
        description: eventData.description,
        start_time: eventData.startTime,
        end_time: eventData.endTime
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating calendar event:', error)
      return null
    }

    if (eventData.attendeeIds?.length) {
      await this.updateEventAttendees(data.id, eventData.attendeeIds)
    }

    await this.logActivity('calendar_event_created', {
      event_id: data.id,
      title: eventData.title
    })

    return data
  }

  async updateEvent(eventId: string, eventData: CalendarEventUpdateData): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        ...eventData,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .eq('organization_id', this.accountId)
      .select()
      .single()

    if (error) {
      console.error('Error updating calendar event:', error)
      return null
    }

    if (eventData.attendeeIds) {
      await this.updateEventAttendees(eventId, eventData.attendeeIds)
    }

    await this.logActivity('calendar_event_updated', {
      event_id: eventId,
      changes: eventData
    })

    return data
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('organization_id', this.accountId)

    if (error) {
      console.error('Error deleting calendar event:', error)
      return false
    }

    await this.logActivity('calendar_event_deleted', {
      event_id: eventId
    })

    return true
  }

  async updateEventAttendees(eventId: string, attendeeIds: string[]): Promise<void> {
    await supabase.from('calendar_event_attendees').delete().eq('calendar_event_id', eventId)

    if (attendeeIds.length > 0) {
      const attendeeInserts = attendeeIds.map(userId => ({
        calendar_event_id: eventId,
        user_id: userId
      }))
      await supabase.from('calendar_event_attendees').insert(attendeeInserts)
    }
  }

  async getUserEvents(userId: string, filters: CalendarFilters = {}): Promise<CalendarEventWithAttendees[]> {
    const allEvents = await this.getEvents(filters)
    return allEvents.filter(event => 
      event.created_by === userId || 
      event.attendees.some(attendee => attendee.id === userId)
    )
  }

  async getUpcomingEvents(limit: number = 10): Promise<CalendarEventWithAttendees[]> {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('calendar_events')
      .select(`
        *,
        created_by_user:users!calendar_events_created_by_fkey(*),
        calendar_event_attendees(*, user:users(*))
      `)
      .eq('organization_id', this.accountId)
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching upcoming events:', error)
      return []
    }

    return (data || []).map(event => ({
      ...event,
      created_by_user: event.created_by_user,
      attendees: event.calendar_event_attendees?.map((attendee: any) => attendee.user) || []
    }))
  }

  async getEventsForDate(date: string): Promise<CalendarEventWithAttendees[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return this.getEvents({
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString()
    })
  }

  private async logActivity(action: string, details: any): Promise<void> {
    await supabase.from('audit_logs').insert({
      organization_id: this.accountId,
      user_id: this.userId,
      action: `calendar_${action}`,
      metadata: details,
      resource_type: 'calendar_event',
      resource_id: null
    })
  }
}
