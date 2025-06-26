"use client"

import { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Github, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react"
import { useSupabase } from "@/components/SupabaseProvider"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

function AuthContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailForm, setEmailForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  const { signInWithGitHub, signInWithEmail, signUpWithEmail, resetPassword, user, loading } = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/chat'
  const authError = searchParams.get('error')
  const authSuccess = searchParams.get('success')

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseAnonKey !== 'placeholder-key'

  // Handle URL errors and success messages
  useEffect(() => {
    if (authError) {
      setError(decodeURIComponent(authError))
    }
    if (authSuccess === 'email_confirmed') {
      setMessage('Email confirmed successfully! You can now sign in.')
    }
  }, [authError, authSuccess])

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#0D0D10] flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Supabase Not Configured</h2>
          <p className="text-[#EAEAEA]/70 mb-6">
            Please configure your Supabase environment variables to enable authentication.
          </p>
          <div className="text-left bg-[#0D0D10]/50 rounded-lg p-4 text-sm text-[#EAEAEA]/70">
            <p className="mb-2">Add these to your <code className="bg-[#6C52A0]/20 px-1 rounded">.env.local</code> file:</p>
            <pre className="text-xs">
{`NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key`}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  if (user && !loading) {
    return (
      <div className="min-h-screen bg-[#0D0D10] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C52A0] mx-auto mb-4"></div>
          <p className="text-[#EAEAEA]/70">Redirecting to chat...</p>
        </div>
      </div>
    )
  }

  const handleGitHubAuth = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      await signInWithGitHub()
    } catch (error) {
      console.error('GitHub auth failed:', error)
      setError('GitHub authentication failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailForm.email || !emailForm.password) {
      setError('Please fill in all fields')
      return
    }

    if (isSignUp) {
      if (!emailForm.confirmPassword) {
        setError('Please confirm your password')
        return
      }
      if (emailForm.password !== emailForm.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (emailForm.password.length < 6) {
        setError('Password must be at least 6 characters long')
        return
      }
    }

    setIsLoading(true)
    setError('')
    
    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(emailForm.email, emailForm.password)
        if (error) {
          setError(error.message || 'Sign up failed')
        } else {
          setMessage('Check your email for a confirmation link!')
          setEmailForm({ email: '', password: '', confirmPassword: '' })
        }
      } else {
        const { error } = await signInWithEmail(emailForm.email, emailForm.password)
        if (error) {
          setError(error.message || 'Sign in failed')
        } else {
          // Don't redirect immediately - let the useEffect handle it
          // This prevents race conditions with auth state
          setMessage('Sign in successful! Redirecting...')
        }
      }
    } catch (error) {
      setError(isSignUp ? 'Sign up failed. Please try again.' : 'Sign in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateEmailForm = (field: string, value: string) => {
    setEmailForm(prev => ({ ...prev, [field]: value }))
    setError('')
    setMessage('')
  }

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp)
    setError('')
    setMessage('')
    setEmailForm({ email: '', password: '', confirmPassword: '' })
  }

  return (
    <div className="min-h-screen bg-[#0D0D10] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6C52A0] rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#A0527C] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-[#4F3A75] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Auth Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-auto"
      >
        <div className="bg-[#0D0D10]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="text-[#EAEAEA]/70">
              {isSignUp 
                ? 'Enter your email below to create your account' 
                : 'Enter your credentials to access your account'
              }
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
                <Alert className="bg-red-500/10 border-red-500/20 border">
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
                <Alert className="bg-green-500/10 border-green-500/20 border">
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
            className="space-y-4 mb-6"
          >
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#EAEAEA]/40 w-5 h-5" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={emailForm.email}
                  onChange={(e) => updateEmailForm('email', e.target.value)}
                  className="pl-12 h-12 bg-[#0D0D10]/50 border-[#EAEAEA]/20 text-white placeholder-[#EAEAEA]/40 focus:border-[#6C52A0] rounded-xl transition-all duration-300"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#EAEAEA]/40 w-5 h-5" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={emailForm.password}
                  onChange={(e) => updateEmailForm('password', e.target.value)}
                  className="pl-12 h-12 bg-[#0D0D10]/50 border-[#EAEAEA]/20 text-white placeholder-[#EAEAEA]/40 focus:border-[#6C52A0] rounded-xl transition-all duration-300"
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
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#EAEAEA]/40 w-5 h-5" />
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={emailForm.confirmPassword}
                    onChange={(e) => updateEmailForm('confirmPassword', e.target.value)}
                    className="pl-12 h-12 bg-[#0D0D10]/50 border-[#EAEAEA]/20 text-white placeholder-[#EAEAEA]/40 focus:border-[#6C52A0] rounded-xl transition-all duration-300"
                    disabled={isLoading}
                    required
                  />
                </div>
              </motion.div>
            )}

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isSignUp ? 'Sign Up with Email' : 'Sign In with Email'}
                    <ArrowRight className="w-4 h-4" />
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
              <span className="bg-[#0D0D10] px-4 text-[#EAEAEA]/50 uppercase tracking-wider text-xs">or continue with</span>
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
              className="w-full h-12 bg-[#0D0D10]/50 hover:bg-[#EAEAEA]/10 text-white border border-[#EAEAEA]/20 hover:border-[#EAEAEA]/30 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Github className="w-5 h-5" />
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
            className="text-center mt-8"
          >
            <p className="text-[#EAEAEA]/50 text-sm">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-[#6C52A0] hover:text-[#7C62B0] transition-colors font-medium underline underline-offset-4"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </motion.div>

          {/* Terms and Privacy */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-6"
          >
            <p className="text-xs text-[#EAEAEA]/40">
              By clicking continue, you agree to our{" "}
              <a href="/terms" className="text-[#6C52A0] hover:text-[#7C62B0] transition-colors underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-[#6C52A0] hover:text-[#7C62B0] transition-colors underline">
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
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0D10] flex items-center justify-center">
        <div className="animate-pulse text-white/50">Loading...</div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}