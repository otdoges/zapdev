# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Use `bun` for all package management and script execution:

- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production  
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run test:integration` - Run E2B integration tests (requires tests/ directory)
- `bun run test:api` - Run API endpoint tests (requires tests/ directory)
- `bun run test:code` - Run code execution tests (requires tests/ directory)
- `bun run test:all` - Run all test suites (requires tests/ directory)

Note: Test files are not currently present in the repository structure.

## Architecture Overview

This is "Zapdev", a Next.js 15 app inspired by scout.new that enables AI-assisted React development through E2B sandboxes with advanced features like autonomous execution, web search integration, and multi-chat support.

### Core Architecture
- **Next.js 15 App Router** - Modern Next.js structure with `app/` directory
- **E2B Sandboxes** - Remote code execution environments via `@e2b/code-interpreter`
- **Multi-AI Provider Support** - Anthropic, OpenAI, Google Gemini, and Groq via AI SDK
- **Convex Backend** - Real-time database for persistent chat history and user management
- **Clerk Authentication** - Modern auth system with user management
- **Streaming Architecture** - Real-time AI responses and live sandbox monitoring

### Key Directories & Structure
- `app/api/` - 45+ API routes covering sandbox management, AI interactions, autonomous workflows, monitoring, and integrations
- `app/components/ui/` - Shadcn/ui components (Button, Switch, Toggle, etc.)
- `lib/` - Core utilities including file parsing, multi-agent coordination, audit logging, autonomous pipeline management
- `convex/` - Convex backend schema and functions for chats, users, rate limiting, JWT auth, and usage tracking

### Critical API Route Categories
**Sandbox Management:**
- `create-ai-sandbox`, `sandbox-status`, `get-sandbox-files`, `kill-sandbox`
- `apply-ai-code-stream`, `generate-ai-code-stream`
- `run-command`, `install-packages`, `detect-and-install-packages`

**AI & Autonomous Systems:**
- `ai-system/process`, `autonomous/orchestrator`, `autonomous/pipeline`
- `multi-agent/coordination`, `analyze-edit-intent`

**Integration & Search:**
- `brave-search`, `scrape-url-enhanced`, `scrape-screenshot`
- `github/automation`, `git/workflow`

**Monitoring & Analytics:**
- `monitoring/dashboard`, `monitor/realtime`, `feedback/system`
- Sentry integration via next.config.ts

### Required Environment Variables
See `.env.example` for full list. Key requirements:
- `E2B_API_KEY` - E2B sandbox service  
- `FIRECRAWL_API_KEY` - Web scraping service
- `NEXT_PUBLIC_CONVEX_URL` & `CONVEX_DEPLOY_KEY` - Convex database
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY` - Clerk auth
- At least one AI provider key (ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY)

### Tech Stack Details
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS v4, Framer Motion
- **UI Components:** Shadcn/ui with Radix UI primitives
- **Backend:** Convex (real-time database), Clerk (auth), Stripe (payments)
- **AI/ML:** AI SDK with multiple providers, E2B for code execution
- **Monitoring:** Sentry, PostHog analytics, custom audit logging
- **Search:** Brave Search API integration

The application creates isolated development environments where users can chat with AI agents to generate and modify React applications in real-time, with autonomous execution capabilities and persistent chat history. 
