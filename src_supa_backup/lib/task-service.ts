import { supabase, Task, TaskWithDetails, TaskComment, TaskStatus, TaskPriority, TaskVisibility, Capability } from '@/lib/supabase'

export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assigneeId?: string
  createdById?: string
  visibility?: TaskVisibility[]
  search?: string
  tags?: string[]
}

export interface TaskCreateData {
  title: string
  description?: string
  assigneeId?: string | null
  priority: TaskPriority
  dueDate?: string | null
  visibility: TaskVisibility
  tags?: string[]
}

export interface TaskUpdateData {
  title?: string
  description?: string
  assigneeId?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string | null
  visibility?: TaskVisibility
}

export class TaskService {
  private userId: string
  private accountId: string
  private capabilities: Set<Capability>

  constructor(userId: string, accountId: string, capabilities: Capability[]) {
    this.userId = userId
    this.accountId = accountId
    this.capabilities = new Set(capabilities)
  }

  private hasCapability(capability: Capability): boolean {
    return this.capabilities.has(capability)
  }

  private canViewTask(task: Task): boolean {
    if (task.visibility === 'public') return true
    if (task.visibility === 'private' && task.created_by !== this.userId) return false
    if (task.visibility === 'team' && !this.hasCapability('manage_tasks')) return false
    if (task.visibility === 'client' && !this.hasCapability('manage_tasks')) return false
    return true
  }

  async getTasks(filters: TaskFilters = {}): Promise<TaskWithDetails[]> {
    if (!this.hasCapability('manage_tasks')) {
      filters.visibility = ['public', 'team']
    }

    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!tasks_assignee_id_fkey(*),
        created_by_user:users!tasks_created_by_fkey(*),
        account:organizations(*),
        task_comments(*, user:users(*)),
        task_tags(*)
      `)
      .eq('organization_id', this.accountId)
      .order('created_at', { ascending: false })

    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }
    if (filters.priority?.length) {
      query = query.in('priority', filters.priority)
    }
    if (filters.assigneeId) {
      query = query.eq('assignee_id', filters.assigneeId)
    }
    if (filters.createdById) {
      query = query.eq('created_by', filters.createdById)
    }
    if (filters.visibility?.length) {
      query = query.in('visibility', filters.visibility)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return []
    }

    const tasks = data?.filter(task => this.canViewTask(task)) || []

    return tasks.map(task => ({
      ...task,
      assignee: task.assignee,
      created_by_user: task.created_by_user,
      comments: task.task_comments || [],
      tags: task.task_tags?.map((tag: any) => tag.tag) || []
    }))
  }

  async getTaskById(taskId: string): Promise<TaskWithDetails | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!tasks_assignee_id_fkey(*),
        created_by_user:users!tasks_created_by_fkey(*),
        task_comments(*, user:users(*)),
        task_tags(*)
      `)
      .eq('id', taskId)
      .eq('organization_id', this.accountId)
      .single()

    if (error || !data) {
      console.error('Error fetching task:', error)
      return null
    }

    if (!this.canViewTask(data)) {
      return null
    }

    return {
      ...data,
      assignee: data.assignee,
      created_by_user: data.created_by_user,
      comments: data.task_comments || [],
      tags: data.task_tags?.map((tag: any) => tag.tag) || []
    }
  }

  async createTask(taskData: TaskCreateData): Promise<Task | null> {
    if (!this.hasCapability('manage_tasks')) {
      throw new Error('Insufficient permissions to create tasks')
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        organization_id: this.accountId,
        created_by: this.userId,
        title: taskData.title,
        description: taskData.description,
        assignee_id: taskData.assigneeId,
        priority: taskData.priority,
        due_date: taskData.dueDate,
        visibility: taskData.visibility,
        status: 'todo'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return null
    }

    if (taskData.tags?.length) {
      await this.updateTaskTags(data.id, taskData.tags)
    }

    await this.logActivity('task_created', {
      task_id: data.id,
      title: taskData.title
    })

    return data
  }

  async updateTask(taskId: string, taskData: TaskUpdateData): Promise<Task | null> {
    if (!this.hasCapability('manage_tasks')) {
      throw new Error('Insufficient permissions to update tasks')
    }

    const existingTask = await this.getTaskById(taskId)
    if (!existingTask) {
      throw new Error('Task not found or insufficient permissions')
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...taskData,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('organization_id', this.accountId)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return null
    }

    await this.logActivity('task_updated', {
      task_id: taskId,
      changes: taskData
    })

    return data
  }

  async deleteTask(taskId: string): Promise<boolean> {
    if (!this.hasCapability('manage_tasks')) {
      throw new Error('Insufficient permissions to delete tasks')
    }

    const existingTask = await this.getTaskById(taskId)
    if (!existingTask) {
      throw new Error('Task not found or insufficient permissions')
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('organization_id', this.accountId)

    if (error) {
      console.error('Error deleting task:', error)
      return false
    }

    await this.logActivity('task_deleted', {
      task_id: taskId,
      title: existingTask.title
    })

    return true
  }

  async addTaskComment(taskId: string, comment: string): Promise<TaskComment | null> {
    const task = await this.getTaskById(taskId)
    if (!task) {
      throw new Error('Task not found or insufficient permissions')
    }

    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: this.userId,
        comment
      })
      .select(`
        *,
        user:users(*)
      `)
      .single()

    if (error) {
      console.error('Error adding task comment:', error)
      return null
    }

    await this.logActivity('task_commented', {
      task_id: taskId,
      comment
    })

    return data
  }

  async updateTaskTags(taskId: string, tags: string[]): Promise<void> {
      await (supabase.from('task_tags') as any).delete().eq('task_id', taskId)

    if (tags.length > 0) {
      const tagInserts = tags.map(tag => ({
        task_id: taskId,
        tag
      }))
      await (supabase.from('task_tags') as any).insert(tagInserts)
    }
  }

  async getTaskStats(): Promise<{
    total: number
    completed: number
    inProgress: number
    overdue: number
  }> {
    const tasks = await this.getTasks()
    
    const now = new Date()
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false
      return new Date(t.due_date) < now
    }).length

    return {
      total,
      completed,
      inProgress,
      overdue
    }
  }

  private async logActivity(action: string, details: any): Promise<void> {
    await supabase.from('audit_logs').insert({
      organization_id: this.accountId,
      user_id: this.userId,
      action: `task_${action}`,
      metadata: details ? (details as any) : null,
      resource_type: 'task',
      resource_id: null
    })
  }
}
