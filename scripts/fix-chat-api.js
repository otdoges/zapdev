#!/usr/bin/env node

/**
 * Chat API Fix Script
 * 
 * This script helps diagnose and fix the critical issues preventing the chat API from working.

 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Chat API Fix Script');
console.log('====================================================\n');

// Check for .env.local file
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ CRITICAL: .env.local file not found!');
  console.log('📝 Creating template .env.local file...\n');

  const envTemplate = `# Supabase Configuration ⭐ REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Groq API key for AI chat functionality with reasoning models
GROQ_API_KEY=your_groq_api_key_here

# OpenRouter API key (optional, for fallback)
NEXT_OPENROUTER_API_KEY=your_openrouter_key_here

# Gemini API key for prompt enhancement
GEMINI_API_KEY=your_gemini_key_here

# Polar.sh Configuration (for payments and subscriptions)
POLAR_ACCESS_TOKEN=polar_at_your_access_token
POLAR_SERVER=sandbox
POLAR_PRODUCT_ID=your_polar_product_id
POLAR_BASIC_PRODUCT_ID=your_polar_basic_product_id
POLAR_PRO_PRODUCT_ID=your_polar_pro_product_id
POLAR_ENTERPRISE_PRODUCT_ID=your_polar_enterprise_product_id
POLAR_SUCCESS_URL=http://localhost:3000/success
POLAR_WEBHOOK_SECRET=polar_wh_your_webhook_secret

# Optional: Stripe for future billing (deprecated in favor of Polar)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Optional: PostHog for analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`;

  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Template .env.local file created!');
}

// Load environment variables
require('dotenv').config({ path: envPath });

console.log('🔍 Checking Critical Environment Variables:\n');

const criticalVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'GROQ_API_KEY'];

let missingVars = [];

criticalVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.includes('your-') || value.includes('placeholder')) {
    console.log(`❌ ${varName}: Missing or placeholder value`);
    missingVars.push(varName);
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

console.log('\n🔧 Issues Found and Solutions:\n');

if (
  missingVars.includes('NEXT_PUBLIC_SUPABASE_URL') ||
  missingVars.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
) {
  console.log('🔴 CRITICAL: Supabase not configured!');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Create a new project or select existing');
  console.log('   3. Go to Settings → API');
  console.log('   4. Copy Project URL to NEXT_PUBLIC_SUPABASE_URL');
  console.log('   5. Copy anon public key to NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('   6. Run the database migration script (see below)\n');
}

if (missingVars.includes('GROQ_API_KEY')) {
  console.log('🔴 CRITICAL: GROQ_API_KEY missing!');
  console.log('   1. Go to https://console.groq.com/');
  console.log('   2. Create account and get API key');
  console.log('   3. Add key to GROQ_API_KEY in .env.local\n');
}

console.log('🗄️  Database Migration Required:\n');
console.log('📋 To fix the database schema issues, run this SQL in your Supabase SQL Editor:');
console.log('   1. Go to your Supabase dashboard');
console.log('   2. Navigate to SQL Editor');
console.log('   3. Run the script: scripts/fix-database-schema.sql');
console.log('   4. This will fix all table schema and RLS policy issues\n');

console.log('🚨 URGENT ACTION ITEMS:\n');
console.log('1. ✅ Fix environment variables (especially GROQ_API_KEY)');
console.log('2. ✅ Run database migration in Supabase');
console.log('3. ✅ Test chat functionality after fixes');
console.log('4. ✅ Verify authentication flow works');

if (missingVars.length === 0) {
  console.log('\n🎉 All critical environment variables are configured!');
  console.log('   Next: Run the database migration and test the chat');
} else {
  console.log(`\n⚠️  Please fix ${missingVars.length} missing environment variable(s).`);
}

console.log('\n📞 Need help? Check ENV-SETUP.md for detailed instructions.');
