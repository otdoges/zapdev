import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/chat'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  console.log('Auth callback received:', {
    code: code ? 'present' : 'missing',
    type,
    next,
    error,
    origin,
    fullUrl: request.url
  })

  // Handle auth errors
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    try {
      const supabase = await createClient()
      
      // Exchange the auth code for a session
      const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!authError && data.session) {
        console.log('Auth exchange successful for user:', data.user?.email)
        
        // Sync user to database if they don't exist
        if (data.user?.email) {
          try {
            const { syncUserToDatabase } = await import('@/lib/supabase-operations')
            await syncUserToDatabase(data.user)
          } catch (syncError) {
            console.warn('Failed to sync user to database:', syncError)
            // Don't fail the auth flow for this
          }
        }
        
        // Handle different auth flows
        if (type === 'recovery') {
          // Password recovery - redirect to a password reset page
          return NextResponse.redirect(`${origin}/auth/reset-password?next=${encodeURIComponent(next)}`)
        } else if (type === 'signup') {
          // Email confirmation - redirect to success page
          return NextResponse.redirect(`${origin}/auth?success=email_confirmed&next=${encodeURIComponent(next)}`)
        } else {
          // Regular OAuth or email sign in - redirect to intended destination
          const redirectPath = next.startsWith('/') ? next : `/${next}`
          return NextResponse.redirect(`${origin}${redirectPath}`)
        }
      } else {
        console.error('Auth exchange error:', authError)
        return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(authError?.message || 'authentication_failed')}`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`)
    }
  }

  // No code provided - redirect to auth with error
  console.warn('Auth callback called without code parameter')
  return NextResponse.redirect(`${origin}/auth?error=missing_auth_code`)
} 