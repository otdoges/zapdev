import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/chat'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle auth errors
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error: authError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!authError) {
        // Handle different auth flows
        if (type === 'recovery') {
          // Password recovery - redirect to a password reset page
          return NextResponse.redirect(`${origin}/auth/reset-password?next=${encodeURIComponent(next)}`)
        } else if (type === 'signup') {
          // Email confirmation - redirect to success page
          return NextResponse.redirect(`${origin}/auth?success=email_confirmed&next=${encodeURIComponent(next)}`)
        } else {
          // Regular OAuth or email sign in
          return NextResponse.redirect(`${origin}${next}`)
        }
      } else {
        console.error('Auth exchange error:', authError)
        return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(authError.message)}`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`)
    }
  }

  // No code provided - redirect to auth with error
  return NextResponse.redirect(`${origin}/auth?error=missing_auth_code`)
} 