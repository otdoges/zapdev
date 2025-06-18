# 🔧 Fix for "Failed to Fetch" Errors

## 🎯 Problem Identified

Your application is experiencing "failed to fetch" errors because it's missing critical environment variables needed to connect to various services. The main issues are:

1. **Missing Convex Database Connection** - `NEXT_PUBLIC_CONVEX_URL` is not set
2. **Missing API Keys** - OpenRouter, GitHub OAuth, Google OAuth, etc.
3. **Missing Authentication Configuration** - Better Auth setup incomplete

## ✅ Quick Fix Steps

### Step 1: Set Up Environment Variables

I've created a `.env.local` file for you with all required variables. You need to fill in the actual values:

```bash
# 1. Generate a Better Auth secret
openssl rand -base64 32
# Copy the output and replace "your_random_secret_key_here_change_this_in_production" in .env.local
```

### Step 2: Set Up Convex (Database) - **CRITICAL**

This is the most important step to fix the fetch errors:

```bash
# Install Convex CLI if not already installed
npm install -g convex

# Initialize your Convex project
bunx convex dev
```

This will:
- Create a Convex deployment
- Give you a deployment URL (like `https://your-project.convex.cloud`)
- Update your `.env.local` with the correct `NEXT_PUBLIC_CONVEX_URL`

### Step 3: Get API Keys

#### OpenRouter (for AI Chat)
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up and get an API key
3. Replace `your_openrouter_key_here` in `.env.local`

#### GitHub OAuth (for Login)
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App with:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/callback/github`
3. Copy Client ID and Secret to `.env.local`

#### Google OAuth (for Login)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret to `.env.local`

### Step 4: Install Dependencies & Start

```bash
# Install all dependencies
bun install

# Start Convex in the background
bunx convex dev &

# Start the Next.js development server
bun run dev
```

## 🔍 What Was Causing the Errors

### Version Check Component
- Trying to fetch from GitHub API without proper error handling context
- ✅ **Fixed**: Enhanced error handling and made it optional in development

### Chat API Route
- Missing `NEXT_PUBLIC_CONVEX_URL` causing database connection failures
- Missing OpenRouter API key causing AI request failures
- ✅ **Fixed**: Added environment validation with clear error messages

### Convex Client
- ConvexReactClient failing to initialize without proper URL
- ✅ **Fixed**: Added validation and helpful error messages

## 🚀 Testing Your Fix

After completing the setup:

1. **Visit** `http://localhost:3000`
2. **Check Console** - No more "failed to fetch" errors
3. **Test Auth** - Go to `/auth` and try logging in
4. **Test Chat** - Try sending a message to the AI

## 🆘 Troubleshooting

### Still Getting Fetch Errors?

1. **Check Environment Variables**:
   ```bash
   # Verify your .env.local is loaded
   echo $NEXT_PUBLIC_CONVEX_URL
   ```

2. **Restart Development Server**:
   ```bash
   # Kill all processes and restart
   pkill -f "next\|convex"
   bunx convex dev &
   bun run dev
   ```

3. **Check Convex Dashboard**:
   - Go to [Convex Dashboard](https://dashboard.convex.dev/)
   - Verify your deployment is active
   - Check the deployment URL matches your `.env.local`

### Common Issues

- **"ConvexError: Unauthenticated"** → Check Better Auth configuration
- **"OpenRouter API Error"** → Verify your OpenRouter API key
- **"GitHub OAuth Failed"** → Check GitHub OAuth app settings

## 📝 Next Steps

Once the fetch errors are resolved:

1. **Customize your app** - Update branding, colors, etc.
2. **Add more AI models** - Configure additional models in OpenRouter
3. **Set up production** - Configure production environment variables
4. **Deploy** - Use Vercel/Netlify with production Convex deployment

## 🔗 Resources

- [ENV-SETUP.md](./ENV-SETUP.md) - Detailed environment setup guide
- [Convex Documentation](https://docs.convex.dev/)
- [Better Auth Documentation](https://better-auth.com/)
- [OpenRouter Documentation](https://openrouter.ai/docs)

---

**The main fix is setting up Convex with `bunx convex dev` and filling in your API keys in `.env.local`**