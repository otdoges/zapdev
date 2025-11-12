# Better Auth + Convex Integration Guide

This guide explains how Better Auth and Convex are linked together in ZapDev, and what each component does.

## Overview

Better Auth is a modern authentication framework that needs a database to store users, sessions, and OAuth accounts. Instead of using a traditional SQL database, we use **Convex** (a real-time database) as the backend.

The connection is made through a **Custom Database Adapter** that implements Better Auth's `DatabaseAdapter` interface, routing all auth operations to Convex mutations and queries.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                  │
│  - authClient.useSession()                                   │
│  - authClient.signIn() / signUp() / signOut()               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           API Routes (/api/auth/[...all]/route.ts)           │
│  - POST: Handle sign-up, sign-in, OAuth callbacks           │
│  - GET: OAuth provider redirects                             │
│  - Rate limiting enabled                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Better Auth (src/lib/auth.ts)                        │
│  - Email/password authentication                             │
│  - OAuth providers (Google, GitHub)                          │
│  - Session management (7 days default)                       │
│  - Database: createConvexAdapter()                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│   Convex Adapter (src/lib/auth-adapter-convex.ts)            │
│  - Implements DatabaseAdapter interface                      │
│  - Maps Better Auth calls to Convex operations              │
│  - OAuth token refresh logic                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Users Module │  │ Sessions     │  │ Accounts     │
│ (users.ts)   │  │ Module       │  │ Module       │
│              │  │ (sessions.ts)│  │ (accounts.ts)│
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                │
       └─────────────────┼─────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │    Convex Database Tables      │
        │  - users                       │
        │  - sessions                    │
        │  - accounts (OAuth)            │
        │  - emailVerifications          │
        └────────────────────────────────┘
```

## Database Tables

### 1. Users Table (`users`)

Stores user account information and subscription data.

```typescript
{
  email: string;              // Unique email
  emailVerified: boolean;     // Email verification status
  name?: string;              // User's full name
  image?: string;             // Avatar URL
  
  // Polar.sh subscription fields
  polarCustomerId?: string;   // Linked to Polar account
  subscriptionId?: string;    // Active subscription ID
  subscriptionStatus?: string; // "active", "canceled", "past_due", etc.
  plan?: "free" | "pro";      // Current plan tier
  
  createdAt: number;          // Timestamp
  updatedAt: number;          // Timestamp
}

// Indexes
.index("by_email", ["email"])
.index("by_polarCustomerId", ["polarCustomerId"])
```

**When records are created**:
- User signs up with email/password
- User signs in with OAuth (Google/GitHub)
- Better Auth automatically creates/updates via adapter

### 2. Sessions Table (`sessions`)

Manages user login sessions with expiration and renewal.

```typescript
{
  userId: Id<"users">;        // Reference to user
  expiresAt: number;          // Session expiration timestamp
  token: string;              // Session token (httpOnly cookie)
  ipAddress?: string;         // Client IP for security
  userAgent?: string;         // Browser info
}

// Indexes
.index("by_userId", ["userId"])
.index("by_token", ["token"])
```

**Session lifecycle**:
1. User logs in → `sessions.create()` called
2. Session stored with 7-day expiration
3. Each request updates `updatedAt` 
4. If `updatedAt + updateAge < now`, session is refreshed automatically
5. Expired sessions returned as `null` by `getByToken()`
6. User logs out → `sessions.deleteByToken()` called

### 3. Accounts Table (`accounts`)

Stores OAuth provider connections (Google, GitHub, etc.).

```typescript
{
  userId: Id<"users">;                    // User this account belongs to
  provider: string;                       // "google" or "github"
  providerAccountId: string;              // Provider's user ID
  accessToken?: string;                   // OAuth access token
  refreshToken?: string;                  // OAuth refresh token
  expiresAt?: number;                     // Token expiration
  tokenType?: string;                     // "Bearer", etc.
  scope?: string;                         // Permission scope
  idToken?: string;                       // OpenID Connect ID token
}

// Indexes
.index("by_provider_accountId", ["provider", "providerAccountId"])
.index("by_userId", ["userId"])
```

**OAuth flow**:
1. User clicks "Sign in with Google"
2. Redirected to Google consent screen
3. Google redirects back with authorization code
4. Better Auth exchanges code for tokens
5. Adapter stores in `accounts` table
6. On next request, tokens are checked for expiration
7. If expired, automatically refreshed using `refreshToken`

### 4. Email Verifications Table (`emailVerifications`)

Optional: Stores email verification tokens.

```typescript
{
  userId: Id<"users">;
  email: string;
  token: string;              // Unique verification token
  expiresAt: number;          // Token expiration
  verified: boolean;          // Verification status
  createdAt: number;
}

