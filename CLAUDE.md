# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZapDev is an AI-powered development platform built with Next.js 15 that enables users to generate, preview, and deploy web applications using AI reasoning models (DeepSeek R1, Qwen QwQ) with WebContainers for browser-based development environments.

## Key Technologies & Architecture

**Stack:**
- Next.js 15 (App Router) with React 18 & TypeScript
- Supabase (PostgreSQL, Auth, Realtime)
- Tailwind CSS + Radix UI components
- WebContainers API for browser-based development
- AI integration: Groq, OpenRouter, OpenAI
- Stripe for payments, Sentry for monitoring

**Authentication:**
- Dual system: GitHub OAuth + Email/Password via Supabase Auth
- Row Level Security (RLS) policies protect user data
- Middleware-based route protection in `middleware.ts`

**Project Structure:**
- `app/` - Next.js App Router (pages, API routes, auth callbacks)
- `components/` - React components including UI library in `ui/`
- `lib/` - Core utilities, services, and business logic
- `lib/services/` - WebContainer management, AI coordination, project templates
- `lib/stores/` - Zustand state management
- `providers/` - React context providers

## Development Commands

```bash
# Development
bun run dev              # Start development server
bun run build           # Build for production  
bun run start           # Start production server

# Testing
bun run test            # Run Vitest tests
bun run test:run        # Run tests once
bun run test:ui         # Open Vitest UI
bun run test:coverage   # Run with coverage

# Code Quality
bun run lint            # Run Next.js ESLint
bun run format          # Format with Prettier
bun run format:check    # Check formatting

# Bundle Analysis  
bun run analyze         # Analyze bundle with @next/bundle-analyzer

# Utility Scripts
bun run check-env       # Validate environment variables
bun run verify-deployment  # Check deployment health
bun run fix-chat        # Fix chat API issues
bun run fix-db          # Auto-fix database issues
bun run optimize-bundle # Optimize build output
bun run remove-console  # Remove console logs
```

## Environment Configuration

Required environment variables for local development:

```env
# AI Services
GROQ_API_KEY=
OPENROUTER_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Optional
POLAR_ACCESS_TOKEN=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

## AI Team Coordination

The platform features an AI team system with specialized roles:
- **System Architect**: Requirements analysis and project structure
- **Frontend Developer**: React/TypeScript/Tailwind components  
- **Backend Developer**: API and server logic
- **DevOps Engineer**: Build configuration and deployment

API coordination happens through `/api/ai-team/coordinate` with structured step-by-step development.

## Database Schema

Core tables with RLS policies:
- `users` - User profiles linked to auth.users
- `chats` - Chat sessions  
- `messages` - Chat messages with role-based content

All tables use UUID primary keys and have proper foreign key relationships with cascade deletes.

## WebContainers Integration

Browser-based Node.js environment enabling:
- Real-time code execution and preview
- Package management (pnpm/npm)
- Terminal access and file system operations
- Live reload and development servers

Managed through `lib/services/webcontainer/` with separate managers for files, projects, and servers.

## Important Development Notes

- Uses Bun as package manager (fallback to npm in CI/CD)
- TypeScript strict mode enabled with path aliases (`@/*`)
- Tailwind configured with custom design system colors and animations
- Bundle optimization includes Monaco Editor configuration for code editing
- Sentry integration for error monitoring and performance tracking
- Analytics through Vercel Analytics and PostHog (proxied)

## Testing Strategy

- Vitest with React Testing Library for component testing
- JSDOM environment for browser simulation
- Tests located in `tests/` directory
- Setup file: `tests/setup.ts`
- Focus on utility functions in `lib/` and component behavior

## Common Patterns

- Server/client Supabase clients with proper SSR handling
- Error logging through centralized `error-logger.ts`
- Form validation with Zod schemas
- State management with Zustand stores
- UI components built on Radix primitives
- Responsive design with mobile-first approach
