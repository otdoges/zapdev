import { createClient } from '@/lib/supabase-server';
import type { User, Chat, Message } from './supabase';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

// User operations
export async function createOrUpdateUser(
  email: string,
  name: string,
  avatarUrl?: string,
  provider?: string
) {
  const supabase = await createClient();

  // First, try to use the safe function if it exists
  try {
    const { data: functionResult, error: functionError } = await supabase.rpc(
      'create_user_safely',
      {
        user_email: email,
        user_name: name || 'User',
        user_avatar_url: avatarUrl,
        user_provider: provider || 'email',
      }
    );

    if (!functionError && functionResult) {
      return functionResult;
    }
  } catch (functionError) {
    errorLogger.info(
      ErrorCategory.DATABASE,
      'Safe function not available, falling back to direct upsert'
    );
  }

  // Try with full schema first
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        email,
        name,
        avatar_url: avatarUrl,
        provider,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'email',
      }
    )
    .select()
    .single();

  // If RLS error, try creating with proper auth context
  if (error && error.code === '42501') {
    errorLogger.info(
      ErrorCategory.DATABASE,
      'RLS policy blocking user creation, trying with auth.uid()'
    );

    // Get the current user's auth data
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { data: authData, error: authError } = await supabase
        .from('users')
        .upsert(
          {
            id: authUser.id, // Explicitly set the ID to match auth.uid()
            email,
            name: name || 'User',
            avatar_url: avatarUrl,
            provider: provider || 'email',
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'email',
          }
        )
        .select()
        .single();

      if (!authError) {
        return authData;
      }

      errorLogger.error(
        ErrorCategory.DATABASE,
        'Error creating user with auth context:',
        authError
      );
    }
  }

  // If schema error, try with minimal required fields
  if (error && (error.code === 'PGRST204' || error.code === '42703')) {
    errorLogger.info(
      ErrorCategory.DATABASE,
      'Database schema incomplete, using minimal user creation'
    );
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('users')
      .upsert(
        {
          email,
          name: name || 'User',
        },
        {
          onConflict: 'email',
        }
      )
      .select()
      .single();

    if (fallbackError) {
      errorLogger.error(
        ErrorCategory.DATABASE,
        'Error creating user with fallback:',
        fallbackError
      );
      throw fallbackError;
    }

    return fallbackData;
  }

  if (error) {
    errorLogger.error(ErrorCategory.DATABASE, 'Error creating/updating user:', error);
    throw error;
  }

  return data;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    if (error.code === '42703' || error.code === 'PGRST204') {
      // Column doesn't exist - database schema needs migration
      errorLogger.info(ErrorCategory.DATABASE, 'Database schema incomplete for user lookup');
      return null;
    }
    errorLogger.error(ErrorCategory.DATABASE, 'Error getting user:', error);
    throw error;
  }

  return data;
}

export async function updateUserSubscription(email: string, subscriptionData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .update({
      stripe_customer_id: subscriptionData.customerId,
      subscription_status: subscriptionData.status,
      subscription_plan: subscriptionData.plan,
      updated_at: new Date().toISOString(),
    })
    .eq('email', email)
    .select()
    .single();

  if (error) {
    errorLogger.error(ErrorCategory.DATABASE, 'Error updating user subscription:', error);
    throw error;
  }

  return data;
}

// Chat operations
export async function createChat(userId: string, title: string): Promise<Chat> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    errorLogger.error(ErrorCategory.DATABASE, 'Error creating chat:', error);
    throw error;
  }

  return data;
}

export async function getChatsByUserId(userId: string): Promise<Chat[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    errorLogger.error(ErrorCategory.DATABASE, 'Error getting chats:', error);
    throw error;
  }

  return data || [];
}

export async function getChatById(chatId: string): Promise<Chat | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('chats').select('*').eq('id', chatId).single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    errorLogger.error(ErrorCategory.DATABASE, 'Error getting chat:', error);
    throw error;
  }

  return data;
}

// Message operations
export async function addMessage(
  chatId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<Message> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      role,
      content,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    errorLogger.error(ErrorCategory.DATABASE, 'Error adding message:', error);
    throw error;
  }

  return data;
}

export async function getMessagesByChatId(chatId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) {
    errorLogger.error(ErrorCategory.DATABASE, 'Error getting messages:', error);
    throw error;
  }

  return data || [];
}

// Paginated message fetching with cursor-based pagination
export async function getMessagesByChatIdPaginated(
  chatId: string, 
  pageSize: number = 50, 
  cursor?: string
): Promise<{ messages: Message[], hasMore: boolean, nextCursor?: string, totalCount: number }> {
  const supabase = await createClient();
  
  // Get total count
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('chat_id', chatId);

  // Build query
  let query = supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(pageSize + 1); // Fetch one extra to check if there are more

  // Add cursor condition if provided
  if (cursor) {
    query = query.gt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    errorLogger.error(ErrorCategory.DATABASE, 'Error getting paginated messages:', error);
    throw error;
  }

  const messages = data || [];
  const hasMore = messages.length > pageSize;
  
  // Remove the extra message if we have more
  if (hasMore) {
    messages.pop();
  }

  // Get the cursor for the next page (created_at of the last message)
  const nextCursor = hasMore && messages.length > 0 
    ? messages[messages.length - 1].created_at 
    : undefined;

  return {
    messages,
    hasMore,
    nextCursor,
    totalCount: count || 0
  };
}

// Auth helpers - SECURE SERVER-SIDE AUTHENTICATION
export async function getUserFromSession() {
  try {
    const supabase = await createClient();

    // Use getUser() instead of getSession() for server-side security
    // This validates the JWT token with Supabase servers instead of trusting cookies
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Validate user is actually authenticated and not just cookie data
    if (!user.id || !user.email) {
      return null;
    }

    // Get user from our secure database
    if (user.email) {
      try {
        const dbUser = await getUserByEmail(user.email);
        if (dbUser) {
          return dbUser;
        }
      } catch (dbError) {
        // If database lookup fails, still allow auth user for functionality
        // but log the issue for database schema problems
        errorLogger.info(
          ErrorCategory.DATABASE,
          'Database user lookup failed, using validated auth user'
        );
      }

      // Return validated auth user if database user doesn't exist yet
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || 'User',
        avatar_url: user.user_metadata?.avatar_url,
        provider: user.app_metadata?.providers?.[0] || 'email',
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      } as User;
    }

    return null;
  } catch (error) {
    errorLogger.error(ErrorCategory.DATABASE, 'Authentication validation failed:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getUserFromSession();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Helper to create/sync user in database after auth
export async function syncUserToDatabase(authUser: any) {
  if (!authUser?.email) return null;

  try {
    return await createOrUpdateUser(
      authUser.email,
      authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'Anonymous',
      authUser.user_metadata?.avatar_url,
      authUser.app_metadata?.provider || 'email'
    );
  } catch (error) {
    errorLogger.error(ErrorCategory.DATABASE, 'Error syncing user to database:', error);
    return null;
  }
}
