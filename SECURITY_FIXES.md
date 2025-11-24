# Security Fixes - ZapDev

**Date**: November 21, 2025
**Status**: ✅ Completed

## Summary

This document details critical security fixes implemented to address data leaks, credit/billing abuse, and authorization bypasses in the ZapDev application. All fixes focus on the actual attack surface: **Convex queries/mutations** and **webhook endpoints**.

## Critical Fixes Implemented

### 1. Credit System Protection ✅

**Issue**: Credit resets could be abused if exposed via API.

**Impact**:
- Users could bypass payment system
- Unlimited free credits
- Revenue loss

**Fix**:
- Removed user-facing `resetUsage` mutation entirely
- Created `resetUsageSystem` mutation for webhook/background job access only (requires system key)
- For admin operations: Use Convex dashboard directly to delete usage records

**Files Changed**:
- `convex/usage.ts` - Removed `resetUsage`, kept only `resetUsageSystem` with system key validation
- `src/app/api/webhooks/polar/route.ts` - Uses `resetUsageSystem` for subscription events

**Admin Credit Resets**:
```
1. Go to Convex Dashboard (https://dashboard.convex.dev)
2. Navigate to Data → usage table
3. Find user's usage record
4. Delete the record (credits reset on next request)
```

**Webhook Usage**:
```typescript
// Only webhooks/background jobs can call this
await convex.mutation(api.usage.resetUsageSystem, {
  userId: "...",
  systemKey: process.env.SYSTEM_API_KEY
});
```

---

### 2. Authorization Bypass on System Queries ✅

**Issue**: `getForSystem` query (convex/projects.ts:501) had no authentication, allowing anyone to access any project by ID.

**Impact**:
- Complete data leak - any user's projects accessible
- Enumeration attacks possible
- Privacy violation

**Fix**:
- Added `systemKey` parameter to `getForSystem` query
- Validates `SYSTEM_API_KEY` before allowing access
- Updated all Inngest function calls to include system key (4 locations in `src/inngest/functions.ts`)

**Files Changed**:
- `convex/projects.ts:501-518` - Added system key validation
- `src/inngest/functions.ts` - Updated all `getForSystem` calls (lines 816, 2062, 2159, 2617)

**Testing**:
```typescript
// Without valid system key - FAILS
await convex.query(api.projects.getForSystem, {
  projectId: "...",
  systemKey: "invalid"
}); // Throws: "Unauthorized: Invalid system key"

// With valid system key - SUCCEEDS
await convex.query(api.projects.getForSystem, {
  projectId: "...",
  systemKey: process.env.SYSTEM_API_KEY
});
```

---

### 3. Fragment Access Control ✅

**Issue**: `getFragmentById` query (convex/messages.ts:433) returned code fragments without checking project ownership.

**Impact**:
- Any user could view generated code from other users' projects
- IP theft risk
- Data leak

**Fix**:
- Added `requireAuth()` and project ownership validation
- Verifies requesting user owns the project before returning fragment
- Checks: fragment → message → project → userId match

**Files Changed**:
- `convex/messages.ts:434-459` - Added authorization checks

**Testing**:
```typescript
// User A trying to access User B's fragment - FAILS
await ctx.runQuery(api.messages.getFragmentById, {
  fragmentId: "userB_fragment_id"
}); // Throws: "Unauthorized"
```

---

### 4. Public Showcase Privacy Protection ✅

**Issue**: `listShowcase` query (convex/projects.ts:234) exposed ALL projects without user consent.

**Impact**:
- Project names and metadata publicly visible
- No GDPR compliance (no opt-in)
- Privacy violation

**Fix**:
- Added `isPublic` boolean field to projects schema
- Updated `listShowcase` to only show projects where `isPublic === true`
- Added `setProjectPublic` mutation for users to control visibility
- Added `isPublic` parameter to project `update` mutation
- Created index `by_isPublic` for efficient queries

