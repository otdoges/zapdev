# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Use `bun` for all package management and script execution:

- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production  
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run test:integration` - Run E2B integration tests
- `bun run test:api` - Run API endpoint tests  
- `bun run test:code` - Run code execution tests
- `bun run test:all` - Run all test suites

## Architecture Overview

This is a Next.js 15 app that enables AI-assisted React development through E2B sandboxes. Key architectural components:

### Core Structure
- **Next.js App Router** - Modern Next.js structure with `app/` directory
- **E2B Integration** - Remote sandbox environments for code execution via `@e2b/code-interpreter`
- **Multi-AI Provider Support** - Anthropic, OpenAI, Google Gemini, and Groq via AI SDK
- **Real-time Updates** - Streaming responses and live sandbox monitoring

### Key Directories
- `app/api/` - API routes for sandbox management, code generation, and AI interactions
- `components/` - React components including UI components and sandbox preview
- `lib/` - Utilities for file parsing, context selection, and edit analysis
- `app/components/ui/` - Shadcn/ui components (Button, Textarea, etc.)

### Critical API Routes
- `create-ai-sandbox` - Creates new E2B sandbox instances
- `generate-ai-code-stream` - Streams AI-generated code
- `apply-ai-code-stream` - Applies code changes to sandbox
- `sandbox-status` - Monitors sandbox health
- `get-sandbox-files` - Retrieves sandbox file structure

### Environment Variables Required
- `E2B_API_KEY` - E2B sandbox service
- `FIRECRAWL_API_KEY` - Web scraping service  
- At least one AI provider key (ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY)

### Tech Stack
- Next.js 15 with TypeScript
- Tailwind CSS v4 with shadcn/ui components
- Framer Motion for animations
- React Syntax Highlighter for code display
- Zod for validation

The app creates isolated development environments where users can chat with AI to generate and modify React applications in real-time.