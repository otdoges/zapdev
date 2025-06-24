# 🚨 URGENT: Fix RLS Policy for User Creation

## Issue
OAuth authentication is failing with error:
```
Error code: 42501
Message: "new row violates row-level security policy for table 'users'"
```

## Root Cause
The Row Level Security (RLS) policy on the `users` table is too restrictive and prevents user creation during OAuth sign-up flow.

## Fix Required
You need to apply the SQL migration to fix the RLS policies in your Supabase database.

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Navigate to your project dashboard
3. Click on "SQL Editor" in the sidebar

### Step 2: Apply the Migration
1. Copy the contents of `scripts/fix-rls-policy.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the migration

### Step 3: Verify the Fix
1. Restart your development server: `bun run dev`
2. Try OAuth authentication again
3. Check that users can be created successfully

## What the Migration Does
1. **Drops restrictive policies** that block user creation
2. **Creates permissive policies** that allow authenticated users to create their own records
3. **Adds a safe function** for user creation that bypasses RLS issues
4. **Improves upsert handling** for better OAuth flow support

## Alternative Quick Fix (Temporary)
If you can't access the SQL Editor immediately, you can temporarily disable RLS on the users table:

```sql
-- TEMPORARY FIX - NOT RECOMMENDED FOR PRODUCTION
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

⚠️ **Warning**: This removes security, so apply the proper fix as soon as possible.

## Code Changes Applied
- Updated `createOrUpdateUser` function to handle RLS errors gracefully
- Added fallback logic to use `auth.uid()` explicitly
- Added support for the new safe function when available

## Status
✅ Code fixes applied
❌ Database migration pending (manual step required) 