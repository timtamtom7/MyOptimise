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
        
        // First, get the user from our users table using the email from session
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            *,
            account:organizations (*)
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
          accountId: userData.organization_id,
          account: userData.account,
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
          const updatedUser = payload.new as User
          setUser(prev => prev ? {
            ...prev,
            fullName: updatedUser.full_name,
            avatarUrl: updatedUser.avatar_url,
            role: updatedUser.role,
            isActive: updatedUser.is_active,
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
