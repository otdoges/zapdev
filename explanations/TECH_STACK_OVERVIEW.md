# ZapDev Tech Stack Overview

## Executive Summary

**ZapDev** is a modern, full-stack AI-powered development platform built with cutting-edge technologies. It enables users to create production-ready web applications through conversational AI interactions, with code generation across multiple frameworks executed in isolated sandboxes with real-time previews.

---

## Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        UI["Next.js 15 App Router<br/>React 19 + TypeScript<br/>Tailwind CSS v4"]
        SUI["Shadcn/ui + Radix UI<br/>Component Library"]
        Theme["next-themes<br/>Dark Mode Support"]
    end

    subgraph "State Management"
        TQ["React Query<br/>@tanstack/react-query<br/>Caching & Fetching"]
        RHF["React Hook Form<br/>Form State Management"]
    end

    subgraph "API Layer"
        tRPC["tRPC v11<br/>Type-Safe RPC"]
        CONV["Convex Client<br/>Real-time Subscriptions"]
    end

    subgraph "Backend Layer"
        CONVEX["Convex Backend<br/>Real-time Database<br/>Query/Mutation Engine"]
        BA["Better Auth v1<br/>Email/OAuth<br/>Session Management"]
    end

    subgraph "Data Layer"
        DB["Convex Database<br/>• users<br/>• projects<br/>• messages<br/>• fragments<br/>• usage<br/>• sessions<br/>• accounts"]
    end

    subgraph "AI & Code Generation"
        AGW["Vercel AI Gateway<br/>Claude API Integration<br/>LLM Provider"]
        IG["Inngest v3<br/>Background Jobs<br/>Event Orchestration"]
        E2B["E2B Code Interpreter<br/>Isolated Sandboxes<br/>5 Frameworks"]
    end

    subgraph "Supporting Services"
        AUTH["OAuth Providers<br/>Google, GitHub"]
        POLAR["Polar.sh<br/>Subscription Billing<br/>Webhook Handling"]
        MONITORING["Sentry<br/>Error Tracking"]
        OTEL["OpenTelemetry<br/>Distributed Tracing"]
    end

    subgraph "Utilities & Libraries"
        ZOD["Zod<br/>Schema Validation"]
        UTIL["Utility Libraries<br/>date-fns, nanoid,<br/>clsx, superjson"]
    end

    UI --> SUI
    UI --> Theme
    UI --> TQ
    UI --> RHF
    TQ --> tRPC
    tRPC --> CONVEX
    RHF --> CONVEX
    UI --> CONV
    CONV --> CONVEX
    CONVEX --> DB
    CONVEX --> BA
    BA --> AUTH
    IG --> AGW
    IG --> E2B
    CONVEX --> IG
    CONVEX --> POLAR
    CONVEX --> MONITORING
    CONVEX --> OTEL
    ZOD --> CONVEX
    UTIL --> UI

    style UI fill:#61dafb,stroke:#333,stroke-width:2px
    style CONVEX fill:#7c3aed,stroke:#333,stroke-width:2px
    style AGW fill:#6366f1,stroke:#333,stroke-width:2px
    style E2B fill:#10b981,stroke:#333,stroke-width:2px
    style POLAR fill:#3b82f6,stroke:#333,stroke-width:2px
