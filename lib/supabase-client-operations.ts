import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

// Client-safe user operations that don't use next/headers
export async function syncUserToDatabaseClient(authUser: User, supabaseClient?: any) {
  if (!authUser?.email) return null

  // Use provided client or create a new one
  const supabase = supabaseClient || createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // First, try to use the safe function if it exists
    try {
      const { data: functionResult, error: functionError } = await supabase
        .rpc('create_user_safely', {
          user_email: authUser.email,
          user_name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'User',
          user_avatar_url: authUser.user_metadata?.avatar_url,
          user_provider: authUser.app_metadata?.provider || 'email'
        })
      
      if (!functionError && functionResult) {
        return functionResult
      }
    } catch (functionError) {
      console.log('Safe function not available, falling back to direct upsert')
    }
    
    // Try with full schema first
    const { data, error } = await supabase
      .from('users')
      .upsert({
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'User',
        avatar_url: authUser.user_metadata?.avatar_url,
        provider: authUser.app_metadata?.provider || 'email',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    // If RLS error, try creating with proper auth context
    if (error && error.code === '42501') {
      console.log('RLS policy blocking user creation, trying with auth.uid()')
      
      const { data: authData, error: authError } = await supabase
        .from('users')
        .upsert({
          id: authUser.id, // Explicitly set the ID to match auth.uid()
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'User',
          avatar_url: authUser.user_metadata?.avatar_url,
          provider: authUser.app_metadata?.provider || 'email',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        })
        .select()
        .single()
      
      if (!authError) {
        return authData
      }
      
      console.error('Error creating user with auth context:', authError)
      return null
    }

    // If schema error, try with minimal required fields
    if (error && (error.code === 'PGRST204' || error.code === '42703')) {
      console.log('Database schema incomplete, using minimal user creation')
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .upsert({
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'User'
        }, {
          onConflict: 'email'
        })
        .select()
        .single()
      
      if (!fallbackError) {
        return fallbackData
      }
      
      console.error('Error creating user with fallback:', fallbackError)
      return null
    }

    if (error) {
      console.error('Error creating/updating user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error syncing user to database:', error)
    return null
  }
} 