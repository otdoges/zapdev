# ZapDev

An AI-powered development platform with real-time chat, code execution, and subscription management. Built with React 19 + TypeScript + Vite.

## Features

- 🤖 AI-powered code generation and chat with Groq SDK + AI SDK
- 🔐 Clerk authentication with Convex integration
- 💬 Real-time chat interface
- 🖥️ WebContainer API + E2B Code Interpreter for safe code execution
- 💳 Billing with Polar (Convex + Polar)
- 🎨 shadcn/ui components with Tailwind CSS
- 📊 PostHog analytics
- 📱 Responsive design with Framer Motion animations
- ⚡ Fast development workflow

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** build tool
- **shadcn/ui** (Radix UI primitives) + Lucide React icons
- **Tailwind CSS** with custom design system
- **Framer Motion** for animations
- **React Hook Form** with Zod validation

### Backend & Services
- **Convex** - Real-time serverless database
- **Clerk** - Authentication and user management
- **Stripe** - Payment processing and subscriptions
- **Groq SDK** - AI model integration
- **WebContainer API** - Safe code execution environment
- **E2B Code Interpreter** - Advanced code execution
- **PostHog** - Analytics and feature flags

### Development Tools
- **TypeScript** with strict settings
- **ESLint** with React hooks support
- **TanStack Query** for data fetching
- **tRPC** for type-safe APIs

## Quick Start

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up your environment variables (see Configuration below)
4. Start the development server: `pnpm run dev`
5. Open `http://localhost:8080` in your browser

## Development Commands

- `pnpm run dev` - Start development server with hot reloading on port 8080
- `pnpm run build` - Build for production 
- `pnpm run build:dev` - Build in development mode
- `pnpm run lint` - Run ESLint to check code quality
- `pnpm run preview` - Preview production build locally

## Configuration

Create a `.env.local` file in your project root. You can start from `.env.example` and fill in values:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Convex Database
VITE_CONVEX_URL=your_convex_url_here

# AI Services
VITE_GROQ_API_KEY=your_groq_api_key_here

# Stripe Configuration (for subscription management)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_PRO_MONTH=price_xxx
STRIPE_PRICE_PRO_YEAR=
STRIPE_PRICE_ENTERPRISE_MONTH=price_xxx
STRIPE_PRICE_ENTERPRISE_YEAR=
STRIPE_PRICE_PRO_MONTH=
STRIPE_PRICE_PRO_YEAR=
STRIPE_PRICE_ENTERPRISE_MONTH=
STRIPE_PRICE_ENTERPRISE_YEAR=

CLOUDFLARE_API_TOKEN=

# App origin used by server-side fetches
PUBLIC_ORIGIN=http://localhost:5173

# PostHog Analytics
VITE_PUBLIC_POSTHOG_KEY=your_posthog_key_here
VITE_PUBLIC_POSTHOG_HOST=your_posthog_host_here

 
CLOUDFLARE_API_TOKEN=

# App origin used by server-side fetches
PUBLIC_ORIGIN=http://localhost:5173

# E2B Code Interpreter (optional)
VITE_E2B_API_KEY=your_e2b_api_key_here
```

## Project Architecture

### Core Structure
- `src/main.tsx` - App entry point with providers (Clerk, Convex, PostHog)
- `src/App.tsx` - Main routing with tRPC and protected routes
- `src/pages/` - Page components (Index, Chat, Settings, Pricing)
- `src/components/` - Feature components and UI library
- `convex/` - Backend functions, schema, and authentication

### Authentication Flow
1. Clerk handles authentication UI and session management
2. `UserSync` component syncs Clerk user with Convex database
3. `AuthGuard` protects routes requiring authentication
4. User data stored in Convex with proper indexing

### Security Features
- All Convex functions use authentication verification
- User data access controlled by ownership (userId checks)
- XSS protection with input sanitization
- Strict TypeScript configuration (no `any` types)
- Input validation using Zod schemas

## Deployment

When deploying to production:

1. Set environment variables in your deployment platform
2. Update redirect URIs in your Clerk Dashboard
3. Configure Stripe webhooks for your production domain
4. Ensure HTTPS is used for all external service callbacks

### Billing Integration Notes (Polar)

- Endpoints:
   - `POST /api/create-checkout-session`: returns a Polar Checkout URL based on env-configured links per plan/period.
   - `POST /api/create-portal-session`: returns a Polar customer portal URL with return_url.
   - `POST /api/success`: completes hosted flow and redirects to `/`.
   - `GET /api/get-subscription`: returns the user's current subscription (queried from Polar).

- Webhook URL:
  - Production: `https://www.zapdev.link/api/webhook/polar`
  - Local (via tunnel): `https://YOUR-NGROK-SUBDOMAIN.ngrok.io/api/webhook/polar`

- Environment variables required (see `env-template.txt`):
  - `POLAR_ACCESS_TOKEN` (optional if only linking to hosted checkouts), `POLAR_WEBHOOK_SECRET` (optional), `PUBLIC_ORIGIN`.
  - For hosted links: `POLAR_CHECKOUT_PRO_MONTH`, `POLAR_CHECKOUT_PRO_YEAR`, `POLAR_CHECKOUT_ENTERPRISE_MONTH`, `POLAR_CHECKOUT_ENTERPRISE_YEAR`, and `POLAR_PORTAL_URL`.

## Development Notes

- Vite runs on port 8080 (not 5173)
- Primary brand color: `#3E6FF3`
- Uses lovable-tagger in development mode
- Images stored in `public/lovable-uploads/`
- Path alias `@/` points to `src/`
- Package manager: pnpm (Bun as fallback)
