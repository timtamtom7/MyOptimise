import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'myoptimise-dashboard',
    },
  },
})

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

export type Organization = Tables<'organizations'>
export type User = Tables<'users'>
export type UserCapability = Tables<'user_capabilities'>
export type Capability = UserCapability['capability']
export type Task = Tables<'tasks'>
export type TaskAssignment = Tables<'task_assignments'>
export type TaskComment = Tables<'task_comments'>
export type CalendarEvent = Tables<'calendar_events'>
export type EventAttendee = Tables<'event_attendees'>
export type MessageThread = Tables<'message_threads'>
export type Message = Tables<'messages'>
export type MessageParticipant = Tables<'message_participants'>
export type ClientService = Tables<'client_services'>
export type ServiceMetric = Tables<'service_metrics'>
export type AnalyticsRollup = Tables<'analytics_rollups'>
export type SupportTicket = Tables<'support_tickets'>
export type AuditLog = Tables<'audit_logs'>
export type EventBus = Tables<'event_bus'>

export type TaskStatus = Enums<'task_status'>
export type TaskPriority = Enums<'task_priority'>
export type TaskVisibility = Enums<'task_visibility'>
export type EventType = Enums<'event_type'>
export type ThreadType = Enums<'thread_type'>
export type MessageVisibility = Enums<'message_visibility'>
export type ServiceType = Enums<'service_type'>
export type MetricType = Enums<'metric_type'>
export type TicketStatus = Enums<'ticket_status'>
export type EventTypeBus = Enums<'event_type_bus'>

export interface UserWithCapabilities extends User {
  capabilities: UserCapability[]
  account: Organization // Renamed from organization to account for consistency
}

export interface TaskWithDetails extends Task {
  creator: User
  assignees: (TaskAssignment & { user: User })[]
  comments: (TaskComment & { user: User })[]
  account: Organization // Renamed from organization to account for consistency
}

export interface CalendarEventWithDetails extends CalendarEvent {
  creator: User
  attendees: (EventAttendee & { user: User })[]
  account: Organization // Renamed from organization to account for consistency
}

export interface MessageThreadWithDetails extends MessageThread {
  participants: (MessageParticipant & { user: User })[]
  messages: Message[]
  account: Organization // Renamed from organization to account for consistency
}

export interface ClientServiceWithMetrics extends ClientService {
  metrics: ServiceMetric[]
  account: Organization // Renamed from organization to account for consistency
  current_metrics?: ServiceMetric & { revenue?: number }
}

export interface AnalyticsData {
  accountId: string
  serviceType: ServiceType
  period: string
  metrics: {
    impressions: number
    engagement: number
    conversions: number
    ctr: number
    reach: number
  }
  createdAt: string
}

export const TASK_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export const TASK_PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
  urgent: 'bg-purple-100 text-purple-800',
}

export const SERVICE_TYPE_ICONS = {
  instagram: '📸',
  facebook: '📘',
  pinterest: '📌',
  email: '📧',
  website: '🌐',
  linkedin: '💼',
  twitter: '🐦',
  youtube: '📺',
}

export const METRIC_TYPE_LABELS = {
  impressions: 'Impressions',
  engagement: 'Engagement',
  conversions: 'Conversions',
  ctr: 'Click-Through Rate',
  reach: 'Reach',
  likes: 'Likes',
  shares: 'Shares',
  comments: 'Comments',
  followers: 'Followers',
  clicks: 'Clicks',
}

export function formatMetricValue(value: number, type: MetricType): string {
  if (type === 'ctr') {
    return `${(value * 100).toFixed(2)}%`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

export function getServiceHealthColor(metrics: ServiceMetric[]): string {
  if (metrics.length === 0) return 'text-gray-500'
  
  const latestMetric = metrics[0]
  const avgEngagement = metrics.reduce((sum, m) => sum + m.engagement_rate, 0) / metrics.length
  
  if (latestMetric.engagement_rate > avgEngagement * 1.2) return 'text-green-600'
  if (latestMetric.engagement_rate > avgEngagement * 0.8) return 'text-yellow-600'
  return 'text-red-600'
}

export async function logAuditEvent(
  userId: string,
  accountId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      organization_id: accountId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

export async function getCurrentUser(): Promise<UserWithCapabilities | null> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user) return null

    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        capabilities:user_capabilities(*),
        account:organizations!users_organization_id_fkey(*)
      `)
      .eq('id', session.user.id)
      .single()

    if (userError || !user) return null

    return user as unknown as UserWithCapabilities
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}
