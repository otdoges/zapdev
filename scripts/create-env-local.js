#!/usr/bin/env node

/**
 * Create .env.local with proper E2B setup
 */

import { writeFileSync, existsSync } from 'fs';

const envContent = `# ZapDev Environment Configuration
# Based on E2B documentation: https://e2b.dev/docs

# =============================================================================
# AI SERVICES (REQUIRED)
# =============================================================================

# Groq AI API Key (REQUIRED for AI responses)
# Get from: https://console.groq.com/keys
# Using moonshotai/kimi-k2-instruct model for excellent coding and reasoning
VITE_GROQ_API_KEY=

# OpenRouter API Key (OPTIONAL - failsafe for Groq)
# Get from: https://openrouter.ai/dashboard
# Used as backup when Groq fails - moonshotai/kimi-k2:free model
VITE_OPENROUTER_API_KEY=

# E2B Code Execution API Key (REQUIRED for code execution)
# E2B provides secure isolated sandboxes for running AI-generated code
# Get from: https://e2b.dev/dashboard
# Free tier: 100 hours/month of sandbox usage
# Sandboxes start in ~150ms and support Python & JavaScript
VITE_E2B_API_KEY=

# =============================================================================
# APPLICATION (REQUIRED)
# =============================================================================

# Convex Database URL
# Get from: https://dashboard.convex.dev
VITE_CONVEX_URL=

# Clerk Authentication
# Get from: https://dashboard.clerk.com
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# =============================================================================
# ANALYTICS (Optional)
# =============================================================================

# PostHog Analytics
VITE_PUBLIC_POSTHOG_KEY=
VITE_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# =============================================================================
# BILLING (Optional)
# =============================================================================

# Stripe Billing Integration
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTH=
STRIPE_PRICE_PRO_YEAR=
STRIPE_PRICE_ENTERPRISE_MONTH=
STRIPE_PRICE_ENTERPRISE_YEAR=

# Application URL
VITE_APP_URL=http://localhost:5173
PUBLIC_ORIGIN=http://localhost:5173

# =============================================================================
# E2B ADVANCED CONFIG (Optional)
# =============================================================================

# E2B Sandbox Template (optional - defaults to 'base')
# E2B_TEMPLATE=base

# E2B Sandbox Timeout (optional - defaults to 300000ms)
# E2B_TIMEOUT_MS=300000

# =============================================================================
# SETUP INSTRUCTIONS
# =============================================================================
# 1. Get Groq API key: https://console.groq.com/keys
# 2. Get E2B API key: https://e2b.dev/dashboard  
# 3. Fill in the keys above (remove the # comments)
# 4. Restart your dev server: bun dev
# 5. Test with: bun test-ai-only (AI only) or bun test-ai (full tests)
`;

try {
  if (!existsSync('.env.local')) {
    writeFileSync('.env.local', envContent);
    console.log('✅ Created .env.local with configuration');
    console.log('📝 Edit .env.local and add your API keys:');
    console.log('   - Groq: https://console.groq.com/keys');
    console.log('   - E2B: https://e2b.dev/dashboard');
    console.log('   - Stripe: https://dashboard.stripe.com/apikeys');
  } else {
    console.log('ℹ️ .env.local already exists');
    console.log('📝 Make sure it has:');
    console.log('   VITE_GROQ_API_KEY=your_groq_key');
    console.log('   VITE_E2B_API_KEY=your_e2b_key');
    console.log('   STRIPE_SECRET_KEY=sk_test_...');
  }
} catch (error) {
  console.error('❌ Failed to create .env.local:', error.message);
} 