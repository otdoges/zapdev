'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

interface SupabaseContext {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGitHub: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error?: any }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: any }>
  resetPassword: (email: string) => Promise<{ error?: any }>
}

const Context = createContext<SupabaseContext>({
  user: null,
  loading: true,
  signOut: async () => {},
  signInWithGitHub: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
})

// Create Supabase client outside the component to prevent re-instantiation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are missing. Please check your .env.local file.')
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Refresh the page after sign out to clear any cached data
        if (event === 'SIGNED_OUT') {
          window.location.href = '/auth'
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // Remove dependency since supabase client should be stable
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const signInWithGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/chat`
        }
      })
      if (error) {
        console.error('GitHub sign in error:', error)
        throw error
      }
    } catch (error) {
      console.error('GitHub sign in error:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.error('Email sign in error:', error)
      return { error }
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/chat`
        }
      })
      return { error }
    } catch (error) {
      console.error('Email sign up error:', error)
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/chat`
      })
      return { error }
    } catch (error) {
      console.error('Password reset error:', error)
      return { error }
    }
  }

  const value = {
    user,
    loading,
    signOut,
    signInWithGitHub,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useSupabase = () => {
  return useContext(Context)
} 