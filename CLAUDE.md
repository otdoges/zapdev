# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm run dev` - Start development server with hot reloading on port 8080
- `pnpm run build` - Build for production 
- `pnpm run build:dev` - Build in development mode
- `pnpm run lint` - Run ESLint to check code quality
- `pnpm run preview` - Preview production build locally

## Project Architecture

ZapDev is an AI-powered development platform with real-time chat, code execution, and subscription management. Built with React 19 + TypeScript + Vite.

### Key Technologies
- **Frontend**: React 19, TypeScript, Vite
- **UI Components**: shadcn/ui (Radix UI primitives) + Lucide React icons
- **Authentication**: Clerk with Convex integration
- **Database**: Convex (real-time, serverless)
- **Payments**: Stripe for subscription management
- **AI Integration**: Groq SDK + AI SDK
- **Code Execution**: WebContainer API + E2B Code Interpreter
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack Query + tRPC
- **Analytics**: PostHog

### Core Application Structure
- `src/main.tsx` - App entry point with Clerk + Convex + PostHog providers
- `src/App.tsx` - Main routing setup with tRPC and protected routes
- `src/pages/` - Page components (Index, Chat, Settings, Pricing, etc.)
- `src/components/` - Feature components and UI library
- `convex/` - Backend functions, schema, and authentication

### Routing Architecture
Protected routes use `AuthGuard` component:
- `/` - Landing page (public)
- `/chat` - Main AI chat interface (protected)
- `/settings` - User settings (protected)
- `/pricing` - Subscription plans (public)
- `/auth/callback` - Authentication callback
- `/terms` - Terms of service (public)
- `/privacy` - Privacy policy (public)

### Authentication Flow
Uses Clerk + Convex pattern with user sync:
1. Clerk handles authentication UI and session management
2. `UserSync` component syncs Clerk user with Convex database
3. `AuthGuard` protects routes requiring authentication
4. User data stored in Convex `users` table with proper indexing

### Database Schema (Convex)
Key tables with security considerations:
- `users` - User profiles with email/username uniqueness
- `chats` - Chat conversations owned by users
- `messages` - Chat messages with role-based content
- `products`, `prices`, `customers`, `subscriptions` - Polar integration
- `usageEvents`, `meters` - Usage tracking for billing
- `userSubscriptions` - Cached subscription status and limits

### Security Implementation
- All Convex functions use authentication verification
- User data access controlled by ownership (userId checks)
- XSS protection with input sanitization
- Strict type safety enforced (no `any` types, strict null checks enabled)
- Proper error handling with typed error boundaries
- Input validation using Zod schemas

### Configuration Notes
- Vite runs on port 8080
- TypeScript configured with strict settings (no `any` types, strict null checks enabled)
- ESLint with React hooks and TypeScript support
- Tailwind with dark mode and custom color system
- Primary brand color: `#3E6FF3`
- Custom fonts: Geist and Inter

### Development Environment
- Uses lovable-tagger in development mode
- Images stored in `public/lovable-uploads/`
- Path alias `@/` points to `src/`
- Package manager: Bun preferred, fallback to pnpm/npm

### Key Features
- Real-time AI chat with code execution capabilities
- WebContainer-based safe code running environment
- Subscription management with Polar integration
- User authentication and profile management
- Responsive design with modern UX patterns