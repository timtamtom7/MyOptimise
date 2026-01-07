import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Channel {
  id: string
  name: string
  type: 'general' | 'task' | 'client' | 'announcement'
  icon_url?: string
  unread_count?: number
}

export interface Message {
  id: string
  content: string
  sender_id: string
  group_id: string | null
  created_at: string
  sender: {
    full_name: string
    avatar_url?: string
  }
}

export interface ChatGroup {
  id: string
  name: string
  organization_id: string
  created_at: string
  icon_url?: string | null
}

export function useChannels(organizationId: string | undefined) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId) {
      setLoading(false)
      return
    }

    const fetchChannels = async () => {
      try {
        // Cast supabase to any to bypass type checks for chat_groups which is missing from generated types
        const { data, error } = await (supabase as any)
          .from('chat_groups')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: true })

        if (error) throw error

        // Map to Channel interface
        const formattedChannels: Channel[] = ((data as ChatGroup[]) || []).map((group) => ({
          id: group.id,
          name: group.name,
          type: 'general', // Default for now, as schema didn't show type
          icon_url: group.icon_url || undefined
        }))

        setChannels(formattedChannels)
      } catch (error) {
        console.error('Error fetching channels:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChannels()
    
    // Subscribe to new channels
    const channel = supabase
      .channel(`org-channels-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_groups',
          filter: `organization_id=eq.${organizationId}`
        },
        (_payload) => {
            // Simple refresh strategy for now
            fetchChannels()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  return { channels, loading }
}

export function useMessages(channelId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!channelId) {
      setMessages([])
      return
    }

    const fetchMessages = async () => {
      setLoading(true)
      try {
        const { data, error } = await (supabase as any)
          .from('messages')
          .select(`
            id,
            content,
            sender_id,
            group_id,
            created_at,
            sender:profiles(full_name, avatar_url)
          `)
          .eq('group_id', channelId)
          .order('created_at', { ascending: true })

        if (error) throw error

        // Transform data to match Message interface (handling the nested sender)
        const formattedMessages = (data || []).map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          group_id: msg.group_id,
          created_at: msg.created_at,
          sender: {
            full_name: msg.sender?.full_name || 'Unknown',
            avatar_url: msg.sender?.avatar_url
          }
        }))

        setMessages(formattedMessages)
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-messages-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${channelId}`
        },
        async (payload) => {
          // When a new message arrives, we need to fetch the sender details
          // Or we can optimistic update if we knew the sender details.
          // For simplicity/correctness, let's fetch the single message with relations
          
           const { data, error } = await (supabase as any)
            .from('messages')
            .select(`
                id,
                content,
                sender_id,
                group_id,
                created_at,
                sender:profiles(full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()
            
           if (data && !error) {
               const newMsg = {
                  id: data.id,
                  content: data.content,
                  sender_id: data.sender_id,
                  group_id: data.group_id,
                  created_at: data.created_at,
                  sender: {
                    full_name: data.sender?.full_name || 'Unknown',
                    avatar_url: data.sender?.avatar_url
                  }
               }
               setMessages(prev => [...prev, newMsg])
           }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId])

  const sendMessage = async (content: string, senderId: string, organizationId: string) => {
    if (!channelId) return

    try {
      const { error } = await (supabase as any)
        .from('messages')
        .insert({
          content,
          group_id: channelId,
          sender_id: senderId,
          organization_id: organizationId,
          type: 'text',
          status: 'sent'
        })

      if (error) throw error
      
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  return { messages, loading, sendMessage }
}
