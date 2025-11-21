# Convex Auth trustedOrigins Synchronization - November 21, 2025

## Summary

Updated `convex/auth.ts` to synchronize the `trustedOrigins` configuration with the client-side Better Auth instance (`src/lib/auth.ts`) for consistency and to prevent potential future issues.

## Changes Made

### File: `convex/auth.ts`

**Before:**
```typescript
trustedOrigins: process.env.NODE_ENV === "production"
    ? [getAppUrl()]
    : [getAppUrl(), "http://localhost:3000"],
```

**After:**
```typescript
// Include both www and non-www versions to handle redirects
trustedOrigins: process.env.NODE_ENV === "production"
    ? [
        getAppUrl(),
        "https://zapdev.link",
        "https://www.zapdev.link",
    ]
    : [getAppUrl(), "http://localhost:3000"],
```

## Why This Change?

### Context

The client-side Better Auth instance in `src/lib/auth.ts` was already updated in commit `273ed01` to include both www and non-www origins:

```typescript
trustedOrigins: process.env.NODE_ENV === "production"
    ? [
        getAppUrl(),                 // www.zapdev.link
        "https://zapdev.link",       // non-www
        "https://www.zapdev.link",   // explicit www
    ]
    : [getAppUrl(), "http://localhost:3000"],
```

This fixed the 403 Forbidden errors during social OAuth flows when users accessed the app from different domain variations.

### Why Sync Both Configurations?

Although the Convex auth instance doesn't directly handle browser OAuth requests (that's done by the Vercel-hosted client instance), keeping both configurations in sync provides:

1. **Consistency**: Both auth instances now have identical origin validation rules
2. **Future-proofing**: Prevents confusion if Convex auth handling changes in future Better Auth versions
3. **Documentation**: Makes it clear that both origins are intentionally trusted
4. **Debugging**: Easier to troubleshoot when configurations match

## Technical Details

### How Better Auth Origin Validation Works

```
User Browser (https://zapdev.link)
  ↓
  POST /api/auth/sign-in/social
  Origin Header: https://zapdev.link
  ↓
Next.js App (Vercel) → Better Auth Client (src/lib/auth.ts)
  ↓
  Validates Origin against trustedOrigins ✅
  ↓
Convex Backend → Better Auth Server (convex/auth.ts)
  ↓
  Database operations (no origin validation needed)
```

**Key Points:**
- Client instance (`src/lib/auth.ts`) handles OAuth redirects and browser requests
- Convex instance (`convex/auth.ts`) handles database operations and server-side auth
- Origin validation is primarily enforced by the client instance
- However, both should have consistent configurations

### Why Convex URL is NOT in trustedOrigins

The Convex deployment URL (`.convex.cloud`) is **NOT** included in `trustedOrigins` because:

1. **Backend Service**: Convex is a backend database, not a user-facing origin
2. **Server-to-Server**: App → Convex communication doesn't include browser Origin headers
3. **No OAuth Flows**: Convex doesn't handle OAuth redirects from browsers
4. **WebSocket/HTTP**: Convex uses WebSocket and HTTP APIs, not browser-based auth

Only **user-facing domains** need to be in `trustedOrigins`:
- ✅ `https://zapdev.link` (users access this)
- ✅ `https://www.zapdev.link` (users access this)
- ❌ `https://dependable-trout-339.convex.cloud` (backend only)

## Testing

### Verification Steps

1. **Syntax Check**: ✅ Verified TypeScript syntax is valid
2. **Build Check**: Code compiles without errors (dependency type errors are pre-existing)
3. **Deployment**: Changes will be deployed with next Convex deployment

### Manual Testing (After Deployment)

Test OAuth flows from both domain variations:

1. **Non-WWW Domain**:
   ```
   Visit: https://zapdev.link
   → Sign in with GitHub
   → Should complete successfully
   ```

2. **WWW Domain**:
   ```
   Visit: https://www.zapdev.link
   → Sign in with Google
   → Should complete successfully
   ```

3. **Check Logs**:
   - No 403 errors in Vercel Function Logs
   - No origin validation errors in Convex logs
   - Successful session creation

## Related Changes

This change is part of the broader Better Auth origin validation fix:

1. **Commit `273ed01`**: Fixed `src/lib/auth.ts` to include both www and non-www
2. **This Change**: Updated `convex/auth.ts` to match for consistency
3. **Documentation**: See `explanations/SOCIAL_AUTH_403_FIX_2025-11-21.md`

## Environment Variables

No environment variable changes required. The configuration uses:

- `process.env.NODE_ENV` - Determines production vs development
- `getAppUrl()` - Returns `process.env.NEXT_PUBLIC_APP_URL`

Current production values:
```bash
NEXT_PUBLIC_APP_URL=https://zapdev.link  # or www.zapdev.link
SITE_URL=https://zapdev.link
```

## Deployment

### Convex Deployment

The changes will be automatically deployed when you run:

```bash
bun run convex:deploy
```

Or they'll be deployed automatically by Vercel if Convex auto-deployment is enabled.

### No Breaking Changes

This is a **non-breaking change**:
- Expands the list of trusted origins (doesn't remove any)
- Maintains backward compatibility
- No database migration required
- No environment variable updates needed

## Summary Table

| Configuration | Before | After |
|---------------|--------|-------|
| **src/lib/auth.ts** | ✅ Both origins | ✅ Both origins (already fixed) |
| **convex/auth.ts** | ⚠️ Only getAppUrl() | ✅ Both origins (now synced) |
| **Functionality** | ✅ Working | ✅ Working (more robust) |
| **Consistency** | ⚠️ Inconsistent | ✅ Consistent |

## Best Practices

Going forward, when adding new trusted origins:

1. **Update Both Files**:
   - `src/lib/auth.ts` (client instance)
   - `convex/auth.ts` (server instance)

2. **Use Comments**:
   - Document why each origin is trusted
   - Explain www vs non-www handling

3. **Test Both Domains**:
   - Always test OAuth from all domain variations
   - Verify in both development and production

4. **Document Changes**:
   - Update this file or related docs
   - Explain the reasoning for new origins

## References

- **Original Fix**: `explanations/SOCIAL_AUTH_403_FIX_2025-11-21.md`
- **Better Auth Docs**: https://www.better-auth.com/docs/concepts/security
- **Origin Validation**: CSRF protection via origin header validation
- **Commit**: 273ed01 - "fix: add both www and non-www origins to Better Auth trustedOrigins"

## Conclusion

This change ensures both Better Auth instances (client and Convex) have identical origin validation rules, preventing confusion and potential issues. While the Convex instance doesn't directly validate browser origins, keeping configurations in sync is a best practice for maintainability and future compatibility.

✅ **Status**: Complete and ready for deployment
🔒 **Security**: CSRF protection maintained
📝 **Documentation**: Updated
🚀 **Impact**: Non-breaking, consistency improvement
