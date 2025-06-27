'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

function AuthContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailForm, setEmailForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const { signInWithGitHub, signInWithEmail, signUpWithEmail, resetPassword, user, loading } =
    useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/chat';
  const authError = searchParams.get('error');
  const authSuccess = searchParams.get('success');

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured =
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder-key';

  // Handle URL errors and success messages
  useEffect(() => {
    if (authError) {
      setError(decodeURIComponent(authError));
    }
    if (authSuccess === 'email_confirmed') {
      setMessage('Email confirmed successfully! You can now sign in.');
    }
  }, [authError, authSuccess]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D10] p-4">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-400" />
          <h2 className="mb-4 text-2xl font-bold text-white">Supabase Not Configured</h2>
          <p className="mb-6 text-[#EAEAEA]/70">
            Please configure your Supabase environment variables to enable authentication.
          </p>
          <div className="rounded-lg bg-[#0D0D10]/50 p-4 text-left text-sm text-[#EAEAEA]/70">
            <p className="mb-2">
              Add these to your <code className="rounded bg-[#6C52A0]/20 px-1">.env.local</code>{' '}
              file:
            </p>
            <pre className="text-xs">
              {`NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key`}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  if (user && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D10]">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[#6C52A0]"></div>
          <p className="text-[#EAEAEA]/70">Redirecting to chat...</p>
        </div>
      </div>
    );
  }

  const handleGitHubAuth = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signInWithGitHub();
    } catch (error) {
      errorLogger.error(ErrorCategory.AUTH, 'GitHub auth failed:', error);
      setError('GitHub authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.email || !emailForm.password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp) {
      if (!emailForm.confirmPassword) {
        setError('Please confirm your password');
        return;
      }
      if (emailForm.password !== emailForm.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (emailForm.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(emailForm.email, emailForm.password);
        if (error) {
          setError(error.message || 'Sign up failed');
        } else {
          setMessage('Check your email for a confirmation link!');
          setEmailForm({ email: '', password: '', confirmPassword: '' });
        }
      } else {
        const { error } = await signInWithEmail(emailForm.email, emailForm.password);
        if (error) {
          setError(error.message || 'Sign in failed');
        } else {
          // Don't redirect immediately - let the useEffect handle it
          // This prevents race conditions with auth state
          setMessage('Sign in successful! Redirecting...');
        }
      }
    } catch (error) {
      setError(
        isSignUp ? 'Sign up failed. Please try again.' : 'Sign in failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmailForm = (field: string, value: string) => {
    setEmailForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setMessage('');
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setMessage('');
    setEmailForm({ email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0D0D10] p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="animate-blob absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#6C52A0] mix-blend-multiply blur-3xl filter"></div>
          <div className="animate-blob animation-delay-2000 absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-[#A0527C] mix-blend-multiply blur-3xl filter"></div>
          <div className="animate-blob animation-delay-4000 absolute bottom-1/4 left-1/3 h-96 w-96 rounded-full bg-[#4F3A75] mix-blend-multiply blur-3xl filter"></div>
        </div>
      </div>

      {/* Auth Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/10 bg-[#0D0D10]/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 text-center"
          >
            <h1 className="mb-2 text-3xl font-bold text-white">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="text-[#EAEAEA]/70">
              {isSignUp
                ? 'Enter your email below to create your account'
                : 'Enter your credentials to access your account'}
            </p>
          </motion.div>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <Alert className="border border-red-500/20 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <Alert className="border border-green-500/20 bg-green-500/10">
                  <AlertCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300">{message}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleEmailAuth}
            className="mb-6 space-y-4"
          >
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-[#EAEAEA]/40" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={emailForm.email}
                  onChange={(e) => updateEmailForm('email', e.target.value)}
                  className="h-12 rounded-xl border-[#EAEAEA]/20 bg-[#0D0D10]/50 pl-12 text-white placeholder-[#EAEAEA]/40 transition-all duration-300 focus:border-[#6C52A0]"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-[#EAEAEA]/40" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={emailForm.password}
                  onChange={(e) => updateEmailForm('password', e.target.value)}
                  className="h-12 rounded-xl border-[#EAEAEA]/20 bg-[#0D0D10]/50 pl-12 text-white placeholder-[#EAEAEA]/40 transition-all duration-300 focus:border-[#6C52A0]"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-[#EAEAEA]/40" />
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={emailForm.confirmPassword}
                    onChange={(e) => updateEmailForm('confirmPassword', e.target.value)}
                    className="h-12 rounded-xl border-[#EAEAEA]/20 bg-[#0D0D10]/50 pl-12 text-white placeholder-[#EAEAEA]/40 transition-all duration-300 focus:border-[#6C52A0]"
                    disabled={isLoading}
                    required
                  />
                </div>
              </motion.div>
            )}

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C52A0] to-[#A0527C] font-medium text-white transition-all duration-300 hover:from-[#7C62B0] hover:to-[#B0627C] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    {isSignUp ? 'Sign Up with Email' : 'Sign In with Email'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#EAEAEA]/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#0D0D10] px-4 text-xs uppercase tracking-wider text-[#EAEAEA]/50">
                or continue with
              </span>
            </div>
          </motion.div>

          {/* GitHub Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleGitHubAuth}
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#EAEAEA]/20 bg-[#0D0D10]/50 font-medium text-white transition-all duration-300 hover:border-[#EAEAEA]/30 hover:bg-[#EAEAEA]/10 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Github className="h-5 w-5" />
                  GitHub
                </>
              )}
            </Button>
          </motion.div>

          {/* Toggle Auth Mode */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-[#EAEAEA]/50">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="font-medium text-[#6C52A0] underline underline-offset-4 transition-colors hover:text-[#7C62B0]"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </motion.div>

          {/* Terms and Privacy */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-[#EAEAEA]/40">
              By clicking continue, you agree to our{' '}
              <a
                href="/terms"
                className="text-[#6C52A0] underline transition-colors hover:text-[#7C62B0]"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                className="text-[#6C52A0] underline transition-colors hover:text-[#7C62B0]"
              >
                Privacy Policy
              </a>
              .
            </p>
          </motion.div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0D0D10]">
          <div className="animate-pulse text-white/50">Loading...</div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