```

---

## Core Technology Stack

### Frontend (Client-Side)

| Technology | Version | Purpose | Details |
|---|---|---|---|
| **Next.js** | 16 | Full-stack React framework | App Router, Turbopack (dev), SSR capable |
| **React** | 19.2.0 | UI library | Component-based, Hooks, Strict Mode |
| **TypeScript** | 5.9.3 | Type safety | Strict configuration, End-to-end typing |
| **Tailwind CSS** | 4.1.16 | Styling | Utility-first, PostCSS plugins, v4 optimizations |
| **Shadcn/ui** | Latest | Component library | Accessible, Customizable, Radix-based |
| **Radix UI** | Latest | Headless UI primitives | Accessibility, Dialog, Dropdown, Select, etc. |

### State Management & Forms

| Technology | Version | Purpose | Details |
|---|---|---|---|
| **React Query** | 5.90.6 | Server state management | Automatic caching, refetching, optimistic updates |
| **React Hook Form** | 7.66.0 | Form state | Lightweight, minimal re-renders, Zod integration |
| **next-themes** | 0.4.6 | Theme management | Dark/light mode, System preference detection |

### Backend & Database

| Technology | Version | Purpose | Details |
|---|---|---|---|
| **Convex** | 1.29.0 | Real-time database | Replaces PostgreSQL, TypeScript-first, Subscriptions |
| **tRPC** | 11.7.1 | Type-safe APIs | Automatic type inference, Server/Client separation |
| **Better Auth** | 1.3.34 | Authentication | Email/password, OAuth, Session management |

### AI & Code Generation

| Technology | Version | Purpose | Details |
|---|---|---|---|
| **Vercel AI Gateway** | Custom | LLM provider | Claude API integration, Token management |
| **Inngest** | 3.44.5 | Background jobs | Event-driven, Workflow orchestration, Retry logic |
| **E2B Code Interpreter** | 1.5.1 | Sandbox execution | Isolated environments, Multi-framework support |
| **Inngest Agent Kit** | 0.8.4 | AI tool integration | Tool calling, Function definitions |

### Billing & Subscriptions

| Technology | Version | Purpose | Details |
|---|---|---|---|
| **Polar.sh SDK** | 0.41.1 | Subscription management | Product management, Webhook handling, Customer portal |

### Monitoring & Observability

| Technology | Version | Purpose | Details |
|---|---|---|---|
| **Sentry** | 10.22.0 | Error tracking | Production error monitoring, Session replay |
| **OpenTelemetry** | Latest | Distributed tracing | Instrumentation, Span tracking, Performance metrics |

### Utilities & Validation

| Technology | Version | Purpose | Details |
|---|---|---|---|
| **Zod** | 3.25.76 | Schema validation | Type-safe runtime validation, Automatic TypeScript inference |
| **date-fns** | 4.1.0 | Date manipulation | Lightweight, Modular, Immutable |
| **nanoid** | 5.1.6 | ID generation | URL-friendly unique IDs |
| **superjson** | 2.2.5 | JSON serialization | BigInt, Date, undefined support |
| **clsx** | 2.1.1 | Conditional classnames | Utility for CSS class management |

---

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ ACCOUNTS : has
    USERS ||--o{ PROJECTS : owns
    USERS ||--o{ USAGE : tracks
    USERS ||--o{ EMAIL_VERIFICATIONS : verifies
    PROJECTS ||--o{ MESSAGES : contains
    MESSAGES ||--o{ FRAGMENTS : generates
    PROJECTS ||--o{ ATTACHMENTS : has
    PROJECTS ||--o{ IMPORTS : tracks

    USERS {
        string id PK
        string email
        string name
        string image
        string polarCustomerId
        string subscriptionId
        string subscriptionStatus
        string plan
        timestamp createdAt
        timestamp updatedAt
    }

    SESSIONS {
        string id PK
        string userId FK
        number expiresAt
        string token
        string ipAddress
        string userAgent
    }

    ACCOUNTS {
        string id PK
        string userId FK
        string provider
        string providerAccountId
        string accessToken
    }

    PROJECTS {
        string id PK
        string userId FK
        string name
        string framework
        string description
        timestamp createdAt
        timestamp updatedAt
    }

    MESSAGES {
        string id PK
        string projectId FK
        string userId FK
        string content
        string role
        string status
        timestamp createdAt
    }

    FRAGMENTS {
        string id PK
        string messageId FK
        string code
        string metadata
        timestamp createdAt
    }

    USAGE {
        string id PK
        string userId FK
        number count
        timestamp window
    }

    EMAIL_VERIFICATIONS {
        string id PK
        string userId FK
        string email
        string token
        number expiresAt
        boolean verified
    }

    ATTACHMENTS {
        string id PK
        string projectId FK
        string type
        string url
        timestamp createdAt
    }

    IMPORTS {
        string id PK
        string projectId FK
        string source
        string status
        timestamp createdAt
    }
```

---

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Frontend as Next.js Frontend
    participant tRPC as tRPC Server
    participant Convex as Convex Backend
    participant Inngest as Inngest Queue
    participant E2B as E2B Sandbox
    participant Claude as Claude API

    User->>Frontend: 1. Create project & send message
    Frontend->>tRPC: 2. Call tRPC mutation
    tRPC->>Convex: 3. Store message in DB
    Convex-->>Frontend: 4. Message saved
    Frontend->>Convex: 5. Subscribe to updates
    
    Inngest->>Convex: 6. Poll for new messages
    Inngest->>Claude: 7. Detect framework + generate code
    Claude-->>Inngest: 8. Receive AI response
    
    Inngest->>E2B: 9. Create sandbox instance
    E2B->>E2B: 10. Execute build/lint commands
    E2B-->>Inngest: 11. Return sandbox URL
    
    Inngest->>Convex: 12. Store fragments (code artifacts)
    Convex-->>Frontend: 13. Real-time update via subscription
    Frontend-->>User: 14. Display preview & code

    User->>Frontend: 15. Edit or request changes
    Frontend->>tRPC: 16. Submit feedback
    tRPC->>Convex: 17. Store new message
    Note over Inngest,E2B: Cycle repeats...