**Files Changed**:
- `convex/schema.ts:73,79` - Added `isPublic` field and index
- `convex/projects.ts:234-280` - Updated showcase query to filter by `isPublic`
- `convex/projects.ts:346-371` - Added `setProjectPublic` mutation

**Default**: Projects are private by default (`isPublic` is optional and defaults to `false` / `undefined`)

**Testing**:
```typescript
// Set project as public
await ctx.runMutation(api.projects.setProjectPublic, {
  projectId: "...",
  isPublic: true
});

// Only public projects appear in showcase
const showcase = await ctx.runQuery(api.projects.listShowcase, {});
// Returns only projects with isPublic === true
```

---

### 5. OAuth State Token HMAC Signing ✅

**Issue**: OAuth state tokens used simple Base64 encoding, vulnerable to tampering for account takeover.

**Impact**:
- Attacker could modify state token to link their OAuth to victim's account
- Account takeover via OAuth
- CSRF bypass

**Fix**:
- Created `createOAuthState()` and `validateOAuthState()` utilities with HMAC-SHA256 signing
- Added nonce (random 16-byte hex) to prevent reuse
- Added timestamp with 10-minute expiry
- Updated GitHub and Figma OAuth flows (both auth and callback routes)

**Files Changed**:
- `src/lib/oauth-state.ts` - New HMAC signing utilities
- `src/app/api/import/github/auth/route.ts:29-30` - Use `createOAuthState()`
- `src/app/api/import/github/callback/route.ts:46-47` - Use `validateOAuthState()`
- `src/app/api/import/figma/auth/route.ts:26-27` - Use `createOAuthState()`
- `src/app/api/import/figma/callback/route.ts:46-47` - Use `validateOAuthState()`

**Security Properties**:
- HMAC-SHA256 signature prevents tampering
- Nonce prevents token reuse
- 10-minute expiry window limits attack window
- Uses existing `SYSTEM_API_KEY` (no new environment variables needed!)

**Testing**:
```typescript
// Create state token
const state = createOAuthState("user_123");

// Validation succeeds for correct user
validateOAuthState(state, "user_123"); // ✅ true

// Validation fails for wrong user
validateOAuthState(state, "user_456"); // ❌ throws Error

// Validation fails after 10 minutes
// (wait 10+ minutes)
validateOAuthState(state, "user_123"); // ❌ throws "State token expired"
```

---

### 6. Webhook Replay Attack Protection ✅

**Issue**: Polar webhooks had no replay protection - same event could be processed multiple times.

**Impact**:
- Duplicate subscription updates
- Incorrect credit allocations
- Data inconsistency
- Potential financial impact

**Fix**:
- Added `webhookEvents` table to Convex schema for tracking processed events
- Created `checkAndRecordWebhookEvent` mutation to detect and prevent replays
- Updated Polar webhook route to check event IDs before processing
- Auto-expires old webhook events after 30 days

**Files Changed**:
- `convex/schema.ts:272-282` - Added `webhookEvents` table
- `convex/webhooks.ts` - New webhook tracking mutations
- `src/app/api/webhooks/polar/route.ts:40-53` - Added replay check

**How It Works**:
1. Webhook received → Extract event ID
2. Check if ID exists in `webhookEvents` table
3. If exists → Return immediately (replay detected)
4. If new → Record event ID and process
5. Cleanup job deletes events older than 30 days

**Testing**:
```typescript
// First webhook event - processes normally
POST /api/webhooks/polar
{ "type": "subscription.created", "data": { "id": "sub_123" } }
// ✅ Processes and returns { received: true }

// Replay of same event - blocked
POST /api/webhooks/polar
{ "type": "subscription.created", "data": { "id": "sub_123" } }
// 🛑 Returns { received: true, replay: true }, not processed
```

---

## Environment Variables Required

**Good news: NO new environment variables needed!** 🎉

All security fixes use existing environment variables:
- `SYSTEM_API_KEY` - Already configured (used for OAuth state signing, system key validation, webhook protection)
- `NEXT_PUBLIC_CONVEX_URL` - Already configured

Admins are managed via Convex dashboard (see "How to Add First Admin" above).

