# ZapDev

AI-powered development platform that lets you create web applications by chatting with AI agents in real-time sandboxes.

## Features

- 🤖 AI-powered code generation with AI agents (Vercel AI SDK)
- ⚡ Real-time streaming responses for instant feedback
- 💻 Multi-framework support (Next.js, React, Angular, Vue, Svelte) in E2B sandboxes
- 🔄 Live preview & code preview with split-pane interface
- 📁 File explorer with syntax highlighting and code theme
- 💬 Conversational project development with message history
- 🚀 50-70% faster generation times with optimized AI Gateway routing
- 🎯 Smart usage tracking and rate limiting
- 💳 Subscription management with pro features
- 🔐 Authentication with Clerk
- ⚙️ Background job processing with Inngest + Realtime middleware
- 🗃️ Project management and persistence

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- Shadcn/ui
- tRPC
- Prisma ORM
- PostgreSQL
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`) - Official AI SDK with streaming support
- **Vercel AI Gateway** - Routes AI requests across providers (OpenAI, Anthropic, Google, xAI, etc.)
- E2B Code Interpreter - Live sandbox environments
- Clerk Authentication
- Inngest + @inngest/realtime - Background jobs with real-time streaming
- @inngest/agent-kit - AI agent orchestration
- Radix UI
- Lucide React

## Building E2B Template (REQUIRED)

Before running the application, you must build the E2B template that the AI agents use to create sandboxes.

**Prerequisites:**
- Docker must be installed and running (the template build command uses Docker CLI)

```bash
# Install E2B CLI
npm i -g @e2b/cli
# or
brew install e2b

# Login to E2B
e2b auth login

# Navigate to the sandbox template directory
cd sandbox-templates/nextjs

# Build the template (replace 'your-template-name' with your desired name)
e2b template build --name your-template-name --cmd "/compile_page.sh"
```

After building the template, update the template name in `src/inngest/functions.ts`:

```typescript
// Replace "zapdev" with your template name (line 22)
const sandbox = await Sandbox.create("your-template-name");
```

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Fill in your API keys and database URL

# Set up database
npx prisma migrate dev # Enter name "init" for migration

# Start development server
npm run dev
```

### Setting Up Inngest for AI Code Generation

You have two options for running Inngest:

