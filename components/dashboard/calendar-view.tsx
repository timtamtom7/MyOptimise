'use client'

import { useState } from 'react'
import { useWeekCalendarEvents, useCreateCalendarEvent } from '@/hooks/use-calendar'
import { useCurrentUser } from '@/hooks/use-user'
import { useCalendarPermissions } from '@/hooks/use-capabilities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Calendar,
  Clock,
  MapPin,
  Link,
  Users
} from 'lucide-react'
import { startOfWeek, addDays, isSameDay } from 'date-fns'
import { formatDate } from '@/lib/date-formatting'

interface EventFormData {
  title: string
  description: string
  start_time: string
  end_time: string
  timezone: string
  location?: string
  meeting_link?: string
  visibility: 'private' | 'team' | 'client' | 'public'
}

export function CalendarView() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const { user } = useCurrentUser()
  const { data: events, isLoading } = useWeekCalendarEvents(user?.accountId || '')
  const { createEvent, isCreating } = useCreateCalendarEvent()
  const { canCreate } = useCalendarPermissions()

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    visibility: 'team',
  })

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await createEvent({
        title: formData.title,
        description: formData.description,
        startTime: new Date(formData.start_time).toISOString(),
        endTime: new Date(formData.end_time).toISOString(),
        location: formData.location,
        type: 'meeting',
      }, user.id)

      setIsCreateDialogOpen(false)
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        visibility: 'team',
      })
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const getEventsForDate = (date: Date) => {
    return events?.filter(event => 
      isSameDay(new Date(event.start_time), date)
    ) || []
  }

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'private': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'team': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'client': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'public': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">Manage your schedule and meetings</p>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Manage your schedule and meetings</p>
        </div>
        
        {canCreate && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        )}
      </div>

      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDate(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div key={index} className="space-y-2">
              <div className={cn(
                "text-center p-2 rounded-lg",
                isToday ? "bg-blue-100 dark:bg-blue-900" : "bg-white dark:bg-gray-800"
              )}>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(day, 'EEE')}
                </div>
                <div className={cn(
                  "text-lg font-semibold",
                  isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
                )}>
                  {formatDate(day, 'd')}
                </div>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-xs leading-tight">{event.title}</h4>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDate(event.start_time, 'h:mm a')} - {formatDate(event.end_time, 'h:mm a')}
                      </span>
                    </div>

                    {event.location && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                ))}

                {dayEvents.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-xs">
                    No events
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location (optional)"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Meeting Link</label>
              <Input
                type="url"
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                placeholder="https://meet.example.com/abc-defg-hij"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Visibility</label>
              <Select
                value={formData.visibility}
                onValueChange={(value) => setFormData({ ...formData, visibility: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}