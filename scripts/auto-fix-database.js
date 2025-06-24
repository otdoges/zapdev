#!/usr/bin/env node

/**
 * Auto Database Schema Fix
 * 
 * This script automatically fixes the database schema issues by running the migration
 * using the Supabase client if credentials are available.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fixDatabaseSchema() {
  console.log('🔧 Auto-fixing database schema issues...\n');

  // Load environment variables
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
    console.log('❌ Supabase credentials not found in .env.local');
    console.log('📋 Please run the database migration manually:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Run the script: scripts/fix-database-schema.sql\n');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🏗️ Creating/updating database schema...');

    // Read the SQL migration file
    const sqlPath = path.join(process.cwd(), 'scripts', 'fix-database-schema.sql');
    if (!fs.existsSync(sqlPath)) {
      console.log('❌ Migration file not found:', sqlPath);
      return false;
    }

    const migrationSQL = fs.readFileSync(sqlPath, 'utf8');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.log('❌ Database migration failed:', error.message);
      console.log('📋 Please run the migration manually in Supabase SQL Editor');
      return false;
    }

    console.log('✅ Database schema fixed successfully!');
    console.log('🚀 Your chat API should now work properly');
    return true;

  } catch (error) {
    console.log('❌ Error running auto-migration:', error.message);
    console.log('📋 Please run the migration manually in Supabase SQL Editor:');
    console.log('   Copy and paste the contents of scripts/fix-database-schema.sql');
    return false;
  }
}

// Alternative: Create a simple table creation query that can be executed
async function createMinimalSchema() {
  console.log('🔧 Creating minimal database schema...');

  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simple SQL to create minimal required schema
    const minimalSQL = `
      -- Create users table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT auth.uid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create chats table if it doesn't exist  
      CREATE TABLE IF NOT EXISTS public.chats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create messages table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

      -- Basic RLS policies
      DROP POLICY IF EXISTS "Users can view own data" ON public.users;
      CREATE POLICY "Users can view own data" ON public.users FOR ALL USING (auth.uid() = id);

      DROP POLICY IF EXISTS "Users can manage own chats" ON public.chats;
      CREATE POLICY "Users can manage own chats" ON public.chats FOR ALL USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can manage messages in own chats" ON public.messages;
      CREATE POLICY "Users can manage messages in own chats" ON public.messages FOR ALL USING (
        EXISTS (SELECT 1 FROM public.chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
      );
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: minimalSQL });

    if (error) {
      console.log('⚠️ Auto-migration not available, manual setup required');
      return false;
    }

    console.log('✅ Minimal database schema created!');
    return true;

  } catch (error) {
    console.log('⚠️ Auto-migration not available, manual setup required');
    return false;
  }
}

async function main() {
  console.log('🚨 URGENT: Fixing Chat API Database Issues\n');

  const success = await fixDatabaseSchema() || await createMinimalSchema();

  if (success) {
    console.log('\n🎉 SUCCESS! Database issues resolved.');
    console.log('📝 Next steps:');
    console.log('   1. Restart your dev server: bun run dev');
    console.log('   2. Test authentication and chat functionality');
    console.log('   3. Your investor demo should now work perfectly!\n');
  } else {
    console.log('\n⚠️ AUTO-FIX NOT POSSIBLE');
    console.log('📋 MANUAL SETUP REQUIRED:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste scripts/fix-database-schema.sql');
    console.log('   4. Click Run');
    console.log('   5. Restart your dev server\n');
  }

  
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixDatabaseSchema, createMinimalSchema }; 