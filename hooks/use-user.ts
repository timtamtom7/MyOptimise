import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { supabase, User, Organization } from '@/lib/supabase'

export interface CurrentUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: 'owner' | 'manager' | 'employee' | 'client'
  accountId: string
  account: Organization | null
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
        
        // Fetch user from API (bypassing RLS issues)
        const res = await fetch('/api/user/profile')
        if (!res.ok) {
            throw new Error(`Failed to fetch user profile: ${res.statusText}`)
        }
        const finalUserData = await res.json()

        const currentUser: CurrentUser = {
          id: finalUserData.id,
          email: finalUserData.email,
          fullName: finalUserData.full_name,
          avatarUrl: finalUserData.avatar_url,
          role: finalUserData.role as any,
          accountId: finalUserData.organization_id,
          account: finalUserData.account,
          isActive: finalUserData.status === 'active',
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
          table: 'profiles',
          filter: `email=eq.${session?.user?.email}`,
        },
        (payload) => {
          const updatedUser = payload.new as any
          setUser(prev => prev ? {
            ...prev,
            fullName: updatedUser.full_name,
            avatarUrl: updatedUser.avatar_url,
            role: updatedUser.role,
            isActive: updatedUser.status === 'active',
            // account: prev.account - preserve existing account data as it's not in the payload
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

export interface OrganizationMember {
  id: string
  full_name: string
  avatar_url?: string | null
}

export function useOrganizationMembers(organizationId: string | undefined) {
  const [data, setData] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setLoading(false)
      setData([])
      return
    }

    const fetchMembers = async () => {
      try {
        setLoading(true)
        const { data: rows, error: err } = await (supabase as any)
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('organization_id', organizationId)
          .order('full_name', { ascending: true })
        if (err) throw err
        setData(((rows || []) as any[]).map((r: any) => ({
          id: r.id,
          full_name: r.full_name,
          avatar_url: r.avatar_url
        })))
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to fetch members'))
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()

    const channel = supabase
      .channel(`org-members:${organizationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `organization_id=eq.${organizationId}` },
        () => fetchMembers()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  return { data, loading, error }
}
