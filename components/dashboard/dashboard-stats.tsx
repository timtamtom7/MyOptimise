'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTaskStats } from '@/hooks/use-tasks'
import { useTodayCalendarEvents } from '@/hooks/use-calendar'
import { useCurrentUser } from '@/hooks/use-user'
import { format } from 'date-fns'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react'

export function DashboardStats() {
  const { user } = useCurrentUser()
  const { data: taskStats, isLoading: tasksLoading } = useTaskStats(user?.accountId || '')
  const { data: todayEvents, isLoading: eventsLoading } = useTodayCalendarEvents(user?.accountId || '')

  if (tasksLoading || eventsLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const upcomingEvents = todayEvents?.filter(event => 
    new Date(event.start_time) > new Date()
  ).slice(0, 3) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here’s what’s happening today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {taskStats?.overdue || 0} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats?.byStatus?.in_progress || 0}</div>
            <p className="text-xs text-muted-foreground">
              {taskStats?.byStatus?.todo || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today’s Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEvents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingEvents.length} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats?.byPriority?.urgent || 0}</div>
            <p className="text-xs text-muted-foreground">
              {taskStats?.byPriority?.high || 0} high priority
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today’s Schedule</CardTitle>
            <CardDescription>
              Your meetings and events for {format(new Date(), 'EEEE, MMMM d')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                      </p>
                      {event.location && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No events scheduled for today
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Overview</CardTitle>
            <CardDescription>
              Current status of your tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">To Do</span>
                <span className="text-sm text-muted-foreground">
                  {taskStats?.byStatus?.todo || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">In Progress</span>
                <span className="text-sm text-muted-foreground">
                  {taskStats?.byStatus?.in_progress || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Review</span>
                <span className="text-sm text-muted-foreground">
                  {taskStats?.byStatus?.review || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completed</span>
                <span className="text-sm text-muted-foreground">
                  {taskStats?.byStatus?.completed || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
