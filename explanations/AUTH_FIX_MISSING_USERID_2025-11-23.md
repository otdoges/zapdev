# Authentication Fix: Missing userId in createWithMessageAndAttachments

**Date:** 2025-11-23  
**Issue:** `ArgumentValidationError: Object is missing the required field userId`  
**Status:** ✅ Fixed

## Problem

Users were encountering an error when trying to create a new project from the home page:

```
ArgumentValidationError: Object is missing the required field `userId`. 
Object: {value: "Create an admin dashboard with a sidebar..."}
Validator: v.object({..., userId: v.string(), ...})
```

The `userId` field was completely missing from the object passed to the `createWithMessageAndAttachments` Convex action.

## Root Cause

The issue was a **race condition** in the authentication flow:

1. The `useAuth()` hook from WorkOS AuthKit loads asynchronously
2. The form could be submitted before the `user` object was fully loaded
3. When `user` was `null` or `user.id` was `undefined`, the mutation was still being called
4. The optional chaining `user?.id` didn't prevent the mutation call - it just passed `undefined`

## The Fix

### 1. Extract the `loading` state from `useAuth()`

```tsx
const { user, loading: authLoading } = useAuth();
```

### 2. Add explicit loading check in onSubmit

```tsx
// Wait for auth to load if it's still loading
if (authLoading) {
  toast.error("Authentication is loading, please wait...");
  return;
}

// Ensure user is authenticated and has an ID
if (!user || !user.id) {
  toast.error("You must be signed in to create a project");
  router.push("/sign-in");
  return;
}
```

### 3. Disable submit button during auth loading

```tsx
const isButtonDisabled = isPending || !form.formState.isValid || isUploading || authLoading || !user;
```

### 4. Add debugging console.log

```tsx
console.log("Creating project with user ID:", user.id);
```

## Changes Made

**File:** `src/modules/home/ui/components/project-form.tsx`

1. Added `loading: authLoading` to the `useAuth()` destructuring
2. Added explicit check for `authLoading` state before submission
3. Improved user validation from `!user?.id` to `!user || !user.id`
4. Updated `isButtonDisabled` to include `authLoading` and `!user` checks
5. Added console.log for debugging

## WorkOS AuthKit User Object Structure

The WorkOS AuthKit `useAuth()` hook returns:

```typescript
{
  user: User | null;  // null when not authenticated or loading
  loading: boolean;    // true while authentication state is being determined
  // ... other properties
}
```

The `User` object (from `@workos-inc/node`) has:

```typescript
interface User {
  id: string;         // ✅ This is the user ID we need
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  // ... other properties
}
```

**Important:** The `user.id` property is correct. It's NOT `user.subject` (which is only in JWT token claims).

## JWT vs User Object

- **Client-side** (`useAuth()`): Returns a `User` object with `id` property
- **JWT token**: Contains a `subject` claim (which equals `user.id`)
- **Convex server-side**: Reads `identity.subject` from the JWT token

The flow is: `user.id` (client) → JWT with `subject` claim → `identity.subject` (Convex)

## Testing Checklist

After this fix:

- [x] Form button is disabled while authentication is loading
- [x] Form button is disabled when user is not authenticated
- [x] User gets a clear error message if they try to submit while loading
- [x] User gets redirected to sign-in if not authenticated
- [x] Console.log shows the user ID when creating a project
- [ ] Successfully create a project and verify it works end-to-end

## Prevention

To prevent similar issues:

1. **Always check loading states** from auth hooks before using the user object
2. **Validate user object explicitly** (`!user` not just `!user?.property`)
3. **Disable UI interactions** during loading states
4. **Add defensive programming** - check both the object and its properties
5. **Use console.log** during development to verify user object is loaded

## Related Files

- `src/components/convex-provider.tsx` - WorkOS + Convex integration
- `convex/auth.config.ts` - JWT validation configuration
- `convex/helpers.ts` - Server-side auth helpers
- `src/lib/auth-server.ts` - Server-side WorkOS auth utilities

## Notes

- The original code used `user?.id` which was technically correct, but didn't account for loading state
- This is a common pattern with async authentication - always wait for loading to complete
- WorkOS AuthKit documentation recommends using the `loading` state: https://docs.convex.dev/auth/authkit
