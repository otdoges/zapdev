# System API Key Configuration

## Problem

The application was experiencing `Unauthorized: Invalid system key` errors when Convex functions tried to validate system-level requests:

```
11/22/2025, 9:53:50 PM [CONVEX Q(projects:getForSystem)] Uncaught Error: Unauthorized: Invalid system key
    at handler (../convex/projects.ts:550:20)
```

## Root Cause

The `SYSTEM_API_KEY` environment variable was missing from:
1. Convex environment (required for Convex functions to validate system requests)
2. `.env.local` (required for Next.js API routes)

### Affected Functions

Four Convex functions require `SYSTEM_API_KEY` for authentication:
- `convex/projects.ts:getForSystem` - System-level project queries
- `convex/usage.ts:resetUsageSystem` - Usage reset operations
- `convex/webhooks.ts:recordPolarWebhook` - Polar webhook processing
- `convex/webhooks.ts:recordStripeWebhook` - Stripe webhook processing

## Solution Applied

### 1. Set Environment Variable in Convex

```bash
bun run convex env set SYSTEM_API_KEY your-system-api-key-here
```

Verification:
```bash
bun run convex env list | grep SYSTEM_API_KEY
# Output: SYSTEM_API_KEY=your-system-api-key-here
```

### 2. Updated `.env.local`

Added SYSTEM_API_KEY environment variable for local development:

```env
# System API Key (for backend service authentication)
SYSTEM_API_KEY=your-system-api-key-here
```

## Testing

To verify the fix is working:

1. **Restart Convex dev server** (if running):
   ```bash
   # Stop current process (Ctrl+C), then:
   bun run convex:dev
   ```

2. **Restart Next.js dev server** (if running):
   ```bash
   # Stop current process (Ctrl+C), then:
   bun run dev
   ```

3. **Test system-level operations**:
   - Create a new project in the UI
   - The `getForSystem` function should now work without authentication errors
   - Check Convex logs - no more "Unauthorized: Invalid system key" errors

## How It Works

### Security Flow

1. **Backend services** call Convex system-level queries with the API key:
   ```typescript
   await convex.query(api.projects.getForSystem, {
     projectId: "...",
     systemKey: process.env.SYSTEM_API_KEY!
   });
   ```

2. **Convex functions** validate the key before processing:
   ```typescript
   if (args.systemKey !== process.env.SYSTEM_API_KEY) {
     throw new Error("Unauthorized: Invalid system key");
   }
   ```

3. **Authentication succeeds** - Convex now has access to the API key and can validate system requests

## Important Notes

### Environment Variable Scope

- **Convex environment**: Set via `bun run convex env set` - used by Convex functions
- **Next.js environment**: Set via `.env.local` - used by API routes and backend services
- **Production**: Already configured in `.env.vercel` and Vercel dashboard

### Why Two Environments?

Convex functions run in Convex's cloud infrastructure, not in your Next.js process. They need their own environment variables set through the Convex CLI.

### Security Best Practices

The API key serves as a shared secret between:
- Backend services (callers)
- Convex system-level functions (validators)

This prevents unauthorized access to privileged operations like:
- Resetting user usage limits
- Accessing any user's project data
- Recording webhook events

## Related Files

- `convex/projects.ts` - System-level project queries
- `convex/usage.ts` - Usage management
- `convex/webhooks.ts` - Webhook processing
- `src/agents/ai-sdk/code-agent.ts` - Code generation that calls Convex
- `src/app/api/webhooks/polar/route.ts` - Webhook handler that uses system key
- `src/lib/oauth-state.ts` - OAuth state validation using the API key
- `.env.local` - Local environment configuration
- `.env.vercel` - Production environment reference

## Troubleshooting

If you still see authentication errors:

1. **Check Convex environment**:
   ```bash
   bun run convex env list | grep SYSTEM_API_KEY
   ```

2. **Check local environment**:
   ```bash
   grep SYSTEM_API_KEY .env.local
   ```

3. **Verify both servers are restarted** after environment changes

4. **Check Convex dashboard logs** for detailed error messages

## Additional Context

This fix ensures that system-level operations (backend services calling Convex) are properly authenticated using the SYSTEM_API_KEY environment variable.
