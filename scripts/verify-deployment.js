#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * This script verifies that all environment variables are properly configured
 * for Vercel deployment and tests authentication flow.
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

console.log(`${colors.blue}🚀 ZapDev Deployment Verification${colors.reset}\n`);

// Load environment variables from .env.local if it exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log(`${colors.green}✅ Found .env.local file${colors.reset}`);
} else {
  console.log(`${colors.yellow}⚠️  No .env.local file found - checking system environment${colors.reset}`);
}

// Critical environment variables for deployment
const criticalVars = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    required: true,
    validate: (value) => value && value.includes('.supabase.co') && !value.includes('placeholder')
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous key',
    required: true,
    validate: (value) => value && value.length > 50 && !value.includes('placeholder')
  },
  {
    key: 'GROQ_API_KEY',
    description: 'Groq AI API key',
    required: true,
    validate: (value) => value && value.startsWith('gsk_')
  }
];

// Optional but recommended variables
const optionalVars = [
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key (for admin operations)',
    validate: (value) => !value || value.length > 50
  },
  {
    key: 'NODE_ENV',
    description: 'Node environment',
    validate: (value) => !value || ['development', 'production', 'test'].includes(value)
  }
];

let hasErrors = false;
let hasWarnings = false;

console.log(`${colors.blue}Checking Critical Environment Variables:${colors.reset}`);
console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);

// Check critical variables
criticalVars.forEach(({ key, description, required, validate }) => {
  const value = process.env[key];
  
  if (!value) {
    console.log(`${colors.red}❌ ${key}: Missing${colors.reset}`);
    console.log(`${colors.gray}   ${description}${colors.reset}`);
    hasErrors = true;
  } else if (validate && !validate(value)) {
    console.log(`${colors.red}❌ ${key}: Invalid format${colors.reset}`);
    console.log(`${colors.gray}   ${description}${colors.reset}`);
    hasErrors = true;
  } else {
    console.log(`${colors.green}✅ ${key}: Configured${colors.reset}`);
  }
});

console.log(`\n${colors.blue}Checking Optional Environment Variables:${colors.reset}`);
console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);

// Check optional variables
optionalVars.forEach(({ key, description, validate }) => {
  const value = process.env[key];
  
  if (!value) {
    console.log(`${colors.yellow}⚠️  ${key}: Not set${colors.reset}`);
    console.log(`${colors.gray}   ${description}${colors.reset}`);
    hasWarnings = true;
  } else if (validate && !validate(value)) {
    console.log(`${colors.yellow}⚠️  ${key}: Invalid format${colors.reset}`);
    console.log(`${colors.gray}   ${description}${colors.reset}`);
    hasWarnings = true;
  } else {
    console.log(`${colors.green}✅ ${key}: Configured${colors.reset}`);
  }
});

// Environment-specific checks
console.log(`\n${colors.blue}Environment-Specific Checks:${colors.reset}`);
console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  console.log(`${colors.green}✅ Running in production mode${colors.reset}`);
  
  // Additional production checks
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || appUrl.includes('localhost')) {
    console.log(`${colors.yellow}⚠️  NEXT_PUBLIC_APP_URL should be set to your domain in production${colors.reset}`);
    hasWarnings = true;
  } else {
    console.log(`${colors.green}✅ App URL configured for production${colors.reset}`);
  }
} else {
  console.log(`${colors.blue}ℹ️  Running in development mode${colors.reset}`);
}

// Check Vercel-specific configuration
if (process.env.VERCEL) {
  console.log(`${colors.green}✅ Running on Vercel${colors.reset}`);
  console.log(`${colors.gray}   Region: ${process.env.VERCEL_REGION || 'unknown'}${colors.reset}`);
  console.log(`${colors.gray}   Environment: ${process.env.VERCEL_ENV || 'unknown'}${colors.reset}`);
} else {
  console.log(`${colors.blue}ℹ️  Not running on Vercel (local development)${colors.reset}`);
}

// Authentication test
console.log(`\n${colors.blue}Testing Authentication Configuration:${colors.reset}`);
console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey && 
    !supabaseUrl.includes('placeholder') && 
    !supabaseKey.includes('placeholder')) {
  console.log(`${colors.green}✅ Supabase configuration looks valid${colors.reset}`);
  console.log(`${colors.gray}   URL: ${supabaseUrl}${colors.reset}`);
  console.log(`${colors.gray}   Key: ${supabaseKey.substring(0, 20)}...${colors.reset}`);
  
  // Try to validate the URL format
  try {
    const url = new URL(supabaseUrl);
    if (url.hostname.endsWith('.supabase.co')) {
      console.log(`${colors.green}✅ Supabase URL format is correct${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Supabase URL doesn't appear to be a valid Supabase URL${colors.reset}`);
      hasWarnings = true;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Supabase URL is not a valid URL${colors.reset}`);
    hasErrors = true;
  }
} else {
  console.log(`${colors.red}❌ Supabase configuration is missing or using placeholders${colors.reset}`);
  hasErrors = true;
}

// Final summary
console.log(`\n${colors.blue}Deployment Summary:${colors.reset}`);
console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);

if (hasErrors) {
  console.log(`${colors.red}❌ Deployment verification failed!${colors.reset}`);
  console.log(`${colors.gray}   Please fix the critical errors above before deploying.${colors.reset}`);
  
  console.log(`\n${colors.blue}Quick Fix Instructions:${colors.reset}`);
  console.log(`${colors.gray}1. Go to your Vercel dashboard${colors.reset}`);
  console.log(`${colors.gray}2. Navigate to your project settings${colors.reset}`);
  console.log(`${colors.gray}3. Go to Environment Variables${colors.reset}`);
  console.log(`${colors.gray}4. Add the missing variables listed above${colors.reset}`);
  console.log(`${colors.gray}5. Redeploy your application${colors.reset}`);
  
  process.exit(1);
} else if (hasWarnings) {
  console.log(`${colors.yellow}⚠️  Deployment verification passed with warnings${colors.reset}`);
  console.log(`${colors.gray}   Your app should work, but consider fixing the warnings for optimal performance.${colors.reset}`);
} else {
  console.log(`${colors.green}✅ Deployment verification passed!${colors.reset}`);
  console.log(`${colors.gray}   Your app is ready for deployment.${colors.reset}`);
}

console.log(`\n${colors.blue}Next Steps:${colors.reset}`);
if (process.env.VERCEL) {
  console.log(`${colors.gray}• Your app is running on Vercel - check the live URL${colors.reset}`);
  console.log(`${colors.gray}• Test authentication by signing in${colors.reset}`);
  console.log(`${colors.gray}• Check browser console for any errors${colors.reset}`);
} else {
  console.log(`${colors.gray}• Run 'bun run build' to test production build${colors.reset}`);
  console.log(`${colors.gray}• Deploy to Vercel when ready${colors.reset}`);
  console.log(`${colors.gray}• Test authentication after deployment${colors.reset}`);
}

console.log(`\n${colors.gray}For more help, check the README.md file${colors.reset}`); 