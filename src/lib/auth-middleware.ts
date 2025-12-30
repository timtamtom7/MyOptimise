import { NextRequest, NextResponse } from 'next/server'
import { supabase, getCurrentUser, UserWithCapabilities, Capability } from './supabase'

export interface AuthUser {
  id: string
  email: string
  fullName: string | null
  role: string
  organizationId: string
  capabilities: Capability[]
}

export interface RouteConfig {
  requiredCapabilities?: Capability[]
  requiredRoles?: string[]
  requireOrganization?: boolean
  allowClientAccess?: boolean
  allowEmployeeAccess?: boolean
}

const ROLE_HIERARCHY = {
  owner: 4,
  manager: 3,
  employee: 2,
  client: 1
}

export class AuthMiddleware {
  private static instance: AuthMiddleware

  static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware()
    }
    return AuthMiddleware.instance
  }

  async authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
    try {
      const authHeader = request.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return null
      }

      const token = authHeader.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return null
      }

      const currentUser = await getCurrentUser()
      if (!currentUser) {
        return null
      }

      return {
        id: currentUser.id,
        email: currentUser.email,
        fullName: currentUser.full_name,
        role: currentUser.role,
        organizationId: currentUser.organization_id,
        capabilities: currentUser.capabilities
      }
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  }

  hasCapability(user: AuthUser, capability: Capability): boolean {
    return user.capabilities.includes(capability)
  }

  hasAnyCapability(user: AuthUser, capabilities: Capability[]): boolean {
    return capabilities.some(capability => this.hasCapability(user, capability))
  }

  hasAllCapabilities(user: AuthUser, capabilities: Capability[]): boolean {
    return capabilities.every(capability => this.hasCapability(user, capability))
  }

  hasRole(user: AuthUser, role: string): boolean {
    return user.role === role
  }

  hasRoleLevel(user: AuthUser, minRole: string): boolean {
    const userLevel = ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY] || 0
    const requiredLevel = ROLE_HIERARCHY[minRole as keyof typeof ROLE_HIERARCHY] || 0
    return userLevel >= requiredLevel
  }

  canAccessOrganization(user: AuthUser, organizationId: string): boolean {
    return user.organizationId === organizationId
  }

  authorize(user: AuthUser, config: RouteConfig): { authorized: boolean; reason?: string } {
    if (config.requireOrganization && !user.organizationId) {
      return { authorized: false, reason: 'Organization membership required' }
    }

    if (config.requiredRoles && config.requiredRoles.length > 0) {
      const hasRequiredRole = config.requiredRoles.includes(user.role)
      if (!hasRequiredRole) {
        return { authorized: false, reason: `Required role: ${config.requiredRoles.join(' or ')}` }
      }
    }

    if (config.requiredCapabilities && config.requiredCapabilities.length > 0) {
      const hasRequiredCapabilities = this.hasAnyCapability(user, config.requiredCapabilities)
      if (!hasRequiredCapabilities) {
        return { authorized: false, reason: `Required capability: ${config.requiredCapabilities.join(' or ')}` }
      }
    }

    if (!config.allowClientAccess && user.role === 'client') {
      return { authorized: false, reason: 'Client access not allowed for this resource' }
    }

    if (!config.allowEmployeeAccess && ['owner', 'manager', 'employee'].includes(user.role)) {
      return { authorized: false, reason: 'Employee access not allowed for this resource' }
    }

    return { authorized: true }
  }

  async requireAuth(request: NextRequest, config: RouteConfig = {}): Promise<NextResponse> {
    const user = await this.authenticateRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const authorization = this.authorize(user, config)
    if (!authorization.authorized) {
      return NextResponse.json(
        { error: 'Access denied', reason: authorization.reason },
        { status: 403 }
      )
    }

    const response = NextResponse.next()
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-role', user.role)
    response.headers.set('x-organization-id', user.organizationId)
    response.headers.set('x-user-capabilities', user.capabilities.join(','))
    
    return response
  }

  async getUserFromSession(): Promise<AuthUser | null> {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        return null
      }

      return {
        id: currentUser.id,
        email: currentUser.email,
        fullName: currentUser.full_name,
        role: currentUser.role,
        organizationId: currentUser.organization_id,
        capabilities: currentUser.capabilities
      }
    } catch (error) {
      console.error('Error getting user from session:', error)
      return null
    }
  }

  async logAccessAttempt(userId: string, resource: string, authorized: boolean, reason?: string): Promise<void> {
    try {
      const user = await getCurrentUser()
      if (!user) return

      await supabase.from('audit_logs').insert({
        organization_id: user.organization_id,
        user_id: userId,
        action: 'access_attempt',
        resource_type: 'api_endpoint',
        resource_id: resource,
        details: {
          authorized,
          reason,
          timestamp: new Date().toISOString()
        },
        ip_address: null,
        user_agent: null
      })
    } catch (error) {
      console.error('Error logging access attempt:', error)
    }
  }
}

export const authMiddleware = AuthMiddleware.getInstance()

export const withAuth = (handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>, config: RouteConfig = {}) => {
  return async (request: NextRequest) => {
    const user = await authMiddleware.authenticateRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const authorization = authMiddleware.authorize(user, config)
    await authMiddleware.logAccessAttempt(user.id, request.url, authorization.authorized, authorization.reason)

    if (!authorization.authorized) {
      return NextResponse.json(
        { error: 'Access denied', reason: authorization.reason },
        { status: 403 }
      )
    }

    return handler(request, user)
  }
}

export const getServerSideAuth = async (request: NextRequest): Promise<{ user: AuthUser | null; authorized: boolean; reason?: string }> => {
  const user = await authMiddleware.authenticateRequest(request)
  
  if (!user) {
    return { user: null, authorized: false, reason: 'Authentication required' }
  }

  return { user, authorized: true }
}

export const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
  '/api/auth',
  '/_next',
  '/favicon.ico'
]

export const CLIENT_ONLY_ROUTES = [
  '/dashboard/client',
  '/api/client'
]

export const EMPLOYEE_ONLY_ROUTES = [
  '/dashboard/employee',
  '/api/employee',
  '/api/tasks',
  '/api/calendar'
]

export const ADMIN_ONLY_ROUTES = [
  '/admin',
  '/api/admin'
]