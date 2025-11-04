# Claude AI Integration Guide

## Overview

ZapDev is an AI-powered development platform that enables users to create web applications through conversational AI interactions. The platform leverages Claude AI (via Vercel AI Gateway) to generate production-ready code across multiple frameworks in real-time sandboxes.

## Architecture

### Core Components

1. **AI Gateway Integration**
   - Uses Vercel AI Gateway for Claude AI access
   - Supports multiple AI models (OpenAI, Anthropic, Grok)
   - Centralized API key management

2. **Code Generation Agent**
   - Executes framework-specific prompts to build the requested app
   - Writes files, runs commands, and validates output inside E2B sandboxes

3. **Framework Support**
   - **Next.js 15**: Full-stack React with SSR, Shadcn UI, Tailwind CSS
   - **Angular 19**: Enterprise apps with Angular Material, Tailwind CSS
   - **React 18**: SPA with Vite, Chakra UI, Tailwind CSS
   - **Vue 3**: Progressive apps with Vuetify, Tailwind CSS
   - **SvelteKit**: High-performance apps with DaisyUI, Tailwind CSS

4. **Real-time Development Environment**
   - E2B Code Interpreter sandboxes
   - Live preview and code editing
   - File explorer with syntax highlighting
   - Split-pane interface for code and preview

## AI Agent Workflow

### Single Agent Mode (Default)
```
User Request → Framework Selection → Code Generation → Preview
```

## Configuration

### Environment Variables

```bash
# AI Gateway (Claude AI)
AI_GATEWAY_API_KEY="your-api-key"
AI_GATEWAY_BASE_URL="https://ai-gateway.vercel.sh/v1/"

# E2B Sandboxes
E2B_API_KEY="your-e2b-key"

# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."

# Background Jobs
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
```

## Framework Detection

The platform automatically detects the appropriate framework based on user input:

1. **Explicit Mentions**: If user specifies a framework, use it
2. **Default Selection**: Next.js for ambiguous requests
3. **Complexity Analysis**: Angular for enterprise apps
4. **UI Preferences**: Material Design → Angular/Vue
5. **Performance Needs**: Svelte for high-performance requirements

## Code Generation Process

### 1. Project Creation
- User describes desired application
- System creates project with unique ID
- Framework is automatically selected or detected

### 2. AI Processing
- Messages sent to Claude AI via Inngest background jobs
- Framework-specific prompts guide code generation
- Real-time progress updates to user interface

### 3. Sandbox Execution
- E2B sandbox created with framework-specific template
- Code generated and executed in isolated environment
- Live preview available at assigned port

### 4. Iteration & Refinement
- Users can request modifications
- AI agents can iterate based on feedback
- Automated lint and build checks provide quality assurance

## API Integration

### Message Processing
```typescript
// Single agent
await inngest.send({
  name: "code-agent/run",
  data: { projectId, value: userMessage }
});
``


Always use bun for install stuff
Use bun for package management 
Always put your .md files in the @/explanations`
