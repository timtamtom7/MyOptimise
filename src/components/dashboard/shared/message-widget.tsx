'use client'

import { useState, useEffect } from 'react'
import { ThreadWithDetails, MessageWithSender } from '../../../lib/supabase'
import { MessagingService, createMessagingService } from '../../../lib/messaging-service'
import { useMessageEvents } from '../../../hooks/useEventBus'
import { MessageCircle, Send, Users, Clock, Search, Plus } from 'lucide-react'

interface MessageWidgetProps {
  userId: string
}

export default function MessageWidget({ userId }: MessageWidgetProps) {
  const [threads, setThreads] = useState<ThreadWithDetails[]>([])
  const [selectedThread, setSelectedThread] = useState<ThreadWithDetails | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagingService, setMessagingService] = useState<MessagingService | null>(null)

  useEffect(() => {
    const initMessagingService = async () => {
      try {
        const service = await createMessagingService(userId)
        setMessagingService(service)
        await loadThreads(service)
      } catch (error) {
        console.error('Error initializing messaging service:', error)
      } finally {
        setLoading(false)
      }
    }

    initMessagingService()
  }, [userId])

  const loadThreads = async (service: MessagingService) => {
    try {
      const threadData = await service.getThreads()
      setThreads(threadData)
    } catch (error) {
      console.error('Error loading threads:', error)
    }
  }

  const loadMessages = async (threadId: string) => {
    if (!messagingService) return

    try {
      const messageData = await messagingService.getMessages(threadId)
      setMessages(messageData.reverse())
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  useMessageEvents((event) => {
    if (event.type === 'message_sent' || event.type === 'message_thread_created') {
      if (messagingService) {
        loadThreads(messagingService)
        if (selectedThread && event.payload.thread_id === selectedThread.id) {
          loadMessages(selectedThread.id)
        }
      }
    }
  }, {
    organizationId: undefined,
    userId,
    enabled: !!messagingService
  })

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id)
      if (messagingService) {
        messagingService.markThreadAsRead(selectedThread.id)
      }
    }
  }, [selectedThread, messagingService])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !messagingService) return

    try {
      await messagingService.sendMessage({
        threadId: selectedThread.id,
        content: newMessage.trim()
      })
      setNewMessage('')
      loadMessages(selectedThread.id)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleThreadSelect = (thread: ThreadWithDetails) => {
    setSelectedThread(thread)
  }

  const handleCreateThread = async () => {
    if (!messagingService) return

    try {
      const newThread = await messagingService.createThread({
        type: 'private',
        participantIds: [userId],
        title: 'New Conversation'
      })
      
      if (newThread) {
        await loadThreads(messagingService)
        const fullThread = await messagingService.getThreadById(newThread.id)
        if (fullThread) {
          setSelectedThread(fullThread)
        }
      }
    } catch (error) {
      console.error('Error creating thread:', error)
    }
  }

  const filteredThreads = threads.filter(thread =>
    thread.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.participants.some(p => 
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex">
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Messages
            </h3>
            <button
              onClick={handleCreateThread}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No conversations found</p>
              <p className="text-xs text-gray-400 mt-1">Start a new conversation to get started</p>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => handleThreadSelect(thread)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedThread?.id === thread.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {thread.title || 'Untitled Conversation'}
                      </h4>
                      {thread.unreadCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                      <span>{thread.participants.length} participants</span>
                      <span>•</span>
                      <span>{thread.messageCount} messages</span>
                    </div>
                    
                    {thread.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">
                        {thread.lastMessage.sender.full_name || thread.lastMessage.sender.email}: {thread.lastMessage.content}
                      </p>
                    )}
                    
                    {thread.lastMessage && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(thread.lastMessage.created_at)} at {formatTime(thread.lastMessage.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedThread ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedThread.title || 'Untitled Conversation'}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedThread.participants.length} participants • {selectedThread.type}
                </p>
              </div>
              <button
                onClick={() => setSelectedThread(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_id === userId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium">
                      {message.sender.full_name || message.sender.email}
                    </span>
                    <span className="text-xs opacity-75">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-sm text-gray-500">Choose a conversation from the left to start messaging</p>
          </div>
        </div>
      )}
    </div>
  )
}