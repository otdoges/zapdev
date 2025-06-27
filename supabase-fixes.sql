-- Supabase Database Linting Fixes
-- This script addresses performance and security issues identified by Supabase's database linter

-- =============================================================================
-- 1. FIX AUTH RLS INITIALIZATION PLAN ISSUES
-- Replace auth.<function>() with (select auth.<function>()) for better performance
-- =============================================================================

-- Drop existing policies that have performance issues
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
DROP POLICY IF EXISTS "Users can view their own email" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

DROP POLICY IF EXISTS "Users can view their own chats." ON public.chats;
DROP POLICY IF EXISTS "Users can insert their own chats." ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats." ON public.chats;
DROP POLICY IF EXISTS "Users can delete their own chats." ON public.chats;
DROP POLICY IF EXISTS "Users can manage their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;

DROP POLICY IF EXISTS "Users can manage messages in their own chats" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages from own chats" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in own chats" ON public.messages;

-- =============================================================================
-- 2. CREATE OPTIMIZED RLS POLICIES FOR USERS TABLE
-- =============================================================================

-- Users can view public profiles
CREATE POLICY "users_select_public" ON public.users
  FOR SELECT
  USING (true); -- Allow viewing public profile data

-- Users can view their own data (optimized)
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (id = (SELECT auth.uid()));

-- Users can insert their own profile (optimized)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

-- Users can update their own data (optimized)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- =============================================================================
-- 3. CREATE OPTIMIZED RLS POLICIES FOR CHATS TABLE
-- =============================================================================

-- Users can view their own chats (optimized)
CREATE POLICY "chats_select_own" ON public.chats
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Users can insert their own chats (optimized)
CREATE POLICY "chats_insert_own" ON public.chats
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can update their own chats (optimized)
CREATE POLICY "chats_update_own" ON public.chats
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can delete their own chats (optimized)
CREATE POLICY "chats_delete_own" ON public.chats
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- =============================================================================
-- 4. CREATE OPTIMIZED RLS POLICIES FOR MESSAGES TABLE
-- =============================================================================

-- Users can view messages from their own chats (optimized)
CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = (SELECT auth.uid())
    )
  );

-- Users can insert messages in their own chats (optimized)
CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = (SELECT auth.uid())
    )
  );

-- Users can update messages in their own chats (optimized)
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = (SELECT auth.uid())
    )
  );

-- Users can delete messages in their own chats (optimized)
CREATE POLICY "messages_delete_own" ON public.messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = (SELECT auth.uid())
    )
  );

-- =============================================================================
-- 5. FIX FUNCTION SEARCH PATH SECURITY ISSUE
-- =============================================================================

-- Fix the update_updated_at_column function to have immutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 6. CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================================================

-- Create indexes to support the RLS policies efficiently
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- =============================================================================
-- 7. VERIFY RLS IS ENABLED
-- =============================================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 8. GRANT APPROPRIATE PERMISSIONS
-- =============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;

-- Grant read-only access to anonymous users for public data
GRANT SELECT ON public.users TO anon;

-- =============================================================================
-- NOTES FOR MANUAL CONFIGURATION
-- =============================================================================

/*
The following issues need to be fixed manually in the Supabase Dashboard:

1. AUTH OTP LONG EXPIRY:
   - Go to Authentication > Settings
   - Set OTP expiry to 1 hour (3600 seconds) or less
   - Currently set to more than 1 hour

2. LEAKED PASSWORD PROTECTION:
   - Go to Authentication > Settings
   - Enable "Check for leaked passwords"
   - This will prevent users from using compromised passwords

These settings cannot be changed via SQL and must be configured through the Supabase Dashboard.
*/

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename, cmd, policyname;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity, relforcerowsecurity
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'messages'); 