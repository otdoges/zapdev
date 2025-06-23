import { createClient } from '@/lib/supabase-server'
import type { User, Chat, Message } from './supabase'

// User operations
export async function createOrUpdateUser(email: string, name: string, avatarUrl?: string, provider?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .upsert({
      email,
      name,
      avatar_url: avatarUrl,
      provider,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'email'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating/updating user:', error)
    throw error
  }

  return data
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows found
    console.error('Error getting user:', error)
    throw error
  }

  return data
}

export async function updateUserSubscription(email: string, subscriptionData: any) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .update({
      stripe_customer_id: subscriptionData.customerId,
      subscription_status: subscriptionData.status,
      subscription_plan: subscriptionData.plan,
      updated_at: new Date().toISOString()
    })
    .eq('email', email)
    .select()
    .single()

  if (error) {
    console.error('Error updating user subscription:', error)
    throw error
  }

  return data
}

// Chat operations
export async function createChat(userId: string, title: string): Promise<Chat> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating chat:', error)
    throw error
  }

  return data
}

export async function getChatsByUserId(userId: string): Promise<Chat[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting chats:', error)
    throw error
  }

  return data || []
}

export async function getChatById(chatId: string): Promise<Chat | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows found
    console.error('Error getting chat:', error)
    throw error
  }

  return data
}

// Message operations
export async function addMessage(chatId: string, role: 'user' | 'assistant', content: string): Promise<Message> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      role,
      content,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding message:', error)
    throw error
  }

  return data
}

export async function getMessagesByChatId(chatId: string): Promise<Message[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error getting messages:', error)
    throw error
  }

  return data || []
}

// Auth helpers
export async function getUserFromSession() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('No authenticated user found')
      return null
    }

    // Get user from our users table if they exist
    if (user.email) {
      try {
        const dbUser = await getUserByEmail(user.email)
        return dbUser
      } catch (error) {
        // If user doesn't exist in our database, that's okay for some operations
        console.log('User not found in database, returning auth user')
        return {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
          provider: 'supabase_auth',
          created_at: user.created_at,
          updated_at: user.updated_at
        } as User
      }
    }

    return null
  } catch (error) {
    console.error('Error getting user from session:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getUserFromSession()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

// Helper to create/sync user in database after auth
export async function syncUserToDatabase(authUser: any) {
  if (!authUser?.email) return null

  try {
    return await createOrUpdateUser(
      authUser.email,
      authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email.split('@')[0],
      authUser.user_metadata?.avatar_url,
      'supabase_auth'
    )
  } catch (error) {
    console.error('Error syncing user to database:', error)
    return null
  }
} 