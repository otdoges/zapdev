# Better Auth + Convex: Quick Reference

A cheat sheet for working with authentication in ZapDev.

## File Map

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Better Auth instance config |
| `src/lib/auth-client.ts` | Frontend auth hooks |
| `src/lib/auth-adapter-convex.ts` | Bridge between Better Auth & Convex |
| `src/app/api/auth/[...all]/route.ts` | API endpoint handler |
| `convex/schema.ts` | Database tables |
| `convex/users.ts` | User CRUD functions |
| `convex/sessions.ts` | Session management |
| `convex/accounts.ts` | OAuth connections |
| `convex/emailVerifications.ts` | Email verification (optional) |

## Frontend Usage

### Get Current Session
```typescript
import { useSession } from "@/lib/auth-client";

function Component() {
  const { data: session, isPending } = useSession();
  
  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not logged in</div>;
  
  return <div>Welcome {session.user.name}!</div>;
}
```

### Sign In
```typescript
import { signIn } from "@/lib/auth-client";

async function LoginForm() {
  const { data, error } = await signIn.email({
    email: "user@example.com",
    password: "password123",
    onSuccess: () => {
      // Redirect to dashboard
      window.location.href = "/dashboard";
    },
  });
  
  if (error) console.error(error.message);
}
```

### Sign Up
```typescript
import { signUp } from "@/lib/auth-client";

async function RegisterForm() {
  const { data, error } = await signUp.email({
    email: "newuser@example.com",
    password: "securepassword",
    name: "John Doe",
    onSuccess: () => {
      window.location.href = "/dashboard";
    },
  });
  
  if (error) console.error(error.message);
}
```

### Sign Out
```typescript
import { signOut } from "@/lib/auth-client";

async function LogoutButton() {
  const { error } = await signOut();
  if (error) console.error(error);
}
```

### OAuth Sign-In
```typescript
import { signIn } from "@/lib/auth-client";

async function GoogleLoginButton() {
  // Automatically redirects to Google
  await signIn.social({
    provider: "google",
  });
}

async function GitHubLoginButton() {
  // Automatically redirects to GitHub
  await signIn.social({
    provider: "github",
  });
}
```

## Backend Usage

### Get Current User (Server-Side)
```typescript
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  return Response.json({ user: session.user });
}
```

### Get User by Email (Convex)
```typescript
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const user = await fetchQuery(api.users.getByEmail, {
  email: "user@example.com"
});
```

### Check if User Has OAuth Account
```typescript
const { data: session } = useSession();
const accounts = await fetchQuery(api.accounts.getByUserId, {
  userId: session.user.id
});

const hasGoogle = accounts.some(a => a.provider === "google");
```

### Get Session by Token
```typescript
const session = await fetchQuery(api.sessions.getByToken, {
  token: "session_token_here"
});

if (session && session.expiresAt < Date.now()) {
  console.log("Session expired");
}
```

## Convex Patterns

### List All Users (Dangerous - For Admin Only!)
```typescript
import { query } from "./_generated/server";

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  }
});
```

### Check if Email is Taken
```typescript
import { query } from "./_generated/server";

export const isEmailTaken = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", args.email))
      .first();
    
    return !!user;
  }
});
```

### Update User Profile
```typescript
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const userId = session.user.id;
await fetchMutation(api.users.update, {
  userId,
  name: "New Name",
  image: "https://example.com/avatar.jpg"
});
```

### Disconnect OAuth Provider
```typescript
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

await fetchMutation(api.accounts.deleteOAuth, {
  provider: "google",
  providerAccountId: "1234567890"
});
```

### Delete User Account
```typescript
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

await fetchMutation(api.users.deleteUser, {
  userId: session.user.id
});
```

## Common Queries

### Get All Sessions for Current User
```typescript
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const { data: session } = useSession();
const sessions = await fetchQuery(api.sessions.getByUserId, {
  userId: session.user.id
});
```

### Get All Connected OAuth Accounts
```typescript
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const { data: session } = useSession();
const accounts = await fetchQuery(api.accounts.getByUserId, {
  userId: session.user.id
});

// Example: ["google", "github"]
const providers = accounts.map(a => a.provider);
```

