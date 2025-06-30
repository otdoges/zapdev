'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';
import { AUTH_REDIRECTS } from '@/lib/auth-constants';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';
import { Label } from '@/components/ui/label';
import { FancyLoadingScreen } from '@/components/fancy-loading-screen';

interface AuthFormContainerProps {
  mode: 'signin' | 'signup';
}

export default function AuthFormContainer({ mode }: AuthFormContainerProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push(AUTH_REDIRECTS.afterLogin);
      }
    };

    checkSession();
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${AUTH_REDIRECTS.afterLogin}`,
        },
      });

      if (signInError) throw signInError;
    } catch (__error) {
      errorLogger.error(ErrorCategory.AUTH, 'Google sign-in failed', { error: _error });
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        
        // Redirect on success
        router.push(AUTH_REDIRECTS.afterLogin);
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${AUTH_REDIRECTS.afterLogin}`,
          },
        });
        
        if (signUpError) throw signUpError;
        
        // Show confirmation message
        setError('');
        alert('Check your email for the confirmation link!');
      }
    } catch (__error) {
      errorLogger.error(
        ErrorCategory.AUTH,
        `${mode === 'signin' ? 'Sign in' : 'Sign up'} failed`,
        { error: _error }
      );
      setError('Authentication failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-[#1E1E24] bg-[#121215]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-sm font-medium">{mode === 'signin' ? 'Sign In' : 'Sign Up'}</CardTitle>
        <CardDescription>{error}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label className="sr-only" htmlFor="email">
            Email
          </Label>
          <Input
            id="email"
            placeholder="name@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-[#1E1E24] bg-[#0D0D10]"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label className="sr-only" htmlFor="password">
            Password
          </Label>
          <Input
            id="password"
            placeholder="********"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-[#1E1E24] bg-[#0D0D10]"
            required
          />
        </div>
        <Button
          onClick={handleEmailAuth}
          className="w-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C]"
          disabled={loading}
        >
          {loading ? 'Signing in...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </Button>
      </CardContent>
      <CardFooter>
        <div className="w-full">
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {mode === 'signin' ? 'Or continue with' : 'Already have an account?'}
            </span>
          </div>
          <Link
            href={mode === 'signin' ? '/signup' : '/signin'}
            className="w-full bg-background text-sm text-muted-foreground hover:underline"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
