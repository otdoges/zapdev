#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define required and optional environment variables
const ENV_VARS = {
  required: [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase project URL' },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase anonymous key' },
    { key: 'GROQ_API_KEY', description: 'Groq AI API key for chat functionality' }
  ],
  optional: [
    { key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key (for server-side operations)' },
    { key: 'POLAR_ACCESS_TOKEN', description: 'Polar access token for subscription management' },
    { key: 'POLAR_ORGANIZATION_ID', description: 'Polar organization ID' },
    { key: 'POLAR_SUCCESS_URL', description: 'Polar success redirect URL' },
    { key: 'STRIPE_SECRET_KEY', description: 'Stripe secret key for payments' },
    { key: 'STRIPE_WEBHOOK_SECRET', description: 'Stripe webhook secret' },
    { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', description: 'Stripe publishable key' },
    { key: 'BETTER_AUTH_URL', description: 'Authentication base URL' },
    { key: 'BETTER_AUTH_SECRET', description: 'Authentication secret' },
    { key: 'OPENROUTER_API_KEY', description: 'OpenRouter API key for additional AI models' },
    { key: 'AZURE_RESOURCE_NAME', description: 'Azure AI resource name' },
    { key: 'AZURE_API_KEY', description: 'Azure AI API key' },
    { key: 'AZURE_DEPLOYMENT_NAME', description: 'Azure AI deployment name' },
    { key: 'NEXT_PUBLIC_POSTHOG_KEY', description: 'PostHog analytics key' },
    { key: 'NEXT_PUBLIC_POSTHOG_HOST', description: 'PostHog host URL' },
    { key: 'NODE_ENV', description: 'Node environment (development/production)' },
    { key: 'NEXT_PUBLIC_APP_URL', description: 'Application base URL' }
  ]
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

console.log(`\n${colors.blue}🔍 ZapDev Environment Configuration Check${colors.reset}\n`);

if (!envExists) {
  console.log(`${colors.yellow}⚠️  Warning: .env.local file not found${colors.reset}`);
  console.log(`${colors.gray}   Create a .env.local file in the root directory with your environment variables${colors.reset}\n`);
}

// Check required variables
console.log(`${colors.blue}Required Environment Variables:${colors.reset}`);
let hasErrors = false;

ENV_VARS.required.forEach(({ key, description }) => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    console.log(`${colors.red}❌ ${key}${colors.reset} - ${colors.gray}${description}${colors.reset}`);
    hasErrors = true;
  } else {
    console.log(`${colors.green}✅ ${key}${colors.reset} - ${colors.gray}${description}${colors.reset}`);
  }
});

// Check optional variables
console.log(`\n${colors.blue}Optional Environment Variables:${colors.reset}`);
ENV_VARS.optional.forEach(({ key, description }) => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    console.log(`${colors.yellow}⚠️  ${key}${colors.reset} - ${colors.gray}${description}${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ ${key}${colors.reset} - ${colors.gray}${description}${colors.reset}`);
  }
});

// Generate example .env.local content
if (hasErrors || !envExists) {
  console.log(`\n${colors.blue}Example .env.local content:${colors.reset}`);
  console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);
  
  const exampleContent = `# Required Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=your-groq-api-key

# Optional Configuration
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000`;

  console.log(colors.gray + exampleContent + colors.reset);
  console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);
}

// Exit with error code if required variables are missing
if (hasErrors) {
  console.log(`\n${colors.red}❌ Missing required environment variables!${colors.reset}`);
  console.log(`${colors.gray}   Please configure all required variables before running the application.${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`\n${colors.green}✅ All required environment variables are configured!${colors.reset}\n`);
}

// Additional checks for common issues
console.log(`${colors.blue}Additional Checks:${colors.reset}`);

// Check Supabase URL format
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
  console.log(`${colors.yellow}⚠️  NEXT_PUBLIC_SUPABASE_URL doesn't look like a valid Supabase URL${colors.reset}`);
} else if (supabaseUrl) {
  console.log(`${colors.green}✅ Supabase URL format looks correct${colors.reset}`);
}

// Check if running in production without proper config
if (process.env.NODE_ENV === 'production' && (!process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL.includes('localhost'))) {
  console.log(`${colors.yellow}⚠️  Running in production mode with localhost URL${colors.reset}`);
}

console.log(`\n${colors.gray}Run 'bun run dev' to start the development server${colors.reset}\n`); 