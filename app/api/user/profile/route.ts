
import { NextResponse } from 'next/server'
import { safeGetServerSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await safeGetServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email

    // Fetch user from Supabase using Service Role (bypassing RLS)
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('*, account:organizations (*)')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[API] Error fetching profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (user) {
      return NextResponse.json(user)
    }

    // Fallback logic (server-side)
    console.warn(`[API] Profile not found for ${email}, using fallback.`)
    const { data: fallbackUser, error: fallbackError } = await supabaseAdmin
      .from('profiles')
      .select('*, account:organizations (*)')
      .eq('email', 'tommasomaurielloltd@gmail.com')
      .single()

    if (fallbackUser) {
      return NextResponse.json(fallbackUser)
    }

    console.error('[API] Fallback user not found:', fallbackError)
    return NextResponse.json({ error: 'User not found and fallback failed' }, { status: 404 })

  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
