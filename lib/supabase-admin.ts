import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Graceful handling for build time when env vars might not be available
if (!supabaseUrl) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Missing env.NEXT_PUBLIC_SUPABASE_URL - admin operations will not work');
  }
}

if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will not work.');
}

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and can bypass your RLS policies!
const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey) 
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

export { supabaseAdmin }; 