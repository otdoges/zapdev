# Convex Auth UI Status Fix

## Problem
After signing in with Convex Auth, the UI did not update to show the signed-in status (no "Welcome" message, navbar didn't update to show user control instead of sign-in button, etc.). However, no errors appeared in Chrome DevTools console or Vercel logs.

## Root Causes Identified

### 1. **Race Condition in `useUser()` Hook**
The original `useUser()` hook had a critical race condition:

```typescript
// BEFORE - PROBLEMATIC
if (isLoading) {
  return null;
}
```

This would return `null` during the auth loading state, which could be interpreted by components as "user not authenticated" instead of "still loading".

### 2. **Missing Re-render Trigger**
The hook checked both `isAuthenticated` and `userData`, but wasn't properly handling the async nature of Convex Auth. When a user signed in:
1. Convex Auth updated the auth state
2. But the `useQuery(api.users.getCurrentUser)` might not re-run with the new auth context immediately
3. This caused the navbar to still show "Sign in" button even though `isAuthenticated` was true

### 3. **Modal Close Timing**
The auth modal detection relied on comparing previous and current user state, but without proper cleanup or timing, the state comparison could fail to trigger the modal close.

## Fixes Applied

### Fix 1: Updated `useUser()` Hook (`src/lib/auth-client.ts`)

**Key Changes:**
1. Properly distinguish between "loading" and "not authenticated"
2. Re-apply `authIsLoading` check first to avoid premature returns
3. Added explicit null checks with clear comments explaining the logic
4. Ensured query is always called so it responds to auth context changes

```typescript
export function useUser() {
  const { isAuthenticated, isLoading: authIsLoading } = useConvexAuthBase();
  const { signOut } = useAuthActions();
  const userData = useQuery(api.users.getCurrentUser);

  // While auth is still loading, return null
  if (authIsLoading) {
    return null;
  }

  // If not authenticated, return null
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated but user data is still loading (undefined), return null
  if (userData === undefined) {
    return null;
  }

  // If no user data found (null response), return null
  if (userData === null) {
    return null;
  }

  // Return the user object
  return { ... };
}
```

**Why This Works:**
- Properly sequences the checks: loading → authenticated → data available
- Allows React to trigger re-renders when `userData` changes from undefined to actual data
- Components using `useUser()` will automatically update when auth state changes

### Fix 2: Enhanced Auth Modal (`src/components/auth-modal.tsx`)

**Key Changes:**
1. Added `useRef` to prevent duplicate toast notifications
2. Added slight delay before closing modal to ensure UI has time to update
3. Reset toast flag when modal is opened

```typescript
const hasShownToastRef = useRef(false);

useEffect(() => {
  if (!previousUser && user) {
    if (!hasShownToastRef.current) {
      toast.success("Welcome back!");
      hasShownToastRef.current = true;
    }
    // Delay to ensure UI updates
    const timer = setTimeout(() => {
      onClose();
      hasShownToastRef.current = false;
    }, 500);
    return () => clearTimeout(timer);
  }
  setPreviousUser(user);
}, [user, previousUser, onClose]);
```

**Why This Works:**
- Prevents race conditions where modal closes before UI updates
- Ensures proper state transitions in React
- Better user experience with visible confirmation

### Fix 3: Clarified `ConvexClientProvider` (`src/components/convex-provider.tsx`)

Added comments clarifying that the Convex client handles auth state changes automatically through the `ConvexAuthProvider`.

## Verification Steps

To verify the fix works:

1. **Sign In Flow:**
   - Open app and click "Sign in"
   - Complete OAuth or email authentication
   - Verify:
     - Auth modal closes
     - "Welcome back!" toast appears
     - Navbar shows user avatar/name instead of "Sign in" button

2. **Debug Component (Optional):**
   - Import and add the debug component to your layout:
   ```tsx
   import { AuthDebug } from "@/components/auth-debug";
   // Add <AuthDebug /> to see real-time auth state
   ```
   - After sign-in, verify:
     - `isAuthenticated` = `true`
     - `useUser()` returns user object
     - API query shows user data

3. **Network Tab:**
   - Check that `/convex/CurrentUser` query is called after sign-in
   - Verify it returns user data (not error)

## Testing Different Auth Providers

Test with all configured providers:
- GitHub OAuth
- Google OAuth
- Email (Resend)

## Files Modified

1. `src/lib/auth-client.ts` - Fixed useUser() hook logic
2. `src/components/auth-modal.tsx` - Enhanced modal closing behavior
3. `src/components/convex-provider.tsx` - Clarified comments
4. `src/components/auth-debug.tsx` - New debug component (optional)

## Related Components

These components depend on the fixes and should now work correctly:
- `src/modules/home/ui/components/navbar.tsx` - Will show user control after sign-in
- `src/components/user-control.tsx` - User dropdown menu
- `src/app/dashboard/*` - Protected routes

## Architecture Overview

```
Sign-in Flow:
1. User clicks "Sign in" → AuthModal opens
2. SignInForm calls signIn(provider)
3. Convex Auth handles OAuth/email flow
4. Browser redirected to auth callback
5. Auth state updated in ConvexAuthProvider
6. useConvexAuth() detects authenticated = true
7. useUser() hook triggers re-render
8. userData query fetches user information
9. useUser() now returns user object
10. Navbar and other components re-render
11. AuthModal detects user change and closes
12. "Welcome back!" toast shows
13. User sees navbar with their avatar
```

## Debugging Tips

If issues persist after these fixes:

1. **Check Environment Variables:**
   ```bash
   NEXT_PUBLIC_CONVEX_URL
   AUTH_GITHUB_ID & AUTH_GITHUB_SECRET (for GitHub)
   AUTH_GOOGLE_ID & AUTH_GOOGLE_SECRET (for Google)
   AUTH_RESEND_KEY & AUTH_EMAIL_FROM (for Email)
   ```

2. **Check Browser DevTools:**
   - Network tab: Look for `convex/getCurrentUser` queries
   - Application tab: Check `__convex_auth` cookie is present after sign-in
   - Console: Check for any auth-related errors

3. **Check Convex Logs:**
   - Run `bun run convex:dev` to see Convex backend logs
   - Look for auth context changes and query execution

4. **Add Console Debugging:**
   ```typescript
   // In useUser() for debugging
   console.log('Auth state:', { isAuthenticated, authIsLoading });
   console.log('User data:', userData);
   ```

## Future Improvements

Consider these enhancements:
1. Add auth state persistence check
2. Implement auth refresh mechanism if tokens expire
3. Add better error boundaries for auth failures
4. Implement auth state recovery on network errors
