import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/chat'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Handle different auth flows
      if (type === 'recovery') {
        // Password recovery - redirect to a password reset page
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      } else if (type === 'signup') {
        // Email confirmation - redirect to welcome or onboarding
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        // Regular OAuth or email confirmation
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`)
} 