```

---

## Framework Support

```mermaid
graph LR
    FS["Framework Selector<br/>AI Detection"] --> NJ["Next.js 15<br/>Default<br/>Full-stack<br/>Shadcn/ui<br/>Tailwind"]
    FS --> NG["Angular 19<br/>Enterprise<br/>Material Design<br/>Tailwind<br/>Signals"]
    FS --> RCT["React 18<br/>SPA<br/>Vite<br/>Chakra UI<br/>Tailwind"]
    FS --> VUE["Vue 3<br/>Progressive<br/>Vuetify<br/>Tailwind<br/>Composition API"]
    FS --> SVT["SvelteKit<br/>High Performance<br/>DaisyUI<br/>Tailwind<br/>Reactivity"]

    NJ --> E2B1["E2B Template:<br/>nextjs"]
    NG --> E2B2["E2B Template:<br/>angular"]
    RCT --> E2B3["E2B Template:<br/>react"]
    VUE --> E2B4["E2B Template:<br/>vue"]
    SVT --> E2B5["E2B Template:<br/>svelte"]

    style FS fill:#fbbf24
    style NJ fill:#61dafb
    style NG fill:#e34c26
    style RCT fill:#61dafb
    style VUE fill:#42b883
    style SVT fill:#ff3e00
```

---

## Authentication Flow

```mermaid
graph TB
    User["User"] 
    
    subgraph "Better Auth"
        BA["Better Auth<br/>Session Management"]
        EMAIL["Email/Password<br/>Auth Provider"]
        OAUTH["OAuth Provider<br/>Google, GitHub"]
    end

    subgraph "Convex"
        USERS["Users Table"]
        SESSIONS["Sessions Table"]
        ACCOUNTS["Accounts Table"]
    end

    subgraph "Middleware"
        MW["Next.js Middleware<br/>Session Validation"]
    end

    User -->|Login/Register| EMAIL
    User -->|OAuth| OAUTH
    EMAIL --> BA
    OAUTH --> BA
    BA --> SESSIONS
    BA --> USERS
    BA --> ACCOUNTS
    MW -->|Verify Token| SESSIONS
    MW -->|Protect Routes| User

    style BA fill:#8b5cf6
    style CONVEX fill:#7c3aed
    style MW fill:#06b6d4
```

---

## Credit System (Rate Limiting)

```mermaid
graph TB
    subgraph "Free Tier"
        F["5 generations<br/>per 24 hours"]
    end

    subgraph "Pro Tier"
        P["100 generations<br/>per 24 hours<br/>$29/month"]
    end

    subgraph "Usage Tracking"
        USAGE["Convex Usage Table<br/>Rolling 24-hour window<br/>User ID indexed"]
    end

    subgraph "Billing"
        POLAR["Polar.sh Integration<br/>Subscription Management<br/>Webhook Sync"]
    end

    F --> USAGE
    P --> USAGE
    USAGE --> POLAR
    POLAR -->|Subscription Status| USERS["Users Table<br/>plan field"]

    style F fill:#10b981
    style P fill:#3b82f6
    style USAGE fill:#7c3aed
    style POLAR fill:#3b82f6
```

---

## AI Code Generation Pipeline

```mermaid
graph TB
    subgraph "Input Processing"
        MSG["User Message<br/>Framework Preference<br/>Attachments"]
        DETECT["Framework Detector<br/>Analyzes context<br/>Selects framework"]
    end

    subgraph "Code Generation"
        PROMPT["Framework-Specific Prompt<br/>(nextjs.ts, angular.ts, etc.)"]
        CLAUDE["Claude API<br/>via Vercel AI Gateway"]
        TOOLS["Agent Tools<br/>• createOrUpdateFiles<br/>• readFiles<br/>• terminal"]
    end

    subgraph "Sandbox Execution"
        E2B_ENV["E2B Sandbox<br/>Isolated environment<br/>Framework template"]
        BUILD["Build & Lint<br/>Auto-fix on error<br/>Max 2 retries"]
        VALIDATE["Validation<br/>Check output<br/>Generate preview URL"]
    end

    subgraph "Storage & Output"
        FRAG["Fragments Table<br/>Store code artifacts<br/>Link to message"]
        REAL_TIME["Real-time Update<br/>Convex subscription<br/>Frontend update"]
    end

    MSG --> DETECT
    DETECT --> PROMPT
    PROMPT --> CLAUDE
    CLAUDE --> TOOLS
    TOOLS --> E2B_ENV
    E2B_ENV --> BUILD
    BUILD --> VALIDATE
    VALIDATE --> FRAG
    FRAG --> REAL_TIME

    style DETECT fill:#fbbf24
    style CLAUDE fill:#6366f1
    style E2B_ENV fill:#10b981
    style FRAG fill:#7c3aed
