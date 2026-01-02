'use client'

import { useState } from 'react'
import { useTasks } from '@/hooks/use-tasks'
import { useCurrentUser } from '@/hooks/use-user'
import { useTaskPermissions } from '@/hooks/use-capabilities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  User,
  Calendar,
  Flag
} from 'lucide-react'
import { format } from 'date-fns'
import { Task, TaskStatus, TaskPriority } from '@/lib/supabase'

interface TaskFormData {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee_id?: string
  due_date?: string
  visibility: 'private' | 'team' | 'client' | 'public'
}

export function TaskBoard() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all')
  const { user } = useCurrentUser()
  const { data: tasks, isLoading } = useTasks(user?.accountId || '')
  const { createTask, isCreating } = useCreateTask()
  const { updateTask } = useUpdateTask()
  const { canCreate } = useTaskPermissions()

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    visibility: 'team',
  })

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await createTask({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.due_date,
        visibility: formData.visibility,
        assigneeIds: formData.assignee_id ? [formData.assignee_id] : undefined,
      }, user.id)

      setIsCreateDialogOpen(false)
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        visibility: 'team',
      })
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      if (!user) return
      await updateTask(taskId, { status: newStatus }, user.id)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return <Clock className="h-4 w-4" />
      case 'in_progress': return <AlertCircle className="h-4 w-4" />
      case 'review': return <Flag className="h-4 w-4" />
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredTasks = tasks?.filter(task => 
    selectedStatus === 'all' || task.status === selectedStatus
  ) || []

  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    review: filteredTasks.filter(task => task.status === 'review'),
    completed: filteredTasks.filter(task => task.status === 'completed'),
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">Manage your team’s tasks and projects</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage your team’s tasks and projects</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TaskStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {canCreate && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {(['todo', 'in_progress', 'review', 'completed'] as TaskStatus[]).map((status) => {
          const statusTasks = tasksByStatus[status]
          const statusLabel = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

          return (
            <Card key={status} className="bg-gray-50 dark:bg-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <span>{statusLabel}</span>
                  </CardTitle>
                  <Badge variant="secondary">{statusTasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {/* Handle task click */}}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        {task.assignee && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{task.assignee.full_name}</span>
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(task.due_date), 'MMM d')}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs">
                          {task.visibility}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                
                {statusTasks.length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    No tasks in this status
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
                {isCreating ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
