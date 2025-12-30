import { supabase, Message, MessageWithSender, MessageThread, User } from '../lib/supabase'

export interface MessageFilters {
  threadId?: string
  threadType?: 'private' | 'team' | 'client' | 'support'
  participantId?: string
  search?: string
  unreadOnly?: boolean
}

export interface MessageCreateData {
  threadId: string
  content: string
  replyToId?: string
}

export interface ThreadCreateData {
  type: 'private' | 'team' | 'client' | 'support'
  title?: string
  participantIds: string[]
}

export interface ThreadWithDetails extends MessageThread {
  participants: User[]
  lastMessage: MessageWithSender | null
  unreadCount: number
  messageCount: number
}

export class MessagingService {
  private userId: string
  private organizationId: string
  private userRole: string

  constructor(userId: string, organizationId: string, userRole: string) {
    this.userId = userId
    this.organizationId = organizationId
    this.userRole = userRole
  }

  private canViewThread(thread: MessageThread): boolean {
    if (thread.type === 'private') {
      return this.isThreadParticipant(thread.id)
    }
    
    if (thread.type === 'team') {
      return ['owner', 'manager', 'employee'].includes(this.userRole)
    }
    
    if (thread.type === 'client') {
      return this.userRole === 'client' || ['owner', 'manager', 'employee'].includes(this.userRole)
    }
    
    if (thread.type === 'support') {
      return true
    }
    
    return false
  }

  private async isThreadParticipant(threadId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('message_thread_participants')
      .select('id')
      .eq('thread_id', threadId)
      .eq('user_id', this.userId)
      .single()

    return !error && !!data
  }

  async getThreads(filters: MessageFilters = {}): Promise<ThreadWithDetails[]> {
    let query = supabase
      .from('message_threads')
      .select(`
        *,
        message_thread_participants(*, user:users(*)),
        messages(*, sender:users(*))
      `)
      .eq('organization_id', this.organizationId)
      .order('last_message_at', { ascending: false })

    if (filters.threadType) {
      query = query.eq('type', filters.threadType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching message threads:', error)
      return []
    }

    const threads = (data || []).filter(thread => this.canViewThread(thread))

    return await Promise.all(
      threads.map(async (thread) => {
        const participants = thread.message_thread_participants?.map((p: any) => p.user) || []
        const messages = thread.messages || []
        const lastMessage = messages.length > 0 ? messages[0] : null
        
        const unreadCount = await this.getUnreadMessageCount(thread.id)

        return {
          ...thread,
          participants,
          lastMessage,
          unreadCount,
          messageCount: messages.length
        }
      })
    )
  }

  async getThreadById(threadId: string): Promise<ThreadWithDetails | null> {
    const { data, error } = await supabase
      .from('message_threads')
      .select(`
        *,
        message_thread_participants(*, user:users(*)),
        messages(*, sender:users(*))
      `)
      .eq('id', threadId)
      .eq('organization_id', this.organizationId)
      .single()

    if (error || !data) {
      console.error('Error fetching message thread:', error)
      return null
    }

    if (!this.canViewThread(data)) {
      return null
    }

    const participants = data.message_thread_participants?.map((p: any) => p.user) || []
    const messages = data.messages || []
    const lastMessage = messages.length > 0 ? messages[0] : null
    const unreadCount = await this.getUnreadMessageCount(threadId)

    return {
      ...data,
      participants,
      lastMessage,
      unreadCount,
      messageCount: messages.length
    }
  }

  async getMessages(threadId: string, limit: number = 50): Promise<MessageWithSender[]> {
    const thread = await this.getThreadById(threadId)
    if (!thread) {
      return []
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users(*)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return data || []
  }

  async createThread(threadData: ThreadCreateData): Promise<MessageThread | null> {
    if (!threadData.participantIds.includes(this.userId)) {
      threadData.participantIds.push(this.userId)
    }

    const { data: thread, error: threadError } = await supabase
      .from('message_threads')
      .insert({
        organization_id: this.organizationId,
        type: threadData.type,
        title: threadData.title
      })
      .select()
      .single()

    if (threadError) {
      console.error('Error creating message thread:', threadError)
      return null
    }

    const participantInserts = threadData.participantIds.map(userId => ({
      thread_id: thread.id,
      user_id: userId
    }))

    const { error: participantsError } = await supabase
      .from('message_thread_participants')
      .insert(participantInserts)

    if (participantsError) {
      console.error('Error adding thread participants:', participantsError)
      return null
    }

    await this.logActivity('message_thread_created', {
      thread_id: thread.id,
      type: threadData.type,
      participant_count: threadData.participantIds.length
    })

    return thread
  }

  async sendMessage(messageData: MessageCreateData): Promise<MessageWithSender | null> {
    const thread = await this.getThreadById(messageData.threadId)
    if (!thread) {
      throw new Error('Thread not found or insufficient permissions')
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        thread_id: messageData.threadId,
        sender_id: this.userId,
        content: messageData.content
      })
      .select(`
        *,
        sender:users(*)
      `)
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return null
    }

    await supabase
      .from('message_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', messageData.threadId)

    await this.logActivity('message_sent', {
      message_id: data.id,
      thread_id: messageData.threadId,
      content_preview: messageData.content.substring(0, 100)
    })

    return data
  }

