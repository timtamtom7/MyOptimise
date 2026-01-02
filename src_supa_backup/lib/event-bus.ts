import { supabase } from './supabase'

export interface EventData {
  type: string
  payload: any
  timestamp: string
  accountId: string
  userId: string
  metadata?: Record<string, any>
}

export interface EventSubscription {
  id: string
  eventTypes: string[]
  callback: (event: EventData) => void
  accountId?: string
  userId?: string
}

export interface EventFilter {
  eventTypes?: string[]
  accountId?: string
  userId?: string
  startDate?: string
  endDate?: string
}

export class EventBus {
  private subscriptions: Map<string, EventSubscription> = new Map()
  private realtimeChannel: any = null
  private isConnected: boolean = false

  constructor() {
    this.initializeRealtime()
  }

  private initializeRealtime(): void {
    this.realtimeChannel = supabase
      .channel('events')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload: any) => {
          this.handleDatabaseEvent(payload.new)
        }
      )
      .subscribe((status: string) => {
        this.isConnected = status === 'SUBSCRIBED'
        console.log('EventBus connection status:', status)
      })
  }

  private handleDatabaseEvent(eventRecord: any): void {
    const eventData: EventData = {
      type: eventRecord.event_type,
      payload: eventRecord.data,
      timestamp: eventRecord.created_at,
      accountId: eventRecord.organization_id,
      userId: eventRecord.user_id,
      metadata: eventRecord.metadata || {}
    }

    this.notifySubscribers(eventData)
  }

  private notifySubscribers(event: EventData): void {
    this.subscriptions.forEach((subscription) => {
      const matchesEventType = subscription.eventTypes.includes(event.type) || subscription.eventTypes.includes('*')
      const matchesAccount = !subscription.accountId || subscription.accountId === event.accountId
      const matchesUser = !subscription.userId || subscription.userId === event.userId

      if (matchesEventType && matchesAccount && matchesUser) {
        try {
          subscription.callback(event)
        } catch (error) {
          console.error(`Error in event subscription ${subscription.id}:`, error)
        }
      }
    })
  }

  async emit(eventType: string, payload: any, accountId: string, userId: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const { error } = await supabase.from('events').insert({
        event_type: eventType,
        data: payload,
        organization_id: accountId,
        user_id: userId,
        metadata: metadata || {}
      })

      if (error) {
        console.error('Error emitting event to database:', error)
        throw error
      }

      const eventData: EventData = {
        type: eventType,
        payload,
        timestamp: new Date().toISOString(),
        accountId,
        userId,
        metadata
      }

      this.notifySubscribers(eventData)
    } catch (error) {
      console.error('Error emitting event:', error)
      throw error
    }
  }

  subscribe(eventTypes: string[], callback: (event: EventData) => void, accountId?: string, userId?: string): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventTypes,
      callback,
      accountId,
      userId
    }

    this.subscriptions.set(subscriptionId, subscription)
    return subscriptionId
  }

  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId)
  }

  async getEvents(filter: EventFilter = {}): Promise<EventData[]> {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter.eventTypes && filter.eventTypes.length > 0) {
        query = query.in('event_type', filter.eventTypes)
      }

      if (filter.accountId) {
        query = query.eq('organization_id', filter.accountId)
      }

      if (filter.userId) {
        query = query.eq('user_id', filter.userId)
      }

      if (filter.startDate) {
        query = query.gte('created_at', filter.startDate)
      }

      if (filter.endDate) {
        query = query.lte('created_at', filter.endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching events:', error)
        return []
      }

      return (data || []).map(record => ({
        type: record.event_type,
        payload: record.data,
        timestamp: record.created_at,
        accountId: record.organization_id,
        userId: record.user_id,
        metadata: record.metadata || {}
      }))
    } catch (error) {
      console.error('Error fetching events:', error)
      return []
    }
  }

  disconnect(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel)
      this.realtimeChannel = null
    }
    this.subscriptions.clear()
    this.isConnected = false
  }

  isRealtimeConnected(): boolean {
    return this.isConnected
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size
  }
}

export const eventBus = new EventBus()

export const EVENT_TYPES = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  
  CALENDAR_EVENT_CREATED: 'calendar_event_created',
  CALENDAR_EVENT_UPDATED: 'calendar_event_updated',
  CALENDAR_EVENT_DELETED: 'calendar_event_deleted',
  CALENDAR_EVENT_ATTENDEE_ADDED: 'calendar_event_attendee_added',
  CALENDAR_EVENT_ATTENDEE_REMOVED: 'calendar_event_attendee_removed',
  
  MESSAGE_SENT: 'message_sent',
  MESSAGE_THREAD_CREATED: 'message_thread_created',
  MESSAGE_THREAD_UPDATED: 'message_thread_updated',
  
  ANALYTICS_UPDATED: 'analytics_updated',
  SERVICE_CREATED: 'service_created',
  SERVICE_UPDATED: 'service_updated',
  
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_ROLE_CHANGED: 'user_role_changed',
  
  ORGANIZATION_CREATED: 'organization_created',
  ORGANIZATION_UPDATED: 'organization_updated',
  
  SUPPORT_TICKET_CREATED: 'support_ticket_created',
  SUPPORT_TICKET_UPDATED: 'support_ticket_updated',
  SUPPORT_TICKET_RESOLVED: 'support_ticket_resolved',
  
  AUDIT_LOG_CREATED: 'audit_log_created'
}

export const createTaskEvent = (taskId: string, action: string, accountId: string, userId: string, details?: any) => {
  return {
    type: `task_${action}`,
    payload: {
      task_id: taskId,
      action,
      details
    },
    accountId,
    userId
  }
}

export const createCalendarEvent = (eventId: string, action: string, accountId: string, userId: string, details?: any) => {
  return {
    type: `calendar_event_${action}`,
    payload: {
      event_id: eventId,
      action,
      details
    },
    accountId,
    userId
  }
}

export const createMessageEvent = (messageId: string, threadId: string, action: string, accountId: string, userId: string, details?: any) => {
  return {
    type: `message_${action}`,
    payload: {
      message_id: messageId,
      thread_id: threadId,
      action,
      details
    },
    accountId,
    userId
  }
}

export const createAnalyticsEvent = (serviceId: string, metricName: string, value: number, accountId: string, userId: string, details?: any) => {
  return {
    type: 'analytics_updated',
    payload: {
      service_id: serviceId,
      metric_name: metricName,
      value,
      details
    },
    accountId,
    userId
  }
}