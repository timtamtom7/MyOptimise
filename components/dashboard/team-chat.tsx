'use client'

import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-user'
import { useOrganizationMembers } from '@/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Users, 
  Hash,
  Circle,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'

interface Message {
  id: string
  user_id: string
  content: string
  created_at: string
  user: {
    full_name: string
    avatar_url?: string
  }
}

interface Channel {
  id: string
  name: string
  type: 'general' | 'task' | 'client' | 'announcement'
  participants: string[]
  unread_count: number
}

export function TeamChat() {
  const [selectedChannel, setSelectedChannel] = useState<string>('general')
  const [messageInput, setMessageInput] = useState('')
  const { user } = useCurrentUser()
  const { data: members } = useOrganizationMembers(user?.organization_id)

  // Mock data for demonstration
  const channels: Channel[] = [
    {
      id: 'general',
      name: 'general',
      type: 'general',
      participants: [],
      unread_count: 0,
    },
    {
      id: 'tasks',
      name: 'tasks',
      type: 'task',
      participants: [],
      unread_count: 2,
    },
    {
      id: 'announcements',
      name: 'announcements',
      type: 'announcement',
      participants: [],
      unread_count: 1,
    },
  ]

  const now = new Date()
  const messages: Message[] = [
    {
      id: '1',
      user_id: '1',
      content: 'Good morning team! Ready for the sprint planning?',
      created_at: new Date(now.getTime() - 3600000).toISOString(),
      user: {
        full_name: 'Sarah Johnson',
        avatar_url: undefined,
      },
    },
    {
      id: '2',
      user_id: '2',
      content: 'Yes! I\'ve prepared the backlog items.',
      created_at: new Date(now.getTime() - 3000000).toISOString(),
      user: {
        full_name: 'Mike Chen',
        avatar_url: undefined,
      },
    },
    {
      id: '3',
      user_id: '3',
      content: 'Great! Let\'s start at 10 AM.',
      created_at: new Date(now.getTime() - 1800000).toISOString(),
      user: {
        full_name: 'Emma Davis',
        avatar_url: undefined,
      },
    },
  ]

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'general': return <Hash className="h-4 w-4" />
      case 'task': return <MessageSquare className="h-4 w-4" />
      case 'announcement': return <Circle className="h-4 w-4" />
      default: return <Hash className="h-4 w-4" />
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    // Here you would send the message to your backend
    console.log('Sending message:', messageInput)
    setMessageInput('')
  }

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
            Channels
          </h3>
          <div className="space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedChannel === channel.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {getChannelIcon(channel.type)}
                <span className="flex-1">{channel.name}</span>
                {channel.unread_count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {channel.unread_count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
            Team Members
          </h3>
          <div className="space-y-2">
            {members?.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center space-x-3">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {member.full_name}
                </span>
                <div className="flex-1"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getChannelIcon(channels.find(c => c.id === selectedChannel)?.type || 'general')}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {channels.find(c => c.id === selectedChannel)?.name}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex space-x-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {getInitials(message.user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {message.user.full_name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(message.created_at), 'h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              type="text"
              placeholder={`Message #${channels.find(c => c.id === selectedChannel)?.name}`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}