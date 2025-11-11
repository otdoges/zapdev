# Migration from Clerk to Better Auth + Polar.sh

## Status: ✅ COMPLETE

This document tracks the migration from Clerk authentication to Better Auth with Polar.sh billing integration.

**Migration completed on**: 2025-11-11

## Completed Tasks

### Phase 1: Better Auth Setup ✅
- [x] Installed `better-auth@1.3.34`
- [x] Created `/src/lib/auth.ts` - Better Auth server configuration
- [x] Created `/src/lib/auth-client.ts` - Better Auth client hooks
- [x] Created `/src/lib/auth-server.ts` - Session helpers for API routes
- [x] Created API route `/src/app/api/auth/[...all]/route.ts`
- [x] Updated Convex schema with Better Auth tables (users, sessions, accounts)
- [x] Updated Convex auth config (`convex/auth.config.ts`)

### Phase 2: Convex Schema Updates ✅
- [x] Added `users` table with Polar.sh subscription fields
- [x] Added `sessions` table for Better Auth
- [x] Added `accounts` table for OAuth providers
- [x] Changed all `userId: v.string()` to `userId: v.id("users")`
- [x] Updated `projects`, `oauthConnections`, `imports`, `usage` tables

### Phase 3: Core Infrastructure ✅
- [x] Updated `src/middleware.ts` - Better Auth session validation
- [x] Updated `src/trpc/init.ts` - tRPC context with session token
- [x] Updated `convex/helpers.ts` - Better Auth helper functions
- [x] Removed Clerk imports from core files

### Phase 4: API Routes (10 files) ✅
- [x] `/src/app/api/agent/token/route.ts`
- [x] `/src/app/api/import/figma/auth/route.ts`
- [x] `/src/app/api/import/figma/callback/route.ts`
- [x] `/src/app/api/import/figma/files/route.ts`
- [x] `/src/app/api/import/figma/process/route.ts`
- [x] `/src/app/api/import/github/auth/route.ts`
- [x] `/src/app/api/import/github/callback/route.ts`
- [x] `/src/app/api/import/github/repos/route.ts`
- [x] `/src/app/api/import/github/process/route.ts`
- [x] `/src/app/api/messages/update/route.ts`
- [x] `/src/app/api/fix-errors/route.ts`

All API routes now use `requireSession()` from Better Auth.

### Phase 5: UI Components ✅
- [x] Updated `/src/app/(home)/sign-in/[[...sign-in]]/page.tsx` - Custom email/password + OAuth
- [x] Updated `/src/app/(home)/sign-up/[[...sign-up]]/page.tsx` - Custom registration form
- [x] Updated `/src/components/user-control.tsx` - Custom dropdown with user menu
- [x] Updated `/src/components/providers.tsx` - Removed Clerk provider
- [x] Updated `/src/app/layout.tsx` - Removed Clerk wrapper

### Phase 6: Polar.sh Integration ✅
- [x] Install Polar.sh SDK (`@polar-sh/sdk@0.41.1`)
- [x] Create `/src/lib/polar.ts` - Polar SDK configuration
- [x] Create `/src/app/api/polar/webhooks/route.ts` - Handle subscription webhooks
- [x] Create `/src/app/api/polar/checkout/route.ts` - Checkout session creation
- [x] Create `/src/app/api/polar/portal/route.ts` - Customer portal access
- [x] Create `/convex/users.ts` - User management with Polar integration
- [x] Update `/src/app/(home)/pricing/page-content.tsx` - Polar pricing UI
- [x] Update `/convex/usage.ts` - Use Polar subscription status

### Phase 7: UI Components ✅
- [x] Update `/src/modules/home/ui/components/navbar.tsx` - Better Auth components
- [x] Update `/src/modules/home/ui/components/project-form.tsx` - Remove `useClerk()`
- [x] Update `/src/modules/home/ui/components/projects-list.tsx` - Replace `useUser()`
- [x] Update `/src/modules/projects/ui/views/project-view.tsx` - Replace `useAuth()`
- [x] Update `/src/modules/projects/ui/components/usage.tsx` - Replace `useAuth()`
- [x] Update `/src/components/convex-provider.tsx` - Remove Clerk auth

### Phase 8: Environment & Configuration ✅
- [x] Update `env.example` with Better Auth and Polar variables
- [x] Remove Clerk environment variables from example
- [x] Remove `@clerk/nextjs` and `@clerk/themes` packages

