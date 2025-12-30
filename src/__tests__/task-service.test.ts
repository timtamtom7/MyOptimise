import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TaskService } from '../lib/task-service'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        })),
        in: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        })),
        or: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'task-1', title: 'Test Task' },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { id: 'task-1', title: 'Updated Task' },
                error: null
              }))
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null
          }))
        }))
      }))
    }))
  }
}))

describe('TaskService', () => {
  let taskService: TaskService
  const userId = 'user-123'
  const organizationId = 'org-123'
  const capabilities = ['manage_tasks', 'view_analytics']

  beforeEach(() => {
    taskService = new TaskService(userId, organizationId, capabilities)
    vi.clearAllMocks()
  })

  describe('getTasks', () => {
    it('should return tasks for user with manage_tasks capability', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Test Task',
          status: 'todo',
          priority: 'medium',
          visibility: 'public',
          created_by: userId,
          assignee: null,
          created_by_user: null,
          comments: [],
          tags: []
        }
      ]

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockTasks,
              error: null
            }))
          }))
        }))
      } as any)

      const tasks = await taskService.getTasks()
      expect(tasks).toHaveLength(1)
      expect(tasks[0].title).toBe('Test Task')
    })

    it('should filter tasks by status', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'In Progress Task',
          status: 'in_progress',
          priority: 'medium',
          visibility: 'public',
          created_by: userId,
          assignee: null,
          created_by_user: null,
          comments: [],
          tags: []
        }
      ]

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              order: vi.fn(() => ({
                data: mockTasks,
                error: null
              }))
            }))
          }))
        }))
      } as any)

      const tasks = await taskService.getTasks({ status: ['in_progress'] })
      expect(tasks).toHaveLength(1)
      expect(tasks[0].status).toBe('in_progress')
    })
  })

  describe('createTask', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        priority: 'high' as const,
        visibility: 'public' as const
      }

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'new-task', ...taskData },
              error: null
            }))
          }))
        }))
      } as any)

      const task = await taskService.createTask(taskData)
      expect(task).toBeTruthy()
      expect(task?.title).toBe('New Task')
    })

    it('should throw error if user lacks manage_tasks capability', async () => {
      const taskServiceNoCapability = new TaskService(userId, organizationId, ['view_analytics'])
      
      await expect(taskServiceNoCapability.createTask({
        title: 'New Task',
        priority: 'medium',
        visibility: 'public'
      })).rejects.toThrow('Insufficient permissions to create tasks')
    })
  })

  describe('updateTask', () => {
    it('should update existing task', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Original Task',
        status: 'todo',
        priority: 'medium',
        visibility: 'public',
        created_by: userId,
        assignee: null,
        created_by_user: null,
        comments: [],
        tags: []
      }

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockTask,
                error: null
              }))
            }))
          }))
        }))
      } as any)

      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: { ...mockTask, title: 'Updated Task' },
                  error: null
                }))
              }))
            }))
          }))
        }))
      } as any)

      const updatedTask = await taskService.updateTask('task-1', { title: 'Updated Task' })
      expect(updatedTask).toBeTruthy()
      expect(updatedTask?.title).toBe('Updated Task')
    })
  })

  describe('deleteTask', () => {
    it('should delete task', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Task to Delete',
        status: 'todo',
        priority: 'medium',
        visibility: 'public',
        created_by: userId
      }

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockTask,
                error: null
              }))
            }))
          }))
        }))
      } as any)

      vi.mocked(supabase.from).mockReturnValueOnce({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              error: null
            }))
          }))
        }))
      } as any)

      const result = await taskService.deleteTask('task-1')
      expect(result).toBe(true)
    })
  })

  describe('getTaskStats', () => {
    it('should return task statistics', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'completed',
          priority: 'medium',
          visibility: 'public',
          created_by: userId
        },
        {
          id: 'task-2',
          title: 'Task 2',
          status: 'in_progress',
          priority: 'high',
          visibility: 'public',
          created_by: userId
        },
        {
          id: 'task-3',
          title: 'Task 3',
          status: 'todo',
          priority: 'low',
          visibility: 'public',
          created_by: userId,
          due_date: new Date(Date.now() - 86400000).toISOString()
        }
      ]

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockTasks,
              error: null
            }))
          }))
        }))
      } as any)

      const stats = await taskService.getTaskStats()
      expect(stats.total).toBe(3)
      expect(stats.completed).toBe(1)
      expect(stats.inProgress).toBe(1)
      expect(stats.overdue).toBe(1)
    })
  })

  describe('addTaskComment', () => {
    it('should add comment to task', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Task with Comments',
        status: 'todo',
        priority: 'medium',
        visibility: 'public',
        created_by: userId,
        assignee: null,
        created_by_user: null,
        comments: [],
        tags: []
      }

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockTask,
                error: null
              }))
            }))
          }))
        }))
      } as any)

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: 'comment-1',
                task_id: 'task-1',
                user_id: userId,
                comment: 'Test comment',
                user: { id: userId, full_name: 'Test User' }
              },
              error: null
            }))
          }))
        }))
      } as any)

      const comment = await taskService.addTaskComment('task-1', 'Test comment')
      expect(comment).toBeTruthy()
      expect(comment?.comment).toBe('Test comment')
    })
  })
})