```

---

## Development Environment Setup

```mermaid
graph TB
    subgraph "Package Manager"
        BUN["Bun v1<br/>Fast bundler<br/>Package manager"]
    end

    subgraph "Local Development"
        DEV["bun run dev<br/>Next.js with Turbopack<br/>Port: 3000"]
        CONVEX["bun run convex:dev<br/>Convex backend<br/>Local dashboard"]
    end

    subgraph "Quality Assurance"
        LINT["bun run lint<br/>ESLint flat config<br/>TypeScript rules"]
        TEST["bun run test<br/>Jest framework<br/>Coverage reporting"]
        BUILD["bun run build<br/>Production build<br/>Output to .next/"]
    end

    subgraph "Deployment"
        DEPLOY["Vercel<br/>Auto-deploy on push<br/>Production optimizations"]
        CONVEX_PROD["bun run convex:deploy<br/>Deploy Convex backend"]
    end

    BUN --> DEV
    BUN --> CONVEX
    BUN --> LINT
    BUN --> TEST
    BUN --> BUILD
    BUILD --> DEPLOY
    BUILD --> CONVEX_PROD

    style BUN fill:#f7d118
    style DEV fill:#61dafb
    style LINT fill:#3b82f6
    style BUILD fill:#8b5cf6
    style DEPLOY fill:#0ea5e9
```

---

## API Structure

### tRPC Routers

```mermaid
graph TB
    tRPC["tRPC Root<br/>Type-safe RPC"]
    
    tRPC --> PROJECTS["Projects Router<br/>• create<br/>• list<br/>• update<br/>• delete"]
    
    tRPC --> MESSAGES["Messages Router<br/>• create<br/>• list<br/>• stream"]
    
    tRPC --> USAGE["Usage Router<br/>• check credits<br/>• get stats"]
    
    tRPC --> AUTH["Auth Router<br/>• getSession<br/>• signOut"]
    
    tRPC --> BILLING["Billing Router<br/>• getSubscription<br/>• createCheckout"]

    PROJECTS --> CONVEX["Convex Mutations<br/>Type-safe"]
    MESSAGES --> CONVEX
    USAGE --> CONVEX
    AUTH --> BA["Better Auth<br/>Session Mgmt"]
    BILLING --> POLAR["Polar.sh SDK<br/>Subscription API"]

    style tRPC fill:#ef4444
    style CONVEX fill:#7c3aed
    style BA fill:#8b5cf6
    style POLAR fill:#3b82f6
```

---

## Security & Compliance

```mermaid
graph TB
    subgraph "Authentication"
        BA["Better Auth<br/>Industry-standard<br/>OAuth/Email support"]
        SESSION["Session Management<br/>httpOnly cookies<br/>Secure tokens"]
    end

    subgraph "Data Protection"
        ENCRYPT["Encryption<br/>OAuth tokens encrypted<br/>in Convex"]
        VAL["Input Validation<br/>Zod schema validation<br/>Server-side checks"]
    end

    subgraph "Infrastructure"
        SANDBOX["E2B Sandboxes<br/>Isolated execution<br/>No code escapes"]
        RATE["Rate Limiting<br/>Upstash Redis<br/>Per-user tracking"]
    end

    subgraph "Monitoring"
        SENTRY["Sentry<br/>Error tracking<br/>Performance monitoring"]
        OTEL["OpenTelemetry<br/>Distributed tracing<br/>Audit logs"]
    end

    BA --> SESSION
    SESSION --> VAL
    VAL --> ENCRYPT
    SANDBOX --> RATE
    RATE --> SENTRY
    SENTRY --> OTEL

    style BA fill:#8b5cf6
    style SANDBOX fill:#10b981
    style SENTRY fill:#dc2626
```

---

## Performance Optimizations

| Category | Technology | Benefit |
|----------|-----------|---------|
| **Bundle** | Turbopack (dev), Code splitting | Faster builds, Smaller chunks |
| **Images** | Next.js Image, AVIF/WebP | Optimized delivery, Modern formats |
| **CSS** | Tailwind v4, Critters | Minimal CSS, Critical path inlined |
| **Data Fetching** | React Query | Automatic caching, Stale-while-revalidate |
| **Database** | Convex subscriptions | Real-time updates, Efficient queries |
| **Form State** | React Hook Form | Minimal re-renders, Lazy validation |
| **Monitoring** | Web Vitals, Speed Insights | Performance metrics tracking |

---

## Development Workflow

```mermaid
graph LR
    A["Edit Code"] --> B["ESLint Check<br/>bun run lint"]
    B --> C{Lint<br/>Pass?}
    C -->|No| A
    C -->|Yes| D["Type Check<br/>TypeScript"]
    D --> E{Type<br/>Pass?}
    E -->|No| A
    E -->|Yes| F["Run Tests<br/>Jest"]
    F --> G{Tests<br/>Pass?}
    G -->|No| A
    G -->|Yes| H["Build<br/>bun run build"]
    H --> I{Build<br/>Pass?}
    I -->|No| A
    I -->|Yes| J["Deploy to Vercel"]
    J --> K["Production Live"]

    style A fill:#61dafb
    style B fill:#3b82f6
    style F fill:#10b981
    style H fill:#8b5cf6
    style J fill:#0ea5e9
    style K fill:#06b6d4
```

---

## Integration Ecosystem

```mermaid
graph TB
    ZapDev["ZapDev<br/>Core Platform"]
    
    subgraph "External Services"
        VERCEL["Vercel<br/>Hosting<br/>AI Gateway<br/>KV Storage"]
        E2B_SVC["E2B<br/>Code Sandboxes<br/>Template mgmt"]
        CLAUDE["Claude API<br/>via Vercel<br/>LLM Provider"]
        INNGEST_SVC["Inngest<br/>Event Queue<br/>Workflow Engine"]
        POLAR["Polar.sh<br/>Billing<br/>Webhooks"]
    end

    subgraph "Optional Integrations"
        FIGMA["Figma<br/>Design import<br/>OAuth"]
        GITHUB["GitHub<br/>Code reference<br/>OAuth"]
        SENTRY_SVC["Sentry<br/>Error tracking"]
    end

    ZapDev --> VERCEL
    ZapDev --> E2B_SVC
    ZapDev --> CLAUDE
    ZapDev --> INNGEST_SVC
    ZapDev --> POLAR
    ZapDev -.-> FIGMA
    ZapDev -.-> GITHUB
    ZapDev -.-> SENTRY_SVC

    style ZapDev fill:#7c3aed,color:#fff
    style VERCEL fill:#000
    style CLAUDE fill:#6366f1
    style POLAR fill:#3b82f6
    style INNGEST_SVC fill:#8b5cf6
    style E2B_SVC fill:#10b981
```

---

## Environment Variables Summary

### Required Variables

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Convex Database
NEXT_PUBLIC_CONVEX_URL=<convex-url>
CONVEX_DEPLOYMENT=<deployment-name>

# AI Gateway
AI_GATEWAY_API_KEY=<vercel-ai-gateway-key>
AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v1/

# Code Execution
E2B_API_KEY=<e2b-api-key>

# Authentication (Better Auth)
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
BETTER_AUTH_URL=http://localhost:3000

# Billing (Polar.sh)
POLAR_ACCESS_TOKEN=<polar-api-token>
POLAR_ORGANIZATION_ID=<org-id>
NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO=<product-id>
POLAR_WEBHOOK_SECRET=<webhook-secret>

# Background Jobs (Inngest)
INNGEST_EVENT_KEY=<inngest-event-key>
INNGEST_SIGNING_KEY=<inngest-signing-key>
```

### Optional Variables

```bash
# OAuth Providers
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-secret>
GITHUB_CLIENT_ID=<github-oauth-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-secret>

# Design Integrations
FIGMA_CLIENT_ID=<figma-oauth-id>
FIGMA_CLIENT_SECRET=<figma-oauth-secret>

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=<sentry-public-dsn>
SENTRY_DSN=<sentry-private-dsn>

# Rate Limiting
UPSTASH_REDIS_REST_URL=<redis-url>
UPSTASH_REDIS_REST_TOKEN=<redis-token>
```

---

## Technology Matrix Summary

| Layer | Primary | Secondary | Purpose |
|-------|---------|-----------|---------|
| **Frontend** | Next.js 15, React 19 | Tailwind, Shadcn/ui | UI rendering, SSR |
| **State** | React Query | React Hook Form | Server + client state |
| **API** | tRPC | Convex subscriptions | Type-safe communication |
| **Backend** | Convex | Better Auth, Polar.sh | Data + auth + billing |
| **AI** | Claude (via Vercel) | Inngest + E2B | Code generation |
| **Observability** | Sentry | OpenTelemetry | Monitoring + tracing |
| **Package Mgmt** | Bun | npm scripts | Dependency management |
| **Testing** | Jest | ts-jest | Unit + integration tests |

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        LOCAL["Local Machine<br/>bun run dev<br/>bun run convex:dev"]
    end

    subgraph "Version Control"
        GIT["Git Repository<br/>GitHub<br/>Feature branches"]
    end

    subgraph "CI/CD Pipeline"
        LINT["Lint Check<br/>ESLint"]
        TEST["Test Suite<br/>Jest"]
        BUILD["Production Build<br/>Turbopack"]
    end

    subgraph "Production"
        VERCEL["Vercel<br/>Next.js Hosting<br/>Edge Functions"]
        CONVEX_PROD["Convex Production<br/>Managed Database<br/>Backups"]
    end

    LOCAL --> GIT
    GIT --> LINT
    LINT --> TEST
    TEST --> BUILD
    BUILD --> VERCEL
    BUILD --> CONVEX_PROD

    style LOCAL fill:#61dafb
    style GIT fill:#333
    style VERCEL fill:#000
    style CONVEX_PROD fill:#7c3aed
```

---

## Key Metrics & Constraints

| Metric | Value | Notes |
|--------|-------|-------|
| **E2B Sandbox Timeout** | 60 minutes | Max execution time per instance |
| **Free Tier Credits** | 5 generations/24h | Rolling window |
| **Pro Tier Credits** | 100 generations/24h | $29/month via Polar.sh |
| **Session Expiry** | Configurable | Default 30 days (Better Auth) |
| **Real-time Subscriptions** | Unlimited | Convex native feature |
| **File Storage** | Unlimited | Convex + fragments table |
| **Concurrent Sandboxes** | Limited by E2B plan | Typically 10-50 concurrent |

---

## Versions & Compatibility

```mermaid
graph TB
    NODE["Node.js 18+<br/>LTS recommended"]
    BUN["Bun 1.x<br/>Latest stable"]
    NEXT["Next.js 16<br/>Latest stable"]
    REACT["React 19<br/>Latest version"]
    TS["TypeScript 5.9+<br/>Strict mode"]
    
    BUN --> NEXT
    NODE --> NEXT
    NEXT --> REACT
    NEXT --> TS
    
    style NODE fill:#68a063
    style BUN fill:#f7d118
    style NEXT fill:#000
    style REACT fill:#61dafb
    style TS fill:#3178c6
```

---

## Getting Started Quick Reference

```bash
# 1. Install dependencies
bun install

# 2. Setup environment variables
cp env.example .env.local
# Edit .env.local with your API keys

# 3. Terminal 1: Frontend development
bun run dev

# 4. Terminal 2: Backend development
bun run convex:dev

# 5. Open browser
# Navigate to http://localhost:3000

# 6. Quality checks (before commit)
bun run lint      # ESLint
bun run test      # Jest
bun run build     # Production build

# 7. Deploy (Vercel + Convex)
bun run convex:deploy  # Deploy Convex backend
git push                # Trigger Vercel auto-deploy
```

---

## Documentation References

- **Full Setup Guide**: `BETTER_AUTH_POLAR_SETUP.md`
- **Convex Database**: `README_CONVEX.md`
- **AI Optimization**: `vercel_ai_gateway_optimization.md`
- **Architecture Guide**: `CLAUDE.md` and `AGENTS.md`
- **Migration Status**: `MIGRATION_STATUS.md`

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev)
- [tRPC Documentation](https://trpc.io)
- [Better Auth Docs](https://www.better-auth.com)
- [Inngest Docs](https://www.inngest.com/docs)
- [E2B Docs](https://e2b.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zod Documentation](https://zod.dev)

---

**Last Updated**: November 2025
**Maintained By**: ZapDev Development Team
