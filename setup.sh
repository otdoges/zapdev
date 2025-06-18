#!/bin/bash

echo "🚀 ZapDev Setup Script"
echo "======================"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ No .env.local file found!"
    echo "📋 I've created a template .env.local file for you."
    echo "🔧 Please edit .env.local with your actual API keys and run this script again."
    exit 1
fi

# Check if NEXT_PUBLIC_CONVEX_URL is set
if grep -q "your_convex_deployment_url" .env.local; then
    echo "⚠️  Convex URL not configured yet!"
    echo "🔧 Setting up Convex now..."
    
    # Install Convex if not already installed
    if ! command -v convex &> /dev/null; then
        echo "📦 Installing Convex CLI..."
        npm install -g convex
    fi
    
    echo "🏗️  Starting Convex development deployment..."
    echo "   This will open your browser to authenticate with Convex"
    echo "   and create a new deployment for your project."
    
    bunx convex dev --once
    
    echo "✅ Convex setup complete!"
    echo "📝 Please update your .env.local with the Convex URL shown above"
else
    echo "✅ Convex URL is configured"
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Check for required API keys
echo "🔍 Checking environment configuration..."

missing_keys=()

if grep -q "your_openrouter_key_here" .env.local; then
    missing_keys+=("OpenRouter API Key")
fi

if grep -q "your_github_oauth_client_id" .env.local; then
    missing_keys+=("GitHub OAuth")
fi

if grep -q "your_random_secret_key_here" .env.local; then
    missing_keys+=("Better Auth Secret")
fi

if [ ${#missing_keys[@]} -gt 0 ]; then
    echo "⚠️  Still need to configure:"
    for key in "${missing_keys[@]}"; do
        echo "   - $key"
    done
    echo ""
    echo "📖 See FETCH_ERROR_FIX.md for detailed setup instructions"
    echo "🔗 Or check ENV-SETUP.md for API key setup guides"
else
    echo "✅ All required environment variables are configured!"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Start Convex: bunx convex dev"
echo "2. Start Next.js: bun run dev"
echo "3. Visit: http://localhost:3000"
echo ""
echo "📚 For troubleshooting, see FETCH_ERROR_FIX.md"