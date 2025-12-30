'use client'

import { useEffect, useRef, useCallback } from 'react'
import { eventBus, EventData, EventFilter } from '../lib/event-bus'

interface UseEventBusOptions {
  eventTypes?: string[]
  organizationId?: string
  userId?: string
  enabled?: boolean
}

export function useEventBus(
  callback: (event: EventData) => void,
  options: UseEventBusOptions = {}
) {
  const { eventTypes = ['*'], organizationId, userId, enabled = true } = options
  const subscriptionRef = useRef<string | null>(null)
  const callbackRef = useRef(callback)

  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    const wrappedCallback = (event: EventData) => {
      callbackRef.current(event)
    }

    subscriptionRef.current = eventBus.subscribe(
      eventTypes,
      wrappedCallback,
      organizationId,
      userId
    )

    return () => {
      if (subscriptionRef.current) {
        eventBus.unsubscribe(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [eventTypes, organizationId, userId, enabled])

  return {
    subscriptionId: subscriptionRef.current,
    isConnected: eventBus.isRealtimeConnected(),
    subscriptionCount: eventBus.getSubscriptionCount()
  }
}

export function useTaskEvents(
  callback: (event: EventData) => void,
  options: Omit<UseEventBusOptions, 'eventTypes'> = {}
) {
  return useEventBus(callback, {
    ...options,
    eventTypes: [
      'task_created',
      'task_updated',
      'task_deleted',
      'task_assigned',
      'task_completed'
    ]
  })
}

export function useCalendarEvents(
  callback: (event: EventData) => void,
  options: Omit<UseEventBusOptions, 'eventTypes'> = {}
) {
  return useEventBus(callback, {
    ...options,
    eventTypes: [
      'calendar_event_created',
      'calendar_event_updated',
      'calendar_event_deleted',
      'calendar_event_attendee_added',
      'calendar_event_attendee_removed'
    ]
  })
}

export function useMessageEvents(
  callback: (event: EventData) => void,
  options: Omit<UseEventBusOptions, 'eventTypes'> = {}
) {
  return useEventBus(callback, {
    ...options,
    eventTypes: [
      'message_sent',
      'message_thread_created',
      'message_thread_updated'
    ]
  })
}

export function useAnalyticsEvents(
  callback: (event: EventData) => void,
  options: Omit<UseEventBusOptions, 'eventTypes'> = {}
) {
  return useEventBus(callback, {
    ...options,
    eventTypes: [
      'analytics_updated',
      'service_created',
      'service_updated'
    ]
  })
}

export function useEventHistory(filter: EventFilter = {}) {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const eventData = await eventBus.getEvents(filter)
      setEvents(eventData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load events'))
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filter)])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  return {
    events,
    loading,
    error,
    refetch: loadEvents
  }
}