# Supabase Database Linting Fixes

This document provides step-by-step instructions to fix all the performance and security issues identified by Supabase's database linter.

## Issues Addressed

### Performance Issues
1. **Auth RLS Initialization Plan** - Optimized RLS policies to prevent unnecessary re-evaluation of `auth.uid()` for each row
2. **Multiple Permissive Policies** - Consolidated duplicate RLS policies to improve query performance

### Security Issues
1. **Function Search Path Mutable** - Fixed `update_updated_at_column` function with immutable search path
2. **Auth OTP Long Expiry** - Instructions to reduce OTP expiry time
3. **Leaked Password Protection** - Instructions to enable compromised password checking

## Implementation Steps

### Step 1: Run the SQL Script

1. **Open your Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to **Database** > **SQL Editor**

2. **Execute the SQL Script**
   - Copy the contents of `supabase-fixes.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute the script

   > ⚠️ **Important**: This script will drop existing RLS policies and recreate them. Make sure you have a backup of your database before running this script.

### Step 2: Manual Configuration in Dashboard

The following settings cannot be changed via SQL and must be configured through the Supabase Dashboard:

#### Fix Auth OTP Long Expiry

1. Go to **Authentication** > **Settings**
2. Scroll to **Email Auth** section
3. Set **OTP expiry** to `3600` seconds (1 hour) or less
4. Click **Save**

#### Enable Leaked Password Protection

1. Go to **Authentication** > **Settings**
2. Scroll to **Password** section
3. Enable **"Check for leaked passwords"**
4. Click **Save**

### Step 3: Verify the Fixes

After running the SQL script, you can verify the changes:

#### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename, cmd, policyname;
```

#### Check RLS Status
```sql
SELECT schemaname, tablename, rowsecurity, relforcerowsecurity
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'messages');
```

#### Test Performance
Run your typical queries to ensure they still work correctly and perform better.

## What Was Changed

### RLS Policy Optimizations

**Before (Problematic)**:
```sql
-- This re-evaluates auth.uid() for every row
USING (user_id = auth.uid())
```

**After (Optimized)**:
```sql
-- This evaluates auth.uid() once per query
USING (user_id = (SELECT auth.uid()))
```

### Policy Consolidation

**Before**: Multiple overlapping policies like:
- "Users can view their own chats."
- "Users can view own chats"
- "Users can manage their own chats"

**After**: Single, clear policies:
- `chats_select_own` - Users can view their own chats
- `chats_insert_own` - Users can insert their own chats
- `chats_update_own` - Users can update their own chats
- `chats_delete_own` - Users can delete their own chats

### Function Security Fix

**Before**:
```sql
CREATE FUNCTION update_updated_at_column()
-- No explicit search_path (security risk)
```

**After**:
```sql
CREATE FUNCTION update_updated_at_column()
SET search_path = public
-- Explicit search_path prevents injection attacks
```

## Performance Improvements

1. **Reduced Policy Evaluations**: Each optimized policy now evaluates `auth.uid()` once per query instead of once per row
2. **Eliminated Duplicate Policies**: Removed multiple permissive policies that were causing unnecessary overhead
3. **Added Strategic Indexes**: Created indexes on `user_id` and `chat_id` columns to support RLS policies efficiently

## Security Enhancements

1. **Fixed Function Search Path**: Prevents potential SQL injection through search path manipulation
2. **OTP Expiry Reduction**: Reduces the window for OTP-based attacks
3. **Leaked Password Protection**: Prevents users from using known compromised passwords

## Testing Your Application

After implementing these fixes:

1. **Test Authentication Flow**: Ensure users can still sign up, sign in, and access their data
2. **Test Chat Functionality**: Verify users can create, read, update, and delete chats and messages
3. **Test Performance**: Monitor query performance, especially for users with many chats/messages
4. **Test Security**: Ensure users cannot access other users' data

## Monitoring

After implementing the fixes, monitor your database performance and run the Supabase database linter again to confirm all issues are resolved:

1. Go to **Database** > **Database Health**
2. Check the **Linter** section for any remaining issues
3. Monitor query performance in the **Performance** section

## Rollback Plan

If you encounter any issues after implementing these fixes:

1. **Have a database backup ready** before making changes
2. **Document current policies** before dropping them
3. **Test in a staging environment** first if possible

## Need Help?

If you encounter any issues:

1. Check the Supabase documentation: https://supabase.com/docs
2. Review the RLS guide: https://supabase.com/docs/guides/auth/row-level-security
3. Check the database linter docs: https://supabase.com/docs/guides/database/database-linter

## Summary

This fix addresses all the major performance and security issues identified by Supabase's database linter:

- ✅ **18 Auth RLS Initialization Plan warnings** - Fixed with optimized queries
- ✅ **47 Multiple Permissive Policies warnings** - Fixed by consolidating policies  
- ✅ **1 Function Search Path warning** - Fixed with explicit search path
- ⚠️ **2 Manual auth settings** - Require dashboard configuration

Expected outcome: Significantly improved database performance and enhanced security posture. 