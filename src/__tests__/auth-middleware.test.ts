import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, authMiddleware } from '../lib/auth-middleware'
import { supabase, getCurrentUser } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'user-123', role: 'employee', organization_id: 'org-123' },
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({ error: null }))
    }))
  },
  getCurrentUser: vi.fn()
}))

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware

  beforeEach(() => {
    middleware = new AuthMiddleware()
    vi.clearAllMocks()
  })

  describe('authenticateRequest', () => {
    it('should return null for missing authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')
      const user = await middleware.authenticateRequest(request)
      expect(user).toBeNull()
    })

    it('should return null for invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })

      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Invalid token')
      } as any)

      const user = await middleware.authenticateRequest(request)
      expect(user).toBeNull()
    })

    it('should return authenticated user for valid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { 
          user: { 
            id: 'user-123', 
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2023-01-01T00:00:00Z'
          } 
        },
        error: null
      } as any)

      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'employee',
        organization_id: 'org-123',
        capabilities: ['manage_tasks', 'view_analytics']
      } as any)

      const user = await middleware.authenticateRequest(request)
      expect(user).toBeTruthy()
      expect(user?.id).toBe('user-123')
      expect(user?.email).toBe('test@example.com')
      expect(user?.role).toBe('employee')
    })
  })

  describe('hasCapability', () => {
    it('should return true for existing capability', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'employee',
        organizationId: 'org-123',
        capabilities: ['manage_tasks', 'view_analytics']
      }

      expect(middleware.hasCapability(user, 'manage_tasks')).toBe(true)
    })

    it('should return false for missing capability', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'employee',
        organizationId: 'org-123',
        capabilities: ['view_analytics']
      }

      expect(middleware.hasCapability(user, 'manage_tasks')).toBe(false)
    })
  })

  describe('hasRole', () => {
    it('should return true for matching role', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'employee',
        organizationId: 'org-123',
        capabilities: ['manage_tasks']
      }

      expect(middleware.hasRole(user, 'employee')).toBe(true)
    })

    it('should return false for non-matching role', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'employee',
        organizationId: 'org-123',
        capabilities: ['manage_tasks']
      }

      expect(middleware.hasRole(user, 'manager')).toBe(false)
    })
  })

  describe('hasRoleLevel', () => {
    it('should return true for user with higher role level', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'manager',
        organizationId: 'org-123',
        capabilities: ['manage_tasks']
      }

      expect(middleware.hasRoleLevel(user, 'employee')).toBe(true)
    })

    it('should return false for user with lower role level', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'employee',
        organizationId: 'org-123',
        capabilities: ['manage_tasks']
      }

      expect(middleware.hasRoleLevel(user, 'manager')).toBe(false)
    })
  })

  describe('authorize', () => {
    it('should authorize user with required capabilities', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'employee',
        organizationId: 'org-123',
        capabilities: ['manage_tasks', 'view_analytics']
      }

      const config = {
        requiredCapabilities: ['manage_tasks']
      }

      const result = middleware.authorize(user, config)
      expect(result.authorized).toBe(true)
    })

    it('should deny user without required capabilities', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'employee',
        organizationId: 'org-123',
        capabilities: ['view_analytics']
      }

      const config = {
        requiredCapabilities: ['manage_tasks']
      }

      const result = middleware.authorize(user, config)
      expect(result.authorized).toBe(false)
      expect(result.reason).toContain('Required capability')
    })

    it('should deny client access when not allowed', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'client',
        organizationId: 'org-123',
        capabilities: ['view_analytics']
      }

      const config = {
        allowClientAccess: false
      }

      const result = middleware.authorize(user, config)
      expect(result.authorized).toBe(false)
      expect(result.reason).toContain('Client access not allowed')
    })

    it('should require organization membership when specified', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'employee',
        organizationId: '',
        capabilities: ['manage_tasks']
      }

      const config = {
        requireOrganization: true
      }

      const result = middleware.authorize(user, config)
      expect(result.authorized).toBe(false)
      expect(result.reason).toContain('Organization membership required')
    })
  })

  describe('requireAuth', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')

      const response = await middleware.requireAuth(request)
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })

    it('should return 403 for unauthorized requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { 
          user: { 
            id: 'user-123', 
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2023-01-01T00:00:00Z'
          } 
        },
        error: null
      } as any)

      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'employee',
        organization_id: 'org-123',
        capabilities: ['view_analytics']
      } as any)

      const config = {
        requiredCapabilities: ['manage_tasks']
      }

      const response = await middleware.requireAuth(request, config)
      expect(response.status).toBe(403)
      
      const data = await response.json()
      expect(data.error).toBe('Access denied')
      expect(data.reason).toContain('Required capability')
    })

    it('should allow authorized requests and set headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { 
          user: { 
            id: 'user-123', 
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2023-01-01T00:00:00Z'
          } 
        },
        error: null
      } as any)

      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'employee',
        organization_id: 'org-123',
        capabilities: ['manage_tasks', 'view_analytics']
      } as any)

      const response = await middleware.requireAuth(request)
      expect(response.status).toBe(200)
      expect(response.headers.get('x-user-id')).toBe('user-123')
      expect(response.headers.get('x-user-role')).toBe('employee')
      expect(response.headers.get('x-organization-id')).toBe('org-123')
      expect(response.headers.get('x-user-capabilities')).toBe('manage_tasks,view_analytics')
    })
  })
})