# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `bun run dev` - Start Vite development server with hot reloading on port 8080
- `bun run dev:api` - Start Vercel development server for API endpoints on port 3000
- `bun run dev:full` - Start both frontend (port 8080) and API (port 3000) servers
- `bun run dev:complete` - Start all services: Convex, API, and frontend
- `bun run build` - Build for production 
- `bun run build:dev` - Build in development mode
- `bun run lint` - Run ESLint to check code quality
- `bun run preview` - Preview production build locally

### Development Setup

For full functionality including Polar.sh subscriptions and all API endpoints:
1. Install dependencies: `bun install`
2. Set up environment variables (see Polar.sh configuration below)
3. Use `bun run dev:complete` to start all services (Convex, API, and frontend)
4. Access the app at `http://localhost:8080`

Note: The frontend uses Vite with proxy configuration to forward:
- `/api/*` requests to the Vercel dev server on port 3000
- `/hono/*` requests to serverless Hono.js functions via the API server

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
- `userSubscriptions` - Subscription cache
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
- Vite runs on port 8080 (frontend)
- Vercel API server runs on port 3000 (existing API routes)
- Hono.js server runs on port 3001 (new Hono.js + Polar.sh routes)
- TypeScript configured with strict settings (no `any` types, strict null checks enabled)
- ESLint with React hooks and TypeScript support
- Tailwind with dark mode and custom color system
- Primary brand color: `#3E6FF3`
- Custom fonts: Geist and Inter

### UI Component Libraries
**IMPORTANT**: Do NOT use deprecated Radix UI components. Use these modern alternatives:

#### Primary UI Libraries:
- **DaisyUI**: Pre-styled Tailwind components for basic UI elements
- **Headless UI**: Unstyled behavioral components for complex interactions
- **Documentation**: See `/docs/UI_LIBRARY_GUIDE.md` and `/docs/RADIX_MIGRATION_PLAN.md`

#### Component Guidelines:
- Use DaisyUI for: buttons, inputs, modals, alerts, forms, navigation
- Use Headless UI for: complex dropdowns, comboboxes, tabs with state
- Never import from `@radix-ui/*` packages (deprecated)
- All UI components must be accessible and React 19 compatible

#### Installation:
```bash
bun add @headlessui/react
bun add -D daisyui@latest
```

#### Example Usage:
```tsx
// DaisyUI Button
<button className="btn btn-primary">Click me</button>

// DaisyUI Modal
<div className="modal modal-open">
  <div className="modal-box">
    <h3 className="font-bold text-lg">Title</h3>
    <p>Content</p>
  </div>
</div>

// Headless UI Dropdown
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
<Menu>
  <MenuButton className="btn">Options</MenuButton>
  <MenuItems className="menu bg-base-100 shadow">
    <MenuItem><a href="#">Item 1</a></MenuItem>
  </MenuItems>
</Menu>
```

### Development Environment
- Uses lovable-tagger in development mode
- Images stored in `public/lovable-uploads/`
- Path alias `@/` points to `src/`
- Package manager: Bun preferred, fallback to pnpm/npm

### Payment Integration: Polar.sh
**IMPORTANT**: ZapDev now uses Polar.sh for payment processing instead of Stripe.

#### Required Environment Variables:
```bash
# Polar.sh Configuration
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_WEBHOOK_SECRET=your_webhook_secret
POLAR_ORGANIZATION_ID=your_org_id

# Product ID mappings for different plans and periods
POLAR_PRODUCT_STARTER_MONTH_ID=starter_monthly_product_id
POLAR_PRODUCT_STARTER_YEAR_ID=starter_yearly_product_id
POLAR_PRODUCT_PRO_MONTH_ID=pro_monthly_product_id
POLAR_PRODUCT_PRO_YEAR_ID=pro_yearly_product_id
POLAR_PRODUCT_ENTERPRISE_MONTH_ID=enterprise_monthly_product_id
POLAR_PRODUCT_ENTERPRISE_YEAR_ID=enterprise_yearly_product_id
```

#### Hono.js + Polar.sh Integration:
- **Serverless Hono.js Routes**: `/hono/checkout`, `/hono/portal`, `/hono/webhooks`, `/hono/trpc/*`
- **Traditional API Routes**: Updated to use Polar.sh SDK instead of Stripe
- **Fully Serverless**: All Hono.js functionality runs as Vercel serverless functions
- **Development Mode**: Uses Polar.sh sandbox environment  
- **Production Mode**: Uses Polar.sh production environment
- **Auto-Deploy**: Vercel automatically starts all required services

#### Plan Structure:
- **Free**: 10 AI conversations/month, basic features
- **Starter**: 100 AI conversations/month, advanced features ($9/month)  
- **Pro**: Unlimited conversations, priority support ($29/month)
- **Enterprise**: Custom pricing, dedicated support (contact sales)

### Key Features
- Real-time AI chat with code execution capabilities
- WebContainer-based safe code running environment
- Subscription management with Polar.sh integration
- User authentication and profile management
- Responsive design with modern UX patterns
- Hono.js API layer for enhanced performance

- Always Ultrathink.
- Reason as much as possible.
- Make sure its secure after making change
