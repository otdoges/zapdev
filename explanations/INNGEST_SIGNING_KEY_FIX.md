# Inngest Signing Key Configuration Fix

## Problem

The application was experiencing `Unauthorized: Invalid system key` errors when Convex functions tried to validate system-level requests:

```
11/22/2025, 9:53:50 PM [CONVEX Q(projects:getForSystem)] Uncaught Error: Unauthorized: Invalid system key
    at handler (../convex/projects.ts:550:20)
```

## Root Cause

The `INNGEST_SIGNING_KEY` environment variable was missing from:
1. Convex environment (required for Convex functions to validate system requests)
2. `.env.local` (required for Next.js API routes that use Inngest)

### Affected Functions

Four Convex functions require `INNGEST_SIGNING_KEY` for authentication:
- `convex/projects.ts:getForSystem` - System-level project queries
- `convex/usage.ts:resetUsageSystem` - Usage reset operations
- `convex/webhooks.ts:recordPolarWebhook` - Polar webhook processing
- `convex/webhooks.ts:recordStripeWebhook` - Stripe webhook processing

## Solution Applied

### 1. Set Environment Variable in Convex

```bash
bun run convex env set INNGEST_SIGNING_KEY signkey-prod-99a63a2b68d58aee9ca1acf64ebec8c817589bc684dcb47f4bb3e49c2dca760c
```

Verification:
```bash
bun run convex env list | grep INNGEST_SIGNING_KEY
# Output: INNGEST_SIGNING_KEY=signkey-prod-99a63a2b68d58aee9ca1acf64ebec8c817589bc684dcb47f4bb3e49c2dca760c
```

### 2. Updated `.env.local`

Added both Inngest environment variables for local development:

```env
# Inngest (for background job processing)
INNGEST_EVENT_KEY=ac9_RAhqmT1_H1DIr65lEaxZbo9QpyrLAVtB0G5xldFOdDt9LiFoSHkduRIJIV_K8hcXnyGh5-17La4mI4MrSw
INNGEST_SIGNING_KEY=signkey-prod-99a63a2b68d58aee9ca1acf64ebec8c817589bc684dcb47f4bb3e49c2dca760c
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

1. **Inngest functions** call Convex system-level queries with the signing key:
   ```typescript
   await convex.query(api.projects.getForSystem, {
     projectId: "...",
     systemKey: process.env.INNGEST_SIGNING_KEY!
   });
   ```

2. **Convex functions** validate the key before processing:
   ```typescript
   if (args.systemKey !== process.env.INNGEST_SIGNING_KEY) {
     throw new Error("Unauthorized: Invalid system key");
   }
   ```

3. **Authentication succeeds** - Convex now has access to the signing key and can validate system requests

## Important Notes

### Environment Variable Scope

- **Convex environment**: Set via `bun run convex env set` - used by Convex functions
- **Next.js environment**: Set via `.env.local` - used by API routes and Inngest client
- **Production**: Already configured in `.env.vercel` and Vercel dashboard

### Why Two Environments?

Convex functions run in Convex's cloud infrastructure, not in your Next.js process. They need their own environment variables set through the Convex CLI.

### Security Best Practices

The signing key serves as a shared secret between:
- Inngest background jobs (callers)
- Convex system-level functions (validators)

This prevents unauthorized access to privileged operations like:
- Resetting user usage limits
- Accessing any user's project data
- Recording webhook events

## Related Files

- `convex/projects.ts` - System-level project queries
- `convex/usage.ts` - Usage management
- `convex/webhooks.ts` - Webhook processing
- `src/inngest/functions.ts` - Background job functions that call Convex
- `src/inngest/client.ts` - Inngest client configuration
- `.env.local` - Local environment configuration
- `.env.vercel` - Production environment reference

## Troubleshooting

If you still see authentication errors:

1. **Check Convex environment**:
   ```bash
   bun run convex env list | grep INNGEST
   ```

2. **Check local environment**:
   ```bash
   grep INNGEST .env.local
   ```

3. **Verify both servers are restarted** after environment changes

4. **Check Convex dashboard logs** for detailed error messages

## Additional Context

This fix addresses the second set of errors from the original issue. The first error about `userId` missing from `createWithMessageAndAttachments` is a separate issue related to API request validation.
