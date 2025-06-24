-- Fix RLS Policy for User Creation during OAuth Flow
-- 
-- Issue: Error code 42501 - "new row violates row-level security policy for table 'users'"
-- Root cause: The INSERT policy requires auth.uid() = id, but during OAuth signup,
-- the user record doesn't exist yet and we need to create it first.

-- 1. Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- 2. Create a more permissive INSERT policy for authenticated users
-- This allows authenticated users to create their own user record during OAuth flow
CREATE POLICY "Authenticated users can create own user record" ON public.users
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Allow if the ID matches the authenticated user
    auth.uid() = id OR 
    -- Allow if no ID is provided (will use default auth.uid())
    id IS NULL
  );
-- 3. Update the upsert policy to be more permissive for user creation
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE 
  TO authenticated
  USING (
    auth.uid() = id OR 
    email = auth.email()
  )
  WITH CHECK (
    auth.uid() = id OR 
    email = auth.email()
  );

-- 4. Ensure the SELECT policy allows users to view their own data
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = id OR 
    email = auth.email()
  );

-- 5. Add a policy for upsert operations (which combines INSERT and UPDATE)
CREATE POLICY "Authenticated users can upsert own user record" ON public.users
  FOR ALL
  TO authenticated
CREATE POLICY "Authenticated users can upsert own user record" ON public.users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = id OR 
    email = auth.email()
  )
  WITH CHECK (
    auth.uid() = id OR 
    email = auth.email() OR
    (auth.uid() IS NOT NULL AND id IS NULL)
  );
-- 7. Create a function to handle user creation safely
CREATE OR REPLACE FUNCTION public.create_user_safely(
  user_email TEXT,
  user_name TEXT DEFAULT 'User',
  user_avatar_url TEXT DEFAULT NULL,
  user_provider TEXT DEFAULT 'email'
CREATE OR REPLACE FUNCTION public.create_user_safely(
  user_email TEXT,
  user_name TEXT DEFAULT 'User',
  user_avatar_url TEXT DEFAULT NULL,
  user_provider TEXT DEFAULT 'email'
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  new_user public.users;
BEGIN
  -- Validate that the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Validate input parameters
  IF user_email IS NULL OR user_email = '' THEN
    RAISE EXCEPTION 'Email cannot be null or empty';
  END IF;

  -- Ensure the authenticated user's email matches the provided email
  IF auth.email() <> user_email THEN
    RAISE EXCEPTION 'Email mismatch: authenticated user cannot create record for different email';
  END IF;
  
  -- Insert or update the user
  INSERT INTO public.users (id, email, name, avatar_url, provider)
  VALUES (auth.uid(), user_email, user_name, user_avatar_url, user_provider)
  ON CONFLICT (email) 
  DO UPDATE SET 
    name        = EXCLUDED.name,
    avatar_url  = EXCLUDED.avatar_url,
    provider    = EXCLUDED.provider,
    updated_at  = NOW()
  RETURNING * INTO new_user;
  
  RETURN new_user;
END;
$;SELECT 'RLS policies fixed! Users can now be created during OAuth flow. 🚀' as status; 