  async getUnreadMessageCount(threadId?: string): Promise<number> {
    let query = supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', this.userId)

    if (threadId) {
      query = query.eq('thread_id', threadId)
    }

    const { count, error } = await query

    if (error) {
      console.error('Error counting unread messages:', error)
      return 0
    }

    return count || 0
  }

  async getTotalMessageCount(threadId?: string): Promise<number> {
    let query = supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })

    if (threadId) {
      query = query.eq('thread_id', threadId)
    }

    const { count, error } = await query

    if (error) {
      console.error('Error counting messages:', error)
      return 0
    }

    return count || 0
  }

  async markThreadAsRead(threadId: string): Promise<void> {
    const thread = await this.getThreadById(threadId)
    if (!thread) {
      throw new Error('Thread not found or insufficient permissions')
    }

    await this.logActivity('message_thread_read', {
      thread_id: threadId
    })
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const { data: message } = await supabase
      .from('messages')
      .select('sender_id, thread_id')
      .eq('id', messageId)
      .single()

    if (!message || message.sender_id !== this.userId) {
      throw new Error('Message not found or insufficient permissions')
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('Error deleting message:', error)
      return false
    }

    await this.logActivity('message_deleted', {
      message_id: messageId,
      thread_id: message.thread_id
    })

    return true
  }

  async getThreadParticipants(threadId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('message_thread_participants')
      .select(`
        user:users(*)
      `)
      .eq('thread_id', threadId)

    if (error) {
      console.error('Error fetching thread participants:', error)
      return []
    }

    return (data || []).map((p: any) => p.user)
  }

  async addThreadParticipant(threadId: string, userId: string): Promise<void> {
    const thread = await this.getThreadById(threadId)
    if (!thread) {
      throw new Error('Thread not found or insufficient permissions')
    }

    if (thread.type === 'private') {
      throw new Error('Cannot add participants to private threads')
    }

    const { error } = await supabase
      .from('message_thread_participants')
      .insert({
        thread_id: threadId,
        user_id: userId
      })

    if (error) {
      console.error('Error adding thread participant:', error)
      throw error
    }

    await this.logActivity('message_thread_participant_added', {
      thread_id: threadId,
      user_id: userId
    })
  }

  async removeThreadParticipant(threadId: string, userId: string): Promise<void> {
    const thread = await this.getThreadById(threadId)
    if (!thread) {
      throw new Error('Thread not found or insufficient permissions')
    }

    if (thread.type === 'private') {
      throw new Error('Cannot remove participants from private threads')
    }

    const { error } = await supabase
      .from('message_thread_participants')
      .delete()
      .eq('thread_id', threadId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing thread participant:', error)
      throw error
    }

    await this.logActivity('message_thread_participant_removed', {
      thread_id: threadId,
      user_id: userId
    })
  }

  private async logActivity(action: string, details: any): Promise<void> {
    await supabase.from('audit_logs').insert({
      organization_id: this.organizationId,
      user_id: this.userId,
      action: `messaging_${action}`,
      details,
      ip_address: null,
      user_agent: null
    })
  }
}

export const createMessagingService = async (userId: string): Promise<MessagingService> => {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!user) {
    throw new Error('User not found')
  }

  return new MessagingService(userId, user.organization_id, user.role)
}