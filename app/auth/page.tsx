"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { Github, Sparkles, Zap, ArrowRight, Code, Palette, Rocket, Mail, Lock, AlertCircle } from "lucide-react"
import { useSupabase } from "@/components/SupabaseProvider"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TosPrivacyDialog } from "@/components/ui/tos-privacy-dialog"

const features = [
  {
    icon: <Code className="w-5 h-5" />,
    title: "AI Code Generation",
    description: "Generate beautiful, functional code with advanced AI models"
  },
  {
    icon: <Palette className="w-5 h-5" />,
    title: "Live Preview",
    description: "See your creations come to life with real-time WebContainer execution"
  },
  {
    icon: <Rocket className="w-5 h-5" />,
    title: "Instant Deployment",
    description: "Deploy and share your projects with lightning speed"
  }
]

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Supabase Not Configured</h2>
          <p className="text-gray-300 mb-6">
            Please configure your Supabase environment variables to enable authentication.
          </p>
          <div className="text-left bg-gray-800/50 rounded p-4 text-sm text-gray-300">
            <p className="mb-2">Add these to your <code className="bg-gray-700 px-1 rounded">.env.local</code> file:</p>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Redirecting to chat...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white space-y-6"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-violet-600 rounded-xl">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
              ZapDev
            </h1>
          </div>

          <h2 className="text-5xl font-bold leading-tight">
            Build Amazing
            <span className="block bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Apps with AI
            </span>
          </h2>

          <p className="text-xl text-gray-300 leading-relaxed">
            The most powerful AI-driven development platform. Generate, preview, and deploy 
            beautiful applications in seconds with cutting-edge AI models.
          </p>

          <div className="space-y-4 pt-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
              >
                <div className="p-2 bg-violet-500/20 rounded-lg text-violet-400">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl max-w-md mx-auto">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4"
              >
                <Sparkles className="w-4 h-4" />
                Join thousands of developers
              </motion.div>
              
              <h3 className="text-3xl font-bold text-white mb-2">Welcome to the Future</h3>
              <p className="text-gray-300">Choose your preferred way to get started</p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <Alert className="mb-6 bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="mb-6 bg-green-500/10 border-green-500/20">
                <AlertCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">{message}</AlertDescription>
              </Alert>
            )}

            {/* GitHub Auth Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mb-6"
            >
              <Button
                onClick={handleGitHubAuth}
                disabled={isLoading}
                className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 hover:border-gray-600 rounded-xl font-medium text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Github className="w-6 h-6" />
                    Continue with GitHub
                  </>
                )}
              </Button>
            </motion.div>

            {/* Or Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-transparent px-6 text-gray-400">or</span>
              </div>
            </div>

            {/* Email Auth Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="text-gray-300 text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={emailForm.email}
                    onChange={(e) => updateEmailForm('email', e.target.value)}
                    className="pl-12 h-12 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-violet-500 rounded-xl"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-gray-300 text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="password"
                    placeholder={isSignUp ? "Create a password" : "Enter your password"}
                    value={emailForm.password}
                    onChange={(e) => updateEmailForm('password', e.target.value)}
                    className="pl-12 h-12 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-violet-500 rounded-xl"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-gray-300 text-sm font-medium">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      value={emailForm.confirmPassword}
                      onChange={(e) => updateEmailForm('confirmPassword', e.target.value)}
                      className="pl-12 h-12 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-violet-500 rounded-xl"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 mt-6"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </Button>
            </form>

            {/* Toggle Auth Mode */}
            <div className="text-center mt-6">
              <p className="text-gray-400 text-sm">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            </div>

            {/* Terms and Privacy */}
            <div className="text-center mt-6">
              <p className="text-xs text-gray-400">
                By signing in, you agree to our{" "}
                <TosPrivacyDialog type="tos">
                  <button className="text-violet-400 hover:text-violet-300 transition-colors underline">
                    Terms of Service
                  </button>
                </TosPrivacyDialog>{" "}
                and{" "}
                <TosPrivacyDialog type="privacy">
                  <button className="text-violet-400 hover:text-violet-300 transition-colors underline">
                    Privacy Policy
                  </button>
                </TosPrivacyDialog>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}