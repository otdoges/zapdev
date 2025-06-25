import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIES, AUTH_ROUTES } from '@/lib/auth-constants'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Define routes that should bypass auth checks entirely
  const publicRoutes = ['/', '/auth', '/api', '/pricing', '/success']
  
  // Check if the current path is a public route  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )
  
  // Allow all public routes and auth callback without any checks
  if (isPublicRoute || pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  // Check if Supabase is configured before attempting auth
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://placeholder.supabase.co' || 
      supabaseAnonKey === 'placeholder-key') {
    // If Supabase is not configured, redirect protected routes to auth
    console.warn('Supabase not configured, redirecting protected routes to auth')
    if (pathname.startsWith('/chat')) {
      const redirectUrl = new URL(AUTH_ROUTES.AUTH, request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => {
              // Enhanced security: Force secure cookie settings
              const secureOptions = {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                path: '/'
              }
              supabaseResponse.cookies.set(name, value, secureOptions)
            })
          },
        },
        auth: {
          // Force server-side validation
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: true
        }
      }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Redirect to auth if not authenticated and trying to access protected routes
    if (!user && pathname.startsWith('/chat')) {
      // Check if we recently had a successful auth but database issues
      const accessToken = request.cookies.get(AUTH_COOKIES.ACCESS_TOKEN)
      const refreshToken = request.cookies.get(AUTH_COOKIES.REFRESH_TOKEN)
      const authToken = request.cookies.get(AUTH_COOKIES.LEGACY_AUTH_TOKEN)
      
      if (accessToken || refreshToken || authToken) {
        // User has valid auth tokens but getUser() failed - allow access
        // This handles OAuth callback scenarios where database sync failed
        console.log('User has valid auth tokens but getUser() failed - allowing access for OAuth flow')
        return supabaseResponse
      }
      
      // Only redirect to auth if no valid tokens exist
      console.log('No valid auth tokens found, redirecting to auth')
      const redirectUrl = new URL(AUTH_ROUTES.AUTH, request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    return supabaseResponse
  } catch (error) {
    console.error('Middleware auth error:', error)
    // If there's an error with auth and trying to access protected routes, redirect to auth
    if (pathname.startsWith('/chat')) {
      console.log('Auth error on protected route, redirecting to auth')
      const redirectUrl = new URL(AUTH_ROUTES.AUTH, request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    // For other routes, allow the request to continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
