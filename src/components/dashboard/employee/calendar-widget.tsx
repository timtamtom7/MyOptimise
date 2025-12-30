'use client'

import { useState, useEffect } from 'react'
import { CalendarEventWithAttendees } from '../../../lib/supabase'
import { CalendarService, createCalendarService } from '../../../lib/calendar-service'
import { Calendar, Clock, Users, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarWidgetProps {
  userId: string
}

export default function CalendarWidget({ userId }: CalendarWidgetProps) {
  const [events, setEvents] = useState<CalendarEventWithAttendees[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [calendarService, setCalendarService] = useState<CalendarService | null>(null)

  useEffect(() => {
    const initCalendarService = async () => {
      try {
        const service = await createCalendarService(userId)
        setCalendarService(service)
        await loadEvents(service)
      } catch (error) {
        console.error('Error initializing calendar service:', error)
      } finally {
        setLoading(false)
      }
    }

    initCalendarService()
  }, [userId])

  const loadEvents = async (service: CalendarService) => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const eventData = await service.getEvents({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString()
      })
      setEvents(eventData)
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  useEffect(() => {
    if (calendarService) {
      loadEvents(calendarService)
    }
  }, [currentDate])

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      const eventDate = new Date(event.start_time).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="h-8 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Calendar
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {getDaysInMonth().map((date, index) => {
          if (!date) {
            return <div key={index} className="h-8"></div>
          }

          const dayEvents = getEventsForDate(date)
          const isToday = new Date().toDateString() === date.toDateString()
          const isSelected = selectedDate === date.toISOString().split('T')[0]

          return (
            <button
              key={index}
              onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
              className={`
                h-8 w-8 rounded-lg text-sm font-medium transition-colors
                ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}
                ${isSelected && !isToday ? 'bg-blue-100 text-blue-700' : ''}
                ${!isToday && !isSelected ? 'hover:bg-gray-100' : ''}
                ${dayEvents.length > 0 ? 'font-bold' : ''}
              `}
            >
              {date.getDate()}
              {dayEvents.length > 0 && (
                <div className="absolute -mt-1 -mr-1 h-2 w-2 bg-red-500 rounded-full"></div>
              )}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">
              Events for {formatDate(new Date(selectedDate))}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>
          
          {getEventsForDate(new Date(selectedDate)).length === 0 ? (
            <p className="text-sm text-gray-500">No events scheduled</p>
          ) : (
            <div className="space-y-3">
              {getEventsForDate(new Date(selectedDate)).map(event => (
                <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </p>
                    {event.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                    )}
                    {event.attendees.length > 0 && (
                      <div className="flex items-center mt-2">
                        <Users className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">
                          {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedDate && events.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Upcoming Events</h4>
            <button
              onClick={() => {/* TODO: Open create event modal */}}
              className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3 w-3 mr-1" />
              New Event
            </button>
          </div>
          
          <div className="space-y-3">
            {events.slice(0, 3).map(event => (
              <div key={event.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-blue-600 rounded-full mt-2"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(new Date(event.start_time))} at {formatTime(event.start_time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}