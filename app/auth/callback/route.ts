import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { syncUserToDatabase } from '@/lib/supabase-operations';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/chat';
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  errorLogger.info(ErrorCategory.AUTH, 'Auth callback received:', {
    hasCode: !!code,
    hasError: !!error,
    next,
    origin,
    fullUrl: request.url,
  });

  try {
    // Handle auth errors
    if (error) {
      errorLogger.error(ErrorCategory.AUTH, 'Auth callback error:', error, error_description);
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent(error_description || error)}`
      );
    }

    if (code) {
      const supabase = await createClient();

      // Exchange the auth code for a session
      const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);

      if (!authError && data.session) {
        errorLogger.info(
          ErrorCategory.AUTH,
          'Auth exchange successful for user:',
          data.user?.email
        );

        // Attempt to sync user to database, but don't block on failure
        try {
          if (data.user) {
            await syncUserToDatabase(data.user);
            errorLogger.info(ErrorCategory.AUTH, 'User successfully synced to database');
          }
        } catch (syncError) {
          // Log the error but continue - user is authenticated even if database sync fails
          errorLogger.error(ErrorCategory.AUTH, 'Failed to sync user to database:', syncError);
          // We'll handle this gracefully and let the user continue
        }

        // User is now authenticated - redirect to intended destination
        errorLogger.info(
          ErrorCategory.AUTH,
          'OAuth authentication successful, redirecting to:',
          next
        );

        // Handle different auth flows
        if (type === 'recovery') {
          // Password recovery - redirect to a password reset page
          return NextResponse.redirect(
            `${origin}/auth/reset-password?next=${encodeURIComponent(next)}`
          );
        } else if (type === 'signup') {
          // Email confirmation - redirect to success page
          return NextResponse.redirect(
            `${origin}/auth?success=email_confirmed&next=${encodeURIComponent(next)}`
          );
        } else {
          // Regular OAuth or email sign in - redirect to intended destination
          const redirectPath = next.startsWith('/') ? next : `/${next}`;
          return NextResponse.redirect(`${origin}${redirectPath}`);
        }
      } else {
        errorLogger.error(ErrorCategory.AUTH, 'Auth exchange error:', authError);
        return NextResponse.redirect(
          `${origin}/auth?error=${encodeURIComponent(authError?.message || 'authentication_failed')}`
        );
      }
    }
  } catch (error) {
    errorLogger.error(ErrorCategory.AUTH, 'Auth callback exception:', error);
    return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`);
  }

  // No code provided - redirect to auth with error
  errorLogger.warning(ErrorCategory.AUTH, 'Auth callback called without code parameter');
  return NextResponse.redirect(`${origin}/auth?error=missing_auth_code`);
}