### Check Subscription Status
```typescript
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const { data: session } = useSession();
const subscriptionStatus = await fetchQuery(api.users.getSubscriptionStatus, {
  userId: session.user.id
});

console.log(subscriptionStatus.plan); // "free" | "pro"
```

## Configuration

### Session Expiration
In `src/lib/auth.ts`:
```typescript
session: {
  expiresIn: 7 * 24 * 60 * 60,  // 7 days (change this)
  updateAge: 24 * 60 * 60,      // Refresh after 1 day
}
```

### Disable OAuth Provider
In `src/lib/auth.ts`:
```typescript
socialProviders: {
  google: {
    enabled: false  // ← Disable
  }
}
```

### Enable Email Verification
In `src/lib/auth.ts`:
```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true  // ← Change to true
}
```

### Change Cookie Prefix
In `src/lib/auth.ts`:
```typescript
advanced: {
  cookiePrefix: "myapp."  // Cookie names: myapp.session_token, etc.
}
```

## Environment Variables

Create `.env.local`:
```bash
# Required
NEXT_PUBLIC_CONVEX_URL=https://xyz.convex.cloud
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>

# OAuth (Optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Billing
POLAR_ACCESS_TOKEN=...
POLAR_WEBHOOK_SECRET=...
```

## Debugging

### Check Session in Browser Console
```javascript
// Get session token from cookie
document.cookie.split(';').find(c => c.includes('session_token'))
```

### View Convex Data
1. Open [Convex Dashboard](https://dashboard.convex.dev)
2. Select project
3. View `users`, `sessions`, `accounts` tables

### Check API Responses
```typescript
// In browser console while testing
await fetch("/api/auth/session").then(r => r.json()).then(console.log)
```

### View OAuth Token Expiration
```typescript
const { data: session } = useSession();
const accounts = await fetchQuery(api.accounts.getByUserId, {
  userId: session.user.id
});

accounts.forEach(acc => {
  const isExpired = acc.expiresAt < Date.now();
  console.log(`${acc.provider}: ${isExpired ? "EXPIRED" : "VALID"}`);
});
```

## Error Handling

### Graceful Fallback
```typescript
const { data: session, error } = useSession();

if (error) {
  console.error("Failed to fetch session:", error);
  return <div>Unable to load user session</div>;
}

if (!session) {
  return <div>Please log in</div>;
}
```

### Check OAuth Token Validity
```typescript
import { isOAuthTokenExpired } from "@/lib/oauth-token-refresh";

const account = // ... fetch from Convex
if (isOAuthTokenExpired(account.expiresAt)) {
  // Token is expired - attempt refresh or prompt user to re-authenticate
}
```

## Testing Checklist

- [ ] Email/password sign-up works
- [ ] Email/password sign-in works
- [ ] Session persists on page reload
- [ ] Logout clears session
- [ ] Google OAuth sign-in works
- [ ] GitHub OAuth sign-in works
- [ ] OAuth tokens refresh automatically
- [ ] Account deletion removes all related data
- [ ] Rate limiting blocks brute force attempts
- [ ] User profile can be updated
- [ ] OAuth providers can be disconnected

## Performance Tips

1. **Cache session in React Query**: Already done via `useSession()`
2. **Use indexes**: Queries already use `.withIndex()` for common lookups
3. **Batch operations**: Use `Promise.all()` for parallel Convex calls
4. **Avoid N+1 queries**: Load related data in single query
5. **Clean up expired sessions**: Run `sessions.cleanupExpired()` periodically

## Migration from Other Auth Systems

If migrating from Clerk, Auth0, or Supabase:

1. **Export existing users** to CSV/JSON
2. **Hash passwords** with bcrypt (if needed)
3. **Create migration script** in `convex/`
4. **Map user IDs** to Convex IDs (string format: "hashXXX")
5. **Update all references** in database
6. **Test thoroughly** before production

See `explanations/MIGRATION_CONVEX_FROM_POSTGRESQL.md` for example.