## Remaining Tasks (Optional/Future)

### Documentation Updates (RECOMMENDED)
- [ ] Update CLAUDE.md documentation
- [ ] Update AGENTS.md documentation  
- [ ] Update README.md
- [ ] Create Better Auth setup guide

### Testing (CRITICAL BEFORE PRODUCTION)
- [ ] Test sign-up flow (email + password)
- [ ] Test sign-in flow (email + OAuth)
- [ ] Test session persistence across reloads
- [ ] Test protected routes redirect
- [ ] Test API routes authentication
- [ ] Test subscription creation (Polar)
- [ ] Test subscription upgrade/downgrade
- [ ] Test webhook handling (Polar)
- [ ] Test credit limits (Free: 5, Pro: 100)

### Data Migration (IF EXISTING USERS)
- [ ] Create migration script for existing Clerk users
- [ ] Map Clerk user IDs to Better Auth user IDs
- [ ] Update all userId references in database
- [ ] Migrate user metadata and subscriptions

## Environment Variables

### Required for Better Auth
```bash
# Better Auth
BETTER_AUTH_SECRET=<generate-random-secret-32-chars>
BETTER_AUTH_URL=http://localhost:3000  # or production URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
GITHUB_CLIENT_ID=<existing-or-new>
GITHUB_CLIENT_SECRET=<existing-or-new>
```

### Required for Polar.sh
```bash
# Polar.sh Billing
POLAR_ACCESS_TOKEN=<from-polar-dashboard>
POLAR_ORGANIZATION_ID=<your-org-id>
NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO=<pro-plan-product-id>
POLAR_WEBHOOK_SECRET=<from-polar-dashboard>
```

### To Remove
```bash
# Clerk (remove these)
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- NEXT_PUBLIC_CLERK_SIGN_IN_URL
- NEXT_PUBLIC_CLERK_SIGN_UP_URL
- CLERK_JWT_ISSUER_DOMAIN
- CLERK_WEBHOOK_SECRET
```

## Breaking Changes

### Database Schema
- `userId` changed from `v.string()` to `v.id("users")` across all tables
- **Action Required**: Existing data needs migration script to map Clerk IDs to Better Auth user IDs

### Authentication Flow
- Session management moved from Clerk to Better Auth
- JWT structure changed (now uses Better Auth format)
- OAuth callback URLs changed to `/api/auth/callback/*`

### API Changes
- `useAuth()` from Clerk → `useSession()` from Better Auth
- `useUser()` from Clerk → `useSession()` from Better Auth
- `auth()` server function → `requireSession()` custom helper
- User ID access: `userId` → `session.user.id`

## Testing Checklist

### Authentication
- [ ] Email/password sign-up
- [ ] Email/password sign-in
- [ ] Google OAuth sign-in
- [ ] GitHub OAuth sign-in
- [ ] Session persistence across page reloads
- [ ] Sign out functionality
- [ ] Protected route redirect to sign-in

### API Routes
- [ ] All import routes (Figma, GitHub) work with session
- [ ] Message update routes protected
- [ ] Agent token generation protected
- [ ] Error fixing routes protected

### Polar Billing
- [ ] Subscription creation via Polar checkout
- [ ] Webhook handling (subscription.created)
- [ ] Webhook handling (subscription.updated)
- [ ] Webhook handling (subscription.canceled)
- [ ] Credit limits (Free: 5, Pro: 100)
- [ ] Usage tracking with Polar plan

## Migration Script (TODO)

Need to create a script to migrate existing users:
```typescript
// scripts/migrate-clerk-to-better-auth.ts
// 1. Export all Clerk users from Convex
// 2. Create Better Auth users in users table
// 3. Map old Clerk IDs to new Better Auth IDs
// 4. Update all userId references in projects, messages, etc.
```

## Rollback Plan

If issues arise:
1. Keep this branch separate
2. Can revert by checking out previous commit
3. Clerk configuration still in git history
4. Database schema can be rolled back via Convex migrations

## Notes

- Better Auth uses SQLite-style storage by default (needs custom Convex adapter for production)
- Session cookies are named `zapdev.session_token`
- OAuth providers configured in `/src/lib/auth.ts`
- Polar.sh SDK already installed (`@polar-sh/sdk@0.41.1`)
