'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TosPrivacyDialog } from '@/components/ui/tos-privacy-dialog';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

function AuthContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailForm, setEmailForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
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

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.replace(redirectTo);
    }
  }, [user, router, redirectTo]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D10]">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[#6C52A0]"></div>
          <p className="text-[#EAEAEA]/70">Loading authentication status...</p>
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
      errorLogger.error(ErrorCategory.AUTH, 'GitHub auth failed', error);
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
          <motion.div 
            className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#6C52A0] mix-blend-multiply blur-3xl filter"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div 
            className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-[#A0527C] mix-blend-multiply blur-3xl filter"
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 180, 90],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
              delay: 2
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 left-1/3 h-96 w-96 rounded-full bg-[#4F3A75] mix-blend-multiply blur-3xl filter"
            animate={{
              scale: [1, 1.1, 1.3, 1],
              rotate: [180, 270, 0, 180],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
              delay: 4
            }}
          />
        </div>
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-[#6C52A0]/30"
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${10 + (i * 12)}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + (i * 0.5),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Auth Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto w-full max-w-md"
      >
        <motion.div 
          className="rounded-3xl border border-white/10 bg-[#0D0D10]/80 p-8 shadow-2xl backdrop-blur-xl"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.2 
              }}
              className="mb-4 flex justify-center"
            >
              <div className="rounded-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] p-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </motion.div>
            <motion.h1 
              className="mb-2 text-3xl font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </motion.h1>
            <motion.p 
              className="text-[#EAEAEA]/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {isSignUp
                ? 'Enter your email below to create your account'
                : 'Enter your credentials to access your account'}
            </motion.p>
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
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div
                  animate={{
                    color: focusedField === 'email' ? '#6C52A0' : '#EAEAEA66',
                    scale: focusedField === 'email' ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform z-10" />
                </motion.div>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={emailForm.email}
                  onChange={(e) => updateEmailForm('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  className="h-12 rounded-xl border-[#EAEAEA]/20 bg-[#0D0D10]/50 pl-12 text-white placeholder-[#EAEAEA]/40 transition-all duration-300 focus:border-[#6C52A0] focus:ring-2 focus:ring-[#6C52A0]/20 focus:bg-[#0D0D10]/70"
                  disabled={isLoading}
                  required
                />
              </motion.div>
            </div>

            <div className="space-y-2">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div
                  animate={{
                    color: focusedField === 'password' ? '#6C52A0' : '#EAEAEA66',
                    scale: focusedField === 'password' ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform z-10" />
                </motion.div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={emailForm.password}
                  onChange={(e) => updateEmailForm('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  className="h-12 rounded-xl border-[#EAEAEA]/20 bg-[#0D0D10]/50 pl-12 pr-12 text-white placeholder-[#EAEAEA]/40 transition-all duration-300 focus:border-[#6C52A0] focus:ring-2 focus:ring-[#6C52A0]/20 focus:bg-[#0D0D10]/70"
                  disabled={isLoading}
                  required
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transform text-[#EAEAEA]/40 hover:text-[#6C52A0] transition-colors z-10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </motion.button>
              </motion.div>
            </div>

            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <motion.div
                    animate={{
                      color: focusedField === 'confirmPassword' ? '#6C52A0' : '#EAEAEA66',
                      scale: focusedField === 'confirmPassword' ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform z-10" />
                  </motion.div>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={emailForm.confirmPassword}
                    onChange={(e) => updateEmailForm('confirmPassword', e.target.value)}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField('')}
                    className="h-12 rounded-xl border-[#EAEAEA]/20 bg-[#0D0D10]/50 pl-12 pr-12 text-white placeholder-[#EAEAEA]/40 transition-all duration-300 focus:border-[#6C52A0] focus:ring-2 focus:ring-[#6C52A0]/20 focus:bg-[#0D0D10]/70"
                    disabled={isLoading}
                    required
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform text-[#EAEAEA]/40 hover:text-[#6C52A0] transition-colors z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </motion.button>
                </motion.div>
              </motion.div>
            )}

            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-xl"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#6C52A0] to-[#A0527C]"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: '200% 200%'
                }}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="relative flex h-12 w-full items-center justify-center gap-2 rounded-xl border-0 bg-transparent font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#6C52A0]/25 disabled:opacity-50"
              >
                {isLoading ? (
                  <motion.div 
                    className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {isSignUp ? 'Sign Up with Email' : 'Sign In with Email'}
                    </motion.span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
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
            whileHover={{ scale: 1.02, borderColor: '#EAEAEA50' }}
            whileTap={{ scale: 0.98 }}
            className="group relative overflow-hidden rounded-xl"
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-[#333]/20 to-[#666]/20 opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
            <Button
              onClick={handleGitHubAuth}
              disabled={isLoading}
              className="relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#EAEAEA]/20 bg-[#0D0D10]/50 font-medium text-white transition-all duration-300 hover:border-[#EAEAEA]/30 hover:bg-[#EAEAEA]/5 disabled:opacity-50"
            >
              {isLoading ? (
                <motion.div 
                  className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <>
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Github className="h-5 w-5" />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Continue with GitHub
                  </motion.span>
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
              <TosPrivacyDialog type="tos">
                <button
                  type="button"
                  className="text-[#6C52A0] underline transition-colors hover:text-[#7C62B0]"
                >
                  Terms of Service
                </button>
              </TosPrivacyDialog>{' '}
              and{' '}
              <TosPrivacyDialog type="privacy">
                <button
                  type="button"
                  className="text-[#6C52A0] underline transition-colors hover:text-[#7C62B0]"
                >
                  Privacy Policy
                </button>
              </TosPrivacyDialog>
              .
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      <style jsx>{`
        .animate-blob {
          opacity: 0.6;
          transform: scale(1);
          animation: blob 15s infinite;
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translateY(0px) scale(1) rotate(0deg);
          }
          33% {
            transform: translateY(-30px) scale(1.1) rotate(120deg);
          }
          66% {
            transform: translateY(20px) scale(0.9) rotate(240deg);
          }
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Subtle glow effect */
        .auth-glow {
          box-shadow: 
            0 0 20px rgba(108, 82, 160, 0.1),
            0 0 40px rgba(160, 82, 124, 0.05),
            0 0 80px rgba(79, 58, 117, 0.03);
        }
        
        /* Custom input focus effect */
        .input-focus-effect {
          position: relative;
        }
        
        .input-focus-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 12px;
          padding: 1px;
          background: linear-gradient(45deg, #6C52A0, #A0527C);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .input-focus-effect:focus-within::before {
          opacity: 1;
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