---

## Database Migrations

### Schema Changes

Run Convex deployment to apply schema changes:

```bash
bun run convex:deploy
```

New fields/tables:
- `projects.isPublic` (optional boolean)
- `projects` index: `by_isPublic`
- `webhookEvents` table (new)

### Data Migration

Existing data is safe:
- `projects.isPublic` is optional - existing projects default to private (undefined/false)
- `webhookEvents` table starts empty
- No manual migration needed

---

## Testing Checklist

### Credit System
- [ ] No user-facing `resetUsage` mutation exists (prevents abuse)
- [ ] Webhooks can reset credits using `resetUsageSystem` with valid system key
- [ ] Invalid system key fails with "Unauthorized"
- [ ] Admins can manually delete usage records via Convex dashboard

### Project Access
- [ ] Cannot access projects via `getForSystem` without valid system key
- [ ] Inngest functions successfully access projects with system key
- [ ] Enumeration attacks fail (trying sequential project IDs)

### Fragment Access
- [ ] User A cannot access User B's fragments
- [ ] User can access own fragments
- [ ] Unauthenticated requests fail

### Showcase Privacy
- [ ] New projects don't appear in showcase (isPublic defaults to false)
- [ ] Setting `isPublic: true` makes project appear in showcase
- [ ] Setting `isPublic: false` removes project from showcase

### OAuth Security
- [ ] OAuth state tokens expire after 10 minutes
- [ ] Tampered state tokens fail validation
- [ ] State tokens only work for the correct user ID

### Webhook Protection
- [ ] Duplicate webhook events are ignored (replay protection)
- [ ] First occurrence of event processes normally
- [ ] Invalid webhook signatures rejected

---

## Security Recommendations (Future Enhancements)

While outside the scope of current fixes, consider these future improvements:

1. **Rate Limiting**: Add per-user rate limits on Convex mutations using Upstash Redis or similar
2. **Audit Logging**: Log all admin actions (resetUsage, etc.) for compliance
3. **OAuth Token Rotation**: Implement refresh token rotation for GitHub/Figma OAuth
4. **Content Security Policy**: Add CSP headers to mitigate XSS risks
5. **Dependency Scanning**: Set up Snyk or Dependabot for vulnerability monitoring

---

## Rollback Plan

If issues arise, revert commits in this order:

1. Webhook replay protection (least critical)
2. OAuth HMAC signing (may break active OAuth flows)
3. Showcase privacy (breaks public showcase feature)
4. Fragment access control (may break legitimate access)
5. getForSystem protection (may break Inngest jobs)
6. Credit system protection (DO NOT REVERT - critical for billing)

**Emergency Rollback**:
```bash
git revert <commit-hash>
bun run convex:deploy  # Re-deploy schema
```

---

## Monitoring & Alerts

Set up alerts for:

- Failed `resetUsage` attempts (potential abuse)
- High volume of `getForSystem` calls with invalid keys (enumeration attack)
- Webhook replay detections (potential attack)
- Failed OAuth state validations (CSRF attempt)

Log these events to Sentry or your monitoring tool:
```typescript
// Example
console.error('[SECURITY] Admin authorization failed', { userId, action });
```

---

## Support & Questions

For questions about these security fixes:
- Check individual file comments for implementation details
- Review test cases in `/tests` directory
- Refer to Convex documentation for schema/mutation patterns

**Security Contact**: If you discover a security vulnerability, please report it immediately via your team's security disclosure process.

---

## Summary: Zero New Environment Variables! 🎉

This security audit was designed to avoid configuration complexity:

**What You DON'T Need**:
- ❌ No new environment variables
- ❌ No admin user setup
- ❌ No additional secrets or API keys

**What You DO Need**:
- ✅ Run `bun run convex:deploy` (applies schema changes)
- ✅ That's it!

All security improvements leverage:
- Existing `SYSTEM_API_KEY` environment variable
- Convex dashboard for admin operations (delete usage records, view data)
- WorkOS for authentication
