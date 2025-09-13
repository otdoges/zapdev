# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZapDev is a Next.js application that enables users to chat with AI to build React apps instantly. It automatically detects available AI models based on API keys and intelligently routes URLs vs search terms for seamless development.

## Essential Commands

### Development
```bash
bun dev              # Start development server with Turbopack
bun build            # Build for production
bun start            # Start production server
bun lint             # Run ESLint
```

### Testing
```bash
bun run test:api     # Test API endpoints
bun run test:code    # Test code execution
bun run test:all     # Run all tests (integration, API, and code)
```

### Database (Convex)
```bash
bunx convex dev      # Start Convex development backend
bunx convex deploy   # Deploy Convex schema and functions
```

## Architecture Overview

### Core Technologies
- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: Convex for database and real-time features
- **Authentication**: Clerk for user management
- **AI Integration**: Multiple AI providers (Anthropic, OpenAI, Google, Groq) with automatic model detection
- **Sandboxing**: Vercel Sandbox API or E2B for code execution
- **Package Manager**: Bun (exclusively used throughout project)

### Key Components

#### Model Detection System (`lib/model-detector.ts`)
- Automatically detects available AI models based on environment variables
- Priority ranking: Groq/Kimi > Anthropic > OpenAI > Google Gemini
- Provides both server-side and client-side detection capabilities

#### Sandbox Architecture (`lib/sandbox/`)
- Factory pattern for sandbox providers
- Support for Vercel Sandbox (default) and E2B
- Manages code execution environments and file operations

#### Convex Backend (`convex/`)
- Schema-driven database with TypeScript validation
- Real-time chat functionality with message encryption support
- User management, analytics, and rate limiting
- JWT authentication and API key management

### API Routes (`app/api/`)
Key endpoints:
- `/api/generate-ai-code-stream` - Stream AI code generation
- `/api/apply-ai-code-stream` - Apply generated code to sandbox
- `/api/create-ai-sandbox` - Initialize new sandbox environment
- `/api/scrape-website` - Web scraping for URL analysis
- `/api/detect-model` - Client-side model detection

### Component Structure
- `components/app/` - Application-specific components
- `components/shared/` - Reusable components across the app
- Heavy use of Radix UI components for accessibility
- Framer Motion for animations

## Environment Configuration

Required environment variables:
- `FIRECRAWL_API_KEY` - For web scraping functionality
- At least one AI provider key (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
- Sandbox provider configuration (Vercel or E2B)

See `.env.example` for complete configuration guide.

## Development Patterns

### State Management
- React hooks for local state
- Jotai for global state management
- Convex for server state and real-time updates

### Styling
- Tailwind CSS with custom design system
- Component variants using class-variance-authority
- Custom color palette defined in `colors.json`

### Type Safety
- Strict TypeScript configuration
- Zod for runtime validation
- Convex validators for database operations

## Testing Strategy
- API endpoint testing with custom test files
- Code execution validation
- Integration tests for complete user flows

## Security Considerations
- Message encryption support in Convex schema
- API key validation and secure storage
- Rate limiting on AI requests
- Input sanitization for code execution