# Vibe

AI-powered development platform that lets you create web applications by chatting with AI agents in real-time sandboxes.

## Features

- 🤖 AI-powered code generation with GPT-4 agents
- 💻 Real-time Next.js application development in E2B sandboxes
- 🔄 Live preview and code editing with split-pane interface
- 📁 File explorer with syntax highlighting and code themes
- 💬 Conversational project development with message history
- 🎯 Smart usage tracking and rate limiting
- 💳 Subscription management with pro features
- 🔐 Authentication with Clerk
- 📱 Mobile responsive design
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
- OpenAI GPT-4
- E2B Code Interpreter
- Clerk Authentication
- Inngest
- Prisma
- Radix UI
- Lucide React

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your API keys and database URL

# Set up database
npx prisma migrate dev # Enter name "init" for migration

# Start development server
npm run dev
```

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database
DATABASE_URL="your-postgres-connection-string"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"

# AI (OpenAI)
OPENAI_API_KEY="your-openai-api-key"

# Sandbox (E2B)
E2B_API_KEY="your-e2b-api-key"

# Background Jobs (Inngest), needed only for production
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"
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
