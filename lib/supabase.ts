import { createClient } from '@supabase/supabase-js';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  errorLogger.warning(
    ErrorCategory.DATABASE,
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Validate environment variables
const isValidUrl = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co';
const isValidKey = supabaseAnonKey && supabaseAnonKey !== 'placeholder-key';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'zapdev-app',
      },
    },
  }
);

// Export configuration status
export const isSupabaseConfigured = isValidUrl && isValidKey;

// Database types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
  stripe_customer_id?: string;
  subscription_status?: string;
  subscription_plan?: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    full_name?: string;
  };
}
