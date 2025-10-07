# Vibe

AI-powered development platform that lets you create web applications by chatting with AI agents in real-time sandboxes.

## Features

- 🤖 AI-powered code generation with AI agents
- 💻 Real-time Next.js application development in E2B sandboxes
- 🔄 Live preview & code preview with split-pane interface
- 📁 File explorer with syntax highlighting and code theme
- 💬 Conversational project development with message history
- 🎯 Smart usage tracking and rate limiting
- 💳 Subscription management with pro features
- 🔐 Authentication with Clerk
- ⚙️ Background job processing with Inngest
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
- Vercel AI Gateway (supports OpenAI, Anthropic, Grok, and more)
- E2B Code Interpreter
- Clerk Authentication
- Inngest
- Prisma
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

# Start development servers (requires two terminals)
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Inngest dev server (for AI code generation)
npm run dev:inngest
# OR
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

**Important**: Both servers must be running for AI code generation to work:
- Next.js app runs on `http://localhost:3000`
- Inngest Dev UI runs on `http://localhost:8288`

You can also use the helper script: `./start-dev.sh`

## Setting Up Vercel AI Gateway

1. **Create a Vercel Account**: Go to [Vercel](https://vercel.com) and sign up or log in
2. **Navigate to AI Gateway**: Go to the [AI Gateway Dashboard](https://vercel.com/dashboard/ai-gateway)
3. **Create API Key**: Generate a new API key from the dashboard
4. **Choose Your Model**: The configuration uses OpenAI models by default, but you can switch to other providers like Anthropic, xAI, etc.

### Migrating from Direct OpenAI

If you're upgrading from a previous version that used OpenAI directly:
1. Remove `OPENAI_API_KEY` from your `.env.local`
2. Add `AI_GATEWAY_API_KEY` and `AI_GATEWAY_BASE_URL` as shown below
3. The application now routes all AI requests through Vercel AI Gateway for better monitoring and reliability

### Testing the Connection

Run the included test script to verify your Vercel AI Gateway setup:
```bash
node test-vercel-ai-gateway.js
```

## Environment Variables

Create a `.env` file with the following variables:

```bash
DATABASE_URL=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Vercel AI Gateway (replaces OpenAI)
AI_GATEWAY_API_KEY=""
AI_GATEWAY_BASE_URL="https://ai-gateway.vercel.sh/v1/"

# E2B
E2B_API_KEY=""

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"
```

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
2. **AI Processing**: Messages are sent to GPT-4 agents via Inngest background jobs
3. **Code Generation**: AI agents use E2B sandboxes to generate and test Next.js applications
4. **Real-time Updates**: Generated code and previews are displayed in split-pane interface
5. **File Management**: Users can browse generated files with syntax highlighting
6. **Iteration**: Conversational development allows for refinements and additions

---

Created by [CodeWithAntonio](https://codewithantonio.com)
