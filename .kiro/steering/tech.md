# Technology Stack

## Core Technologies
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Strict typing with relaxed configuration (noImplicitAny: false)
- **Vite** - Fast build tool and dev server
- **Bun** - Alternative JavaScript runtime (available as dependency)

## UI Framework & Styling
- **shadcn/ui** - Component library built on Radix UI primitives
- **Tailwind CSS** - Utility-first CSS framework with custom theme
- **Radix UI** - Accessible, unstyled UI primitives
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Aceternity UI** - Additional UI components

## State Management & Data
- **TanStack Query** - Server state management and caching
- **React Hook Form** - Form handling with Zod validation
- **React Router DOM** - Client-side routing
- **Supabase** - Backend-as-a-Service for auth and database

## AI Integration
- **Groq AI SDK** - AI model integration
- **Vercel AI SDK** - AI utilities and streaming

## Development Tools
- **ESLint** - Code linting with TypeScript support
- **PostCSS** - CSS processing with Autoprefixer
- **Lovable Tagger** - Development-mode component tagging

## Common Commands

### Development
```bash
pnpm run dev          # Start development server (port 8080)
pnpm run build        # Production build
pnpm run build:dev    # Development build
pnpm run preview      # Preview production build
pnpm run lint         # Run ESLint
```

### Environment Setup
- Copy `.env.example` to `.env` and configure:
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `VITE_GROQ_API_KEY` - Groq API key for AI functionality

### Path Aliases
- `@/*` maps to `./src/*` for clean imports