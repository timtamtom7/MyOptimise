import { useState, useEffect } from 'react'
import { supabase, Task, TaskWithDetails, TaskStatus, TaskPriority, TaskVisibility } from '@/lib/supabase'

export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assigneeId?: string
  search?: string
  visibility?: TaskVisibility[]
}

export function useTasks(accountId: string, filters?: TaskFilters) {
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }

    const fetchTasks = async () => {
      try {
        setLoading(true)
        
        let query = supabase
          .from('tasks')
          .select(`
            *,
            creator:users!tasks_created_by_fkey(*),
            account:organizations(*),
            assignees:task_assignments!task_assignments_task_id_fkey(
              *,
              user:users!task_assignments_user_id_fkey(*)
            ),
            comments:task_comments!task_comments_task_id_fkey(
              *,
              user:users!task_comments_user_id_fkey(*)
            )
          `)
          .eq('organization_id', accountId)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters?.status?.length) {
          query = query.in('status', filters.status)
        }
        if (filters?.priority?.length) {
          query = query.in('priority', filters.priority)
        }
        if (filters?.visibility?.length) {
          query = query.in('visibility', filters.visibility)
        }
        if (filters?.search) {
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        }

        const { data, error } = await query

        if (error) throw error

        // Filter by assignee if specified
        let filteredTasks = data || []
        if (filters?.assigneeId) {
          filteredTasks = filteredTasks.filter(task => 
            task.assignees.some((assignment: any) => assignment.user_id === filters.assigneeId)
          )
        }

        setTasks(filteredTasks)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tasks'))
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()

    // Subscribe to task changes
    const channel = supabase
      .channel(`tasks:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `organization_id=eq.${accountId}`,
        },
        () => {
          fetchTasks() // Refetch all tasks on any change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_assignments',
        },
        () => {
          fetchTasks() // Refetch on assignment changes
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
        },
        () => {
          fetchTasks() // Refetch on comment changes
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [accountId, JSON.stringify(filters)])

  const createTask = async (task: {
    title: string
    description?: string
    priority: TaskPriority
    dueDate?: string
    visibility: TaskVisibility
    assigneeIds?: string[]
  }, userId: string) => {
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          priority: task.priority,
          due_date: task.dueDate,
          visibility: task.visibility,
          organization_id: accountId,
          created_by: userId,
          status: 'pending',
        })
        .select()
        .single()

      if (taskError) throw taskError

      // Create assignments
      if (task.assigneeIds?.length) {
        const assignments = task.assigneeIds.map(assigneeId => ({
          task_id: taskData.id,
          user_id: assigneeId,
          assigned_by: userId,
        }))

        const { error: assignmentError } = await supabase
          .from('task_assignments')
          .insert(assignments)

        if (assignmentError) throw assignmentError
      }

      // Log audit event and emit event
      await Promise.all([
        supabase.from('audit_logs').insert({
          user_id: userId,
          organization_id: accountId,
          action: 'task_created',
          resource_type: 'task',
          resource_id: taskData.id,
        }),
        supabase.from('event_bus').insert({
          organization_id: accountId,
          user_id: userId,
          event_type: 'task_created',
          data: { task_id: taskData.id, title: task.title },
        }),
      ])

      return taskData
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create task')
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>, userId: string) => {
    try {
      // Map title to name if present
      const dbUpdates: any = { ...updates }
      
      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: userId,
        organization_id: accountId,
        action: 'task_updated',
        resource_type: 'task',
        resource_id: taskId,
        metadata: updates,
      })

      // Emit event if status changed to completed
      if (updates.status === 'completed') {
        await supabase.from('event_bus').insert({
          organization_id: accountId,
          user_id: userId,
          event_type: 'task_completed',
          data: { task_id: taskId },
        })
      }

      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update task')
    }
  }

  const deleteTask = async (taskId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: userId,
        organization_id: accountId,
        action: 'task_deleted',
        resource_type: 'task',
        resource_id: taskId,
      })
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete task')
    }
  }

  const addComment = async (taskId: string, comment: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          comment,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add comment')
    }
  }

  const assignUsers = async (taskId: string, userIds: string[], assignedBy: string) => {
    try {
      const assignments = userIds.map(userId => ({
        task_id: taskId,
        user_id: userId,
        assigned_by: assignedBy,
      }))

      const { error } = await supabase
        .from('task_assignments')
        .upsert(assignments, { onConflict: 'task_id,user_id' })

      if (error) throw error
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to assign users')
    }
  }

  const unassignUser = async (taskId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to unassign user')
    }
  }

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    assignUsers,
    unassignUser,
  }
}

export function useTask(taskId: string) {
  const [task, setTask] = useState<TaskWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!taskId) {
      setLoading(false)
      return
    }

    const fetchTask = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            creator:users!tasks_created_by_fkey(*),
            account:organizations(*),
            assignees:task_assignments!task_assignments_task_id_fkey(
              *,
              user:users!task_assignments_user_id_fkey(*)
            ),
            comments:task_comments!task_comments_task_id_fkey(
              *,
              user:users!task_comments_user_id_fkey(*)
            )
          `)
          .eq('id', taskId)
          .single()

        if (error) throw error
        setTask(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch task'))
      } finally {
        setLoading(false)
      }
    }

    fetchTask()

    // Subscribe to task changes
    const channel = supabase
      .channel(`task:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `id=eq.${taskId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTask(payload.new as TaskWithDetails)
          } else if (payload.eventType === 'DELETE') {
            setTask(null)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_assignments',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          fetchTask() // Refetch on assignment changes
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          fetchTask() // Refetch on comment changes
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [taskId])

  return { task, loading, error }
}

export function useTaskStats(accountId: string) {
  const [stats, setStats] = useState<{
    total: number
    overdue: number
    byStatus: {
      pending: number
      in_progress: number
      completed: number
      cancelled: number
    }
    byPriority: {
      urgent: number
      high: number
      medium: number
      low: number
    }
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('organization_id', accountId)

        if (error) throw error

        const total = data.length
        const now = new Date()
        const overdue = data.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length
        
        const byStatus = {
          pending: data.filter(t => t.status === 'pending').length,
          in_progress: data.filter(t => t.status === 'in_progress').length,
          completed: data.filter(t => t.status === 'completed').length,
          cancelled: data.filter(t => t.status === 'cancelled').length,
        }

        const byPriority = {
          urgent: data.filter(t => t.priority === 'urgent').length,
          high: data.filter(t => t.priority === 'high').length,
          medium: data.filter(t => t.priority === 'medium').length,
          low: data.filter(t => t.priority === 'low').length,
        }

        setStats({ total, overdue, byStatus, byPriority })
      } catch (err) {
        console.error('Failed to fetch task stats', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Subscribe to task changes
    const channel = supabase
      .channel(`task_stats:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `organization_id=eq.${accountId}`,
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [accountId])

  return { data: stats, isLoading: loading }
}