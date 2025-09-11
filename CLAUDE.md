# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

All commands use `bun` as the package manager:

- `bun dev` - Start development server with Turbopack
- `bun build` - Build the production application
- `bun start` - Start production server
- `bun lint` - Run ESLint (includes TypeScript checking)
- `bun test:api` - Run API endpoint tests
- `bun test:code` - Run code execution tests
- `bun test:all` - Run all tests (integration, API, and code tests)

## Architecture Overview

**ZapDev** is an AI-powered React app builder with the following core architecture:

### Tech Stack
- **Framework**: Next.js 15 with App Router and React 19
- **Runtime**: Bun for package management and development
- **Authentication**: Clerk with Convex integration
- **Database**: Convex (serverless database with real-time sync)
- **Styling**: Tailwind CSS with Radix UI components
- **AI Integration**: Multi-provider support (Anthropic, OpenAI, Google Gemini, Groq)
- **Code Execution**: Dual sandbox providers (Vercel Sandbox, E2B)

### Key Features
- **Smart AI Model Detection**: Automatically selects best available AI model based on API keys
- **Intelligent URL Routing**: Detects URLs vs search terms for seamless web scraping
- **Live Code Sandboxes**: Real-time React app building with instant previews
- **Auto-Linting**: Built-in ESLint integration with automatic code fixes
- **Web Scraping**: Firecrawl integration for extracting website content

### Core Directory Structure

#### `/app` - Next.js App Router
- `/api/*` - API routes for AI generation, sandbox management, web scraping
- `/generation` - Protected main app interface
- `/sign-in`, `/sign-up` - Clerk authentication pages
- `layout.tsx` - Root layout with Clerk and Convex providers

#### `/components` - React Components
- `/app/(home)/sections/*` - Landing page sections with complex animations
- `/shared/*` - Reusable UI components and effects
- Follows component co-location pattern with associated assets

#### `/lib` - Core Utilities
- `sandbox/` - Sandbox provider abstraction (Vercel/E2B)
- `context-selector.ts` - File selection logic for AI context
- `edit-intent-analyzer.ts` - Analyzes user edit intentions
- `file-search-executor.ts` - Intelligent file searching
- `model-detector.ts` - AI model selection logic
- `linter.ts` - Code linting and fixing

#### `/convex` - Backend Functions
- Authentication, rate limiting, analytics, chat management
- Real-time database schema and mutations
- JWT integration with Clerk

### Sandbox Architecture

The app uses a dual-provider sandbox system:

1. **Vercel Sandbox** (default): Uses OIDC tokens or personal access tokens
2. **E2B Sandbox** (alternative): Uses E2B API keys

Sandbox selection is environment-driven via `SANDBOX_PROVIDER` variable.

### AI Integration

Multi-provider AI setup with intelligent routing:
- Supports Anthropic (Claude), OpenAI (GPT), Google (Gemini), Groq (Llama)
- Optional AI Gateway support for unified access
- Context-aware file selection for efficient token usage
- Streaming responses for real-time code generation

### Authentication Flow

Clerk handles authentication with Convex backend integration:
- JWT token validation
- User profile management
- Route protection via middleware
- Real-time user state synchronization

## Development Notes

### Environment Setup
Requires multiple API keys for full functionality:
- **Required**: `FIRECRAWL_API_KEY` for web scraping
- **AI Provider**: At least one of Anthropic, OpenAI, Gemini, or Groq API keys
- **Sandbox**: Either Vercel (OIDC token/personal token) or E2B credentials
- **Auth**: Clerk keys for authentication
- **Database**: Convex deployment URL

### Code Style
- Uses ESLint with Next.js and TypeScript configs
- Relaxed rules: allows `any`, unused vars as warnings
- Prefers composition over inheritance
- Component co-location with assets and styles

### Testing Strategy
- API endpoint testing via custom Node.js scripts
- Code execution validation
- Integration tests for full flow validation
- No traditional unit testing framework configured