## ZapDev

Build full‑stack web apps with AI superpowers. Real‑time chat, safe code execution, subscriptions, and a buttery‑smooth DX.

### Repository

[GitHub – otdoges/zapdev](https://github.com/otdoges/zapdev.git)

### Built with

- **Core**: React 19, TypeScript, Vite (React SWC)
- **UI/UX**: shadcn/ui (Radix primitives), Tailwind CSS v4, tailwindcss-animate, Lucide, Framer Motion
- **Data & Routing**: TanStack Query, React Router v7
- **APIs**: tRPC 11, Vercel Serverless Functions (`api/*.ts`)
- **Backend (realtime)**: Convex (functions, schema, auth helpers)
- **Auth**: Clerk + Convex integration
- **AI & Execution**: AI SDK, Groq SDK, OpenRouter provider, WebContainer API, E2B Code Interpreter
- **Billing**: Stripe (Checkout, Billing Portal, webhooks)
- **Analytics & Monitoring**: PostHog, Sentry
- **Build & Tooling**: vite-plugin-pwa, pwa-asset-generator, ESLint 9 + TypeScript ESLint, PostCSS + Autoprefixer, Rollup
- **Deploy**: Vercel (static build + serverless routes)
- **Package manager**: Bun (primary)

### Why you'll enjoy it

- ⚡ Instant dev server and fast HMR
- 🤖 Plug‑and‑play AI providers with safe execution sandboxes
- 🔐 Production‑ready auth, billing, and analytics
- 🎨 Beautiful, accessible UI primitives

### Quickstart

Use Bun (primary). If Bun is unavailable, you can fall back to pnpm.

```bash
# 1) Install
bun install

# 2) Set up environment
bun run setup-env    # or: bun run create-env

# 3) Start app (UI only)
bun run dev

# 3b) Start UI + API dev servers together
bun run dev:full

# Open http://localhost:8080
```

Environment keys live in `env-template.txt` (copy to your local `.env`/`.env.local`).

### Notable directories

- `src/` — app code (pages, components, lib)
- `api/` — Vercel serverless routes (Stripe, health, auth helpers)
- `convex/` — Convex functions, schema, and auth config
- `public/` — static assets and PWA icons
- `scripts/` — setup and validation utilities

### License

This project is licensed under the terms of the license in `LICENSE`.
