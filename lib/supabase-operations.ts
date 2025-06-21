import { supabase } from './supabase'
import type { User, Chat, Message } from './supabase'

// User operations
export async function createOrUpdateUser(email: string, name: string, avatarUrl?: string, provider?: string) {
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
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) return null

  // Get user from our users table
  const user = await getUserByEmail(session.user.email!)
  return user
}

export async function requireAuth() {
  const user = await getUserFromSession()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
} 