#### Option 1: Inngest Cloud (Recommended for Vercel Deployment)
1. Create an account at [Inngest Cloud](https://app.inngest.com)
2. Create a new app and get your Event Key and Signing Key
3. Add these to your `.env` file:
   ```bash
   INNGEST_EVENT_KEY="your-event-key"
   INNGEST_SIGNING_KEY="your-signing-key"
   ```
4. For local development with cloud, use ngrok/localtunnel:
   ```bash
   npx localtunnel --port 3000
   # Then sync your tunnel URL with Inngest Cloud
   ```

#### Option 2: Local Inngest Dev Server (Development Only)
```bash
# In a second terminal:
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```
- Inngest Dev UI will be available at `http://localhost:8288`
- Note: This won't work for Vercel deployments

## Setting Up Vercel AI Gateway & AI SDK

ZapDev uses the **official Vercel AI SDK** routed through **Vercel AI Gateway** for optimized performance and real-time streaming.

### Setup Steps

1. **Create a Vercel Account**: Go to [Vercel](https://vercel.com) and sign up or log in
2. **Navigate to AI Gateway**: Go to the [AI Gateway Dashboard](https://vercel.com/dashboard/ai-gateway)
3. **Create API Key**: Generate a new API key from the dashboard
4. **Configure Models**: The app uses:
   - `google/gemini-2.5-flash-lite` (framework selection, fast operations)
   - `moonshotai/kimi-k2-0905` (code generation, error fixing)
   - You can switch to other providers (OpenAI, Anthropic, xAI, etc.)

### Key Features

- ⚡ **50-70% Faster**: Optimized model configurations and reduced iterations
- 🌊 **Real-time Streaming**: See code generation progress in real-time
- 🎯 **Smart Routing**: Automatically routes to best available provider
- 📊 **Built-in Monitoring**: Track usage, latency, and errors in Vercel dashboard
- 🔄 **Automatic Retries**: Built-in retry logic for failed requests

### Migrating from Direct OpenAI or @inngest/agent-kit wrappers

If you're upgrading from a previous version:
1. Remove `OPENAI_API_KEY` from your `.env.local`
2. Add `AI_GATEWAY_API_KEY` and optionally `AI_GATEWAY_BASE_URL`
3. Add `INNGEST_REALTIME_KEY` for streaming support (optional, falls back to `INNGEST_EVENT_KEY`)
4. The application now uses Vercel AI SDK with streaming capabilities

### Testing the Connection

Run the comprehensive test suite to verify your setup:
```bash
node test-vercel-ai-gateway.js
```

This tests:
- ✅ Basic connection to AI Gateway
- ✅ Streaming responses with SSE
- ✅ Performance benchmarks across models

## Environment Variables

Create a `.env` file with the following variables:

```bash
DATABASE_URL=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Vercel AI Gateway + AI SDK (replaces OpenAI)
AI_GATEWAY_API_KEY=""
AI_GATEWAY_BASE_URL="https://ai-gateway.vercel.sh/v1"  # Optional, defaults to this

# E2B Sandbox
E2B_API_KEY=""

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"

# Inngest (background job processing + realtime streaming)
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""
INNGEST_REALTIME_KEY=""  # Optional, falls back to INNGEST_EVENT_KEY for realtime features
```

## Deployment to Vercel

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Quick overview:
1. Set up Inngest Cloud account and get your keys
2. Deploy to Vercel with all required environment variables
3. Sync your app with Inngest Cloud (`https://your-app.vercel.app/api/inngest`)
4. Run database migrations on your production database

## Additional Commands

```bash
# Database
npm run postinstall        # Generate Prisma client
npx prisma studio          # Open database studio
npx prisma migrate dev     # Migrate schema changes
npx prisma migrate reset   # Reset database (Only for development)

# Build
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
```

## Project Structure

- `src/app/` - Next.js app router pages and layouts
- `src/components/` - Reusable UI components and file explorer
- `src/modules/` - Feature-specific modules (projects, messages, usage)
- `src/inngest/` - Background job functions and AI agent logic
- `src/lib/` - Utilities and database client
- `src/trpc/` - tRPC router and client setup
- `prisma/` - Database schema and migrations
- `sandbox-templates/` - E2B sandbox configuration

## How It Works

1. **Project Creation**: Users create projects and describe what they want to build
2. **Framework Selection**: AI automatically selects the best framework (Next.js, React, Angular, Vue, or Svelte)
3. **AI Processing**: Messages are sent to AI agents via Inngest background jobs with real-time streaming
4. **Code Generation**: AI agents use E2B sandboxes to generate and test applications
5. **Real-time Updates**: Stream code generation progress and see updates instantly
6. **File Management**: Browse generated files with syntax highlighting
7. **Iteration**: Conversational development allows for refinements and additions

## Performance Optimizations

This version includes significant performance improvements:

- ⚡ **50-70% Faster Generation**: Reduced from 5-10 minutes to 2-3 minutes
- 🎯 **Optimized Iterations**: Code agent (5 max), error fixing (6 max)
- 💾 **Reduced Context**: Only last 2 messages for faster processing
- 🌊 **Real-time Streaming**: See progress as code generates
- 🔄 **Parallel Execution**: Title, response, and sandbox URL generated simultaneously
- 📊 **Smart Temperature**: 0.3 for fast ops, 0.7 for code gen, 0.5 for fixes
- 🎨 **Concise Prompts**: Shorter system prompts for faster responses

See [explanations/vercel_ai_gateway_optimization.md](./explanations/vercel_ai_gateway_optimization.md) for details.

---

Created by [CodeWithAntonio](https://codewithantonio.com)
