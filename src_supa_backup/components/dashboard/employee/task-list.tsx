'use client'

import { useState, useEffect } from 'react'
import { TaskWithDetails, TaskStatus, TaskPriority, TaskVisibility, Capability } from '@/lib/supabase'
import { TaskService, TaskFilters } from '@/lib/task-service'
import { Plus, Search, Filter, Calendar, User, Tag, MessageCircle, Clock, AlertCircle } from 'lucide-react'

interface TaskListProps {
  userId: string
  accountId: string
  capabilities: Capability[]
  onTaskSelect: (task: TaskWithDetails) => void
}

const statusColors = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  review: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
}

export default function TaskList({ userId, accountId, capabilities, onTaskSelect }: TaskListProps) {
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([])
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [taskService, setTaskService] = useState<TaskService | null>(null)

  useEffect(() => {
    const initTaskService = async () => {
      try {
        const service = new TaskService(userId, accountId, capabilities)
        setTaskService(service)
        await loadTasks(service)
      } catch (error) {
        console.error('Error initializing task service:', error)
      } finally {
        setLoading(false)
      }
    }

    initTaskService()
  }, [userId, accountId, capabilities])

  const loadTasks = async (service: TaskService) => {
    try {
      const filters: TaskFilters = {}
      if (searchTerm) filters.search = searchTerm
      if (statusFilter.length > 0) filters.status = statusFilter
      if (priorityFilter.length > 0) filters.priority = priorityFilter

      const taskData = await service.getTasks(filters)
      setTasks(taskData)
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  useEffect(() => {
    if (taskService) {
      loadTasks(taskService)
    }
  }, [searchTerm, statusFilter, priorityFilter])

  const toggleStatusFilter = (status: TaskStatus) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const togglePriorityFilter = (priority: TaskPriority) => {
    setPriorityFilter(prev => 
      prev.includes(priority) 
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const isOverdue = date < now
    
    return {
      date: date.toLocaleDateString(),
      isOverdue
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
          <button
            onClick={() => {/* TODO: Open create task modal */}}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {(statusFilter.length > 0 || priorityFilter.length > 0) && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {statusFilter.length + priorityFilter.length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                <div className="space-y-2">
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(status as TaskStatus)}
                        onChange={() => toggleStatusFilter(status as TaskStatus)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Priority</h4>
                <div className="space-y-2">
                  {Object.entries(priorityLabels).map(([priority, label]) => (
                    <label key={priority} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={priorityFilter.includes(priority as TaskPriority)}
                        onChange={() => togglePriorityFilter(priority as TaskPriority)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
              <Calendar className="h-12 w-12" />
            </div>
            <p>No tasks found</p>
            <p className="text-sm text-gray-400 mt-1">Create a new task to get started</p>
          </div>
        ) : (
          tasks.map((task) => {
            const dueDate = formatDate(task.due_date)
            const assigneeName = task.assignee?.full_name || task.assignee?.email || 'Unassigned'
            const assigneeAvatar = task.assignee?.avatar_url

            return (
              <div
                key={task.id}
                onClick={() => onTaskSelect(task)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status]}`}>
                        {statusLabels[task.status]}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{assigneeName}</span>
                      </div>
                      
                      {dueDate && (
                        <div className={`flex items-center ${dueDate.isOverdue ? 'text-red-600' : ''}`}>
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{dueDate.date}</span>
                          {dueDate.isOverdue && <AlertCircle className="h-4 w-4 ml-1" />}
                        </div>
                      )}

                      {task.comments.length > 0 && (
                        <div className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          <span>{task.comments.length}</span>
                        </div>
                      )}

                      {task.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Tag className="h-4 w-4" />
                          {task.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}