// Indexes
.index("by_token", ["token"])
.index("by_userId", ["userId"])
.index("by_email", ["email"])
```

Currently **email verification is disabled** in `src/lib/auth.ts`:
```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: false, // ← Set to true to enable
}
```

## Convex Modules

### users.ts - User Account Management

**Key functions**:

| Function | Purpose | When Used |
|----------|---------|-----------|
| `createOrUpdate(email, name, image, emailVerified)` | Create new user or update existing | Sign-up, OAuth login |
| `getByEmail(email)` | Find user by email | Login lookup |
| `getById(userId)` | Get user by ID | Profile fetch |
| `update(userId, updates)` | Update user profile | Change name/avatar |
| `deleteUser(userId)` | Delete user and cascade | Account deletion |
| `linkPolarCustomer(userId, polarCustomerId)` | Link Polar subscription | Subscription created |
| `unlinkPolarCustomer(userId, expectedPolarCustomerId)` | Unlink Polar | Subscription canceled |
| `updateSubscription(polarCustomerId, subscriptionId, status, plan)` | Update subscription | Polar webhook |

### sessions.ts - Session Lifecycle

**Key functions**:

| Function | Purpose | When Used |
|----------|---------|-----------|
| `create(userId, expiresAt, token, ipAddress, userAgent)` | Create session | Successful login |
| `getByToken(token)` | Get session by token | Auth middleware |
| `getByUserId(userId)` | Get all active sessions | Admin, device list |
| `updateByToken(token, expiresAt)` | Refresh session | Session renewal |
| `deleteByToken(token)` | Delete session | Logout |
| `deleteByUserId(userId)` | Delete all sessions | Account deletion |
| `cleanupExpired()` | Remove expired sessions | Scheduled job |

### accounts.ts - OAuth Integration

**Key functions**:

| Function | Purpose | When Used |
|----------|---------|-----------|
| `create(userId, provider, providerAccountId, tokens)` | Store OAuth account | OAuth sign-up/login |
| `getByProvider(provider, providerAccountId)` | Retrieve OAuth account | Token refresh check |
| `getByUserId(userId)` | Get all OAuth accounts | Connected apps list |
| `update(provider, providerAccountId, tokens)` | Update tokens | Token refresh |
| `deleteOAuth(provider, providerAccountId)` | Disconnect provider | Revoke OAuth |
| `deleteByUserId(userId)` | Delete all accounts | Account deletion |

## Better Auth Configuration

### src/lib/auth.ts

Main Better Auth instance:

```typescript
export const auth = betterAuth({
  // Base URL for auth endpoints
  baseURL: "http://localhost:3000", // dev
  // or "https://zapdev-mu.vercel.app" // prod
  
  // Use Convex as database
  database: createConvexAdapter(),
  
  // Email & password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,  // Change to true to enable
  },
  
  // Social providers (configured from env vars)
  socialProviders: {
    google: { clientId, clientSecret },
    github: { clientId, clientSecret }
  },
  
  // Session configuration
  session: {
    expiresIn: 7 * 24 * 60 * 60,  // 7 days
    updateAge: 24 * 60 * 60,      // Refresh after 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60              // Cache for 1 hour
    }
  },
  
  // Advanced options
  advanced: {
    cookiePrefix: "zapdev.",
    disableCSRFProtection: false,
  },
  
  plugins: [nextCookies()]  // Next.js cookie plugin
});
```

**Key settings explained**:

| Setting | Default | Purpose |
|---------|---------|---------|
| `expiresIn` | 7 days | Session validity period |
| `updateAge` | 1 day | Refresh threshold (if last update > 1 day, refresh) |
| `cookieCache.enabled` | true | Cache session in memory for faster lookups |
| `cookieCache.maxAge` | 1 hour | Invalidate cache after 1 hour |
| `cookiePrefix` | "zapdev." | Cookie name prefix (e.g., "zapdev.session_token") |
| `requireEmailVerification` | false | Require email verification before login |

## Database Adapter

### src/lib/auth-adapter-convex.ts

This file is the **bridge** between Better Auth and Convex. It implements the `DatabaseAdapter` interface with these methods:

#### User Operations
```typescript
async createUser(user): Promise<User>
async getUser(id): Promise<User | null>
async getUserByEmail(email): Promise<User | null>
async updateUser(id, updates): Promise<User | null>
async deleteUser(id): Promise<boolean>
```

Maps to Convex mutations:
- `api.users.createOrUpdate`
- `api.users.getById`
- `api.users.getByEmail`
- `api.users.update`
- `api.users.deleteUser`

#### Session Operations
```typescript
async createSession(session): Promise<Session>
async getSession(token): Promise<Session | null>
async updateSession(token, updates): Promise<Session | null>
async deleteSession(token): Promise<boolean>
```

Maps to Convex mutations:
- `api.sessions.create`
- `api.sessions.getByToken`
- `api.sessions.updateByToken`
- `api.sessions.deleteByToken`

#### OAuth Operations
```typescript
async createAccount(account): Promise<Account>
async getAccount(provider, providerAccountId): Promise<Account | null>
async updateAccount(provider, providerAccountId, updates): Promise<Account | null>
async deleteAccount(provider, providerAccountId): Promise<boolean>
```

Maps to Convex mutations:
- `api.accounts.create`
- `api.accounts.getByProvider`
- `api.accounts.update`
- `api.accounts.deleteOAuth`

**Special feature**: The `getAccount()` method automatically detects expired OAuth tokens and refreshes them using the `refreshToken`:

```typescript
// In getAccount():
if (isOAuthTokenExpired(expiresAt) && refreshToken) {
  const refreshResult = await refreshOAuthTokenForProvider(
    provider,
    refreshToken,
    clientId,
    clientSecret
  );
  // Update database with new token
  await this.updateAccount(provider, providerAccountId, {
    accessToken: refreshResult.accessToken,
    expiresAt: Date.now() + refreshResult.expiresIn * 1000
  });
}
```

## API Routes

### src/app/api/auth/[...all]/route.ts

Handles all authentication HTTP requests:

```typescript
export async function POST(request: Request) {
  // Rate limiting check
  const rateLimitResult = await checkRateLimit(request);
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }
  
  // Route to Better Auth handler
  const handlers = toNextJsHandler(auth);
  return handlers.POST(request);
}

export async function GET(request: Request) {
  // OAuth callbacks don't need rate limiting
  const handlers = toNextJsHandler(auth);
  return handlers.GET(request);
}
```

**Endpoints created automatically by Better Auth**:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/sign-up` | POST | Register with email/password |
| `/api/auth/sign-in` | POST | Login with email/password |
| `/api/auth/sign-out` | POST | Logout (invalidate session) |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/signin/google` | GET | Start Google OAuth |
| `/api/auth/callback/google` | GET | Handle Google redirect |
| `/api/auth/signin/github` | GET | Start GitHub OAuth |
| `/api/auth/callback/github` | GET | Handle GitHub redirect |

**Rate limiting** is applied to sign-up/login endpoints to prevent brute force attacks.

## Client Integration

### src/lib/auth-client.ts

Frontend auth client:

```typescript
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000"
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
```

**Usage in React components**:

```typescript
import { useSession, signIn, signOut } from "@/lib/auth-client";

function Profile() {
  const { data: session } = useSession();
  
  if (!session) {
    return <div>Not logged in</div>;
  }
  
  return (
    <div>
      <p>Welcome, {session.user.name}!</p>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}
```

## Data Flow Examples

### 1. Email/Password Sign-Up

```
User clicks "Sign Up"
  ↓
Form submits email & password
  ↓
POST /api/auth/sign-up
  ↓
Better Auth validates
  ↓
Convex Adapter: createUser()
  ↓
Convex Mutation: users.createOrUpdate()
  ↓
Insert into users table
  ↓
Convex Adapter: createSession()
  ↓
Convex Mutation: sessions.create()
  ↓
Insert into sessions table
  ↓
Response: { token, user }
  ↓
Client stores in httpOnly cookie
  ↓
React re-renders with useSession()
```

### 2. OAuth Sign-In (Google)

```
User clicks "Sign in with Google"
  ↓
GET /api/auth/signin/google
  ↓
Better Auth: redirect to Google consent screen
  ↓
User authorizes
  ↓
Google redirects to /api/auth/callback/google?code=...
  ↓
Better Auth exchanges code for access token
  ↓
Convex Adapter: getUserByEmail()
  ↓
If user exists:
  ├─ Convex Adapter: getAccount()
  ├─ Check if OAuth token is expired
  ├─ If expired, refresh automatically
  ├─ Convex Adapter: getSession() (existing session)
  └─ Return existing session
  ↓
If user not found:
  ├─ Convex Adapter: createUser()
  ├─ Convex Adapter: createAccount() (store OAuth tokens)
  ├─ Convex Adapter: createSession()
  └─ Return new session
  ↓
Client receives session token in httpOnly cookie
```

### 3. Session Validation on Page Load

```
User loads app
  ↓
Browser sends request with session cookie
  ↓
Frontend calls useSession()
  ↓
Better Auth reads cookie
  ↓
Convex Adapter: getSession(token)
  ↓
Query sessions table
  ↓
If expiresAt < now: return null (expired)
  ↓
If expiresAt > now && (updatedAt + updateAge < now):
  ├─ Convex Adapter: updateSession()
  ├─ Set new expiresAt
  └─ Return updated session
  ↓
Client receives session with user data
```

## Environment Variables

Required for Better Auth + Convex to work:

```bash
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000

# Convex
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
CONVEX_DEPLOYMENT=<deployment-id>

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=<from Google Console>
GOOGLE_CLIENT_SECRET=<from Google Console>
GITHUB_CLIENT_ID=<from GitHub Settings>
GITHUB_CLIENT_SECRET=<from GitHub Settings>

# Polar.sh (billing)
POLAR_ACCESS_TOKEN=<token>
POLAR_ORGANIZATION_ID=<id>
NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO=<product-id>
POLAR_WEBHOOK_SECRET=<secret>
```

See `.env.example` and `explanations/BETTER_AUTH_POLAR_SETUP.md` for complete setup.

## Advanced: Email Verification

To enable email verification:

1. **Update Better Auth config** (`src/lib/auth.ts`):
```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true  // ← Change this
}
```

2. **Setup email provider** (nodemailer, SendGrid, Resend, etc.):
```typescript
import { sendEmailVerificationEmail } from "@/lib/email";

// In auth config
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  sendVerificationEmail: async (email, token) => {
    await sendEmailVerificationEmail(email, token);
  }
}
```

3. **Verify email endpoint**:
```typescript
// POST /api/auth/verify-email?token=...
// Better Auth handles this automatically
```

The `convex/emailVerifications.ts` module provides:
- `createVerification()` - Generate token
- `getByToken()` - Retrieve verification
- `markVerified()` - Mark email as verified
- `deleteExpired()` - Cleanup old tokens

## Troubleshooting

### Session not persisting across page reload
**Cause**: Session token not in httpOnly cookie
**Fix**: Check `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` match exactly

### OAuth token refresh not working
**Cause**: OAuth credentials missing or incorrect
**Fix**: Verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc. in environment

### "User not found" errors
**Cause**: Convex adapter failing to create user
**Fix**: Check network tab → `/api/auth/sign-up` response for error details

### Sessions expiring too quickly
**Cause**: `expiresIn` set to low value
**Fix**: Adjust in `src/lib/auth.ts` → `session.expiresIn`

### Rate limiting blocking legitimate requests
**Cause**: Too many auth attempts from same IP
**Fix**: Whitelist IP or adjust `checkRateLimit()` threshold in rate-limit.ts

## Testing the Integration

### Manual test: Email/Password Sign-Up
```bash
# 1. Start dev server
bun run dev
bun run convex:dev  # in another terminal

# 2. Open http://localhost:3000
# 3. Click "Sign Up"
# 4. Enter email & password
# 5. Check Convex dashboard:
#    - users table should have new entry
#    - sessions table should have new session
# 6. Refresh page - session should persist
```

### Manual test: Google OAuth
```bash
# 1. Configure GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in .env.local
# 2. Start dev server
# 3. Click "Sign in with Google"
# 4. Authorize
# 5. Check Convex dashboard:
#    - users table has new user
#    - accounts table has Google connection
# 6. Sign out and sign in again - should use existing session
```

### Manual test: Session Refresh
```bash
# 1. Sign in
# 2. Keep browser open for > 1 day (or manually set expiresAt to 1 day ago)
# 3. Make a request (refresh page)
# 4. Check Convex: sessions table expiresAt should update to future date
```

## Security Considerations

1. **Session tokens**: Stored in httpOnly cookies (secure by default)
2. **CSRF protection**: Enabled by default in Better Auth
3. **Password hashing**: Better Auth uses bcrypt automatically
4. **OAuth tokens**: Never exposed in client-side code
5. **Rate limiting**: POST endpoints protected against brute force
6. **Email verification**: Optional but recommended for production

## References

- [Better Auth Documentation](https://www.better-auth.com)
- [Convex Documentation](https://docs.convex.dev)
- [Next.js Authentication Best Practices](https://nextjs.org/docs/authentication)
