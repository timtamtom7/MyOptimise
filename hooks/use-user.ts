import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { supabase, User, Organization } from '@/lib/supabase'

export interface CurrentUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: 'owner' | 'manager' | 'employee' | 'client'
  organizationId: string
  organization: Organization | null
  isActive: boolean
}

export function useCurrentUser() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.email) {
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        setLoading(true)
        
        // First, get the user from our users table using the email from session
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            *,
            organizations (*)
          `)
          .eq('email', session.user?.email || '')
          .single()

        if (userError) throw userError
        if (!userData) throw new Error('User not found in database')

        const currentUser: CurrentUser = {
          id: userData.id,
          email: userData.email,
          fullName: userData.full_name,
          avatarUrl: userData.avatar_url,
          role: userData.role,
          organizationId: userData.organization_id,
          organization: userData.organizations,
          isActive: userData.is_active,
        }

        setUser(currentUser)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user'))
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    // Subscribe to user changes
    const channel = supabase
      .channel(`user:${session?.user?.email}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `email=eq.${session?.user?.email}`,
        },
        (payload) => {
          const updatedUser = payload.new as User & { organizations: Organization }
          setUser(prev => prev ? {
            ...prev,
            fullName: updatedUser.full_name,
            avatarUrl: updatedUser.avatar_url,
            role: updatedUser.role,
            isActive: updatedUser.is_active,
            organization: updatedUser.organizations,
          } : null)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, status])

  return { user, loading, error, session, status }
}

export function useUsers(organizationId: string) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setLoading(false)
      return
    }

    const fetchUsers = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('organization_id', organizationId)
          .order('full_name', { ascending: true })

        if (error) throw error
        setUsers(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch users'))
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()

    // Subscribe to user changes
    const channel = supabase
      .channel(`users:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setUsers(prev => [...prev, payload.new as User])
          } else if (payload.eventType === 'DELETE') {
            setUsers(prev => prev.filter(u => u.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new as User : u))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  return { users, loading, error }
}

export function useUserById(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error
        setUser(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user'))
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  return { user, loading, error }
}