# Convex Auth Migration - COMPLETE ✅

**Date**: December 3, 2025  
**Migration**: Stack Auth → Convex Auth  
**Status**: ✅ Complete - Ready for Configuration

---

## 🎉 Migration Summary

Successfully migrated from Stack Auth to Convex Auth with support for:
- ✅ **GitHub OAuth** - Sign in with GitHub
- ✅ **Google OAuth** - Sign in with Google  
- ✅ **Email Magic Links** - Passwordless sign-in via Resend

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies (Already Done)
```bash
bun add @convex-dev/auth@latest
```

### Step 2: Configure OAuth Applications

#### GitHub OAuth App
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Set:
   - Application name: `Zapdev`
   - Homepage URL: `https://zapdev.link` (or your domain)
   - Authorization callback URL: `https://your-convex-url.convex.site/api/auth/callback/github`
4. Copy **Client ID** and **Client Secret**

#### Google OAuth App  
1. Go to https://console.cloud.google.com/apis/credentials
2. Create new OAuth 2.0 Client ID
3. Set:
   - Application type: `Web application`
   - Authorized redirect URIs: `https://your-convex-url.convex.site/api/auth/callback/google`
4. Copy **Client ID** and **Client Secret**

#### Resend Email Service
1. Go to https://resend.com/
2. Create account and verify your domain
3. Generate API key
4. Copy API key

### Step 3: Set Environment Variables

#### Local Development (.env.local)
```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# GitHub OAuth
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Google OAuth  
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Resend Email
AUTH_RESEND_KEY=your-resend-api-key
AUTH_EMAIL_FROM=noreply@yourdomain.com
```

#### Convex Environment (Production)
```bash
bunx convex env set AUTH_GITHUB_ID your-github-client-id
bunx convex env set AUTH_GITHUB_SECRET your-github-client-secret
bunx convex env set AUTH_GOOGLE_ID your-google-client-id
bunx convex env set AUTH_GOOGLE_SECRET your-google-client-secret
bunx convex env set AUTH_RESEND_KEY your-resend-api-key
bunx convex env set AUTH_EMAIL_FROM noreply@yourdomain.com
```

### Step 4: Deploy to Convex
```bash
# Push schema changes
bunx convex deploy

# Verify deployment
bunx convex dashboard
```

### Step 5: Test Authentication

1. Start development servers:
```bash
# Terminal 1
bunx convex dev

# Terminal 2  
bun run dev
```

2. Visit http://localhost:3000
3. Click "Sign In" 
4. Test each auth method:
   - ✅ Sign in with GitHub
   - ✅ Sign in with Google
   - ✅ Sign in with Email (magic link)

---

## 📋 What Changed

### Added Files
- `convex/auth.ts` - Convex Auth configuration
- `convex/users.ts` - User query functions
- `src/lib/auth-client.ts` - Client-side auth hooks
- `src/components/auth/sign-in-form.tsx` - Custom sign-in UI
- `.env.example` - Environment variable template

### Modified Files
- `convex/schema.ts` - Added Convex Auth tables
- `convex/http.ts` - Added auth HTTP routes
- `convex/helpers.ts` - Updated auth helpers for Convex Auth
- `src/lib/auth-server.ts` - Updated server auth utilities
- `src/components/convex-provider.tsx` - Switched to ConvexAuthProvider
- `src/components/auth-modal.tsx` - Updated to use new sign-in form
- `src/app/layout.tsx` - Removed StackProvider, using ConvexAuthProvider
- All components using `useUser()` - Now import from `@/lib/auth-client`

### Removed Files
- `src/stack.ts` - Stack Auth configuration
- `src/app/handler/[...stack]/page.tsx` - Stack Auth handler routes
- `convex/auth.config.ts` - Stack Auth JWT config

### Removed Dependencies
- `@stackframe/stack` - Replaced with `@convex-dev/auth`

---

## 🔄 API Changes

### Client-Side Hooks

**Before (Stack Auth):**
```typescript
import { useUser } from "@stackframe/stack";

const user = useUser();
await user?.signOut();
```

**After (Convex Auth):**
```typescript
import { useUser } from "@/lib/auth-client";

const user = useUser();
await user?.signOut();
```

**Note:** The API is compatible! No need to change component code.

### Server-Side

**Before (Stack Auth):**
```typescript
import { stackServerApp } from "@/stack";
const user = await stackServerApp.getUser();
```

**After (Convex Auth):**
```typescript
import { getUser } from "@/lib/auth-server";
const user = await getUser();
```

### Convex Functions

No changes needed! Convex functions continue to use:
```typescript
import { requireAuth, getCurrentUserId } from "./helpers";

const userId = await requireAuth(ctx);
```

---

## ⚠️ Important Notes

### User Data Migration
- **Existing Stack Auth users will need to re-register**
- User IDs will change (Stack Auth → Convex Auth)
- Consider exporting/importing user data if needed

### OAuth Callback URLs
Make sure to update callback URLs in:
- GitHub OAuth app settings
- Google OAuth app settings
- Format: `https://[your-convex-url].convex.site/api/auth/callback/[provider]`

### Email Configuration
- Resend requires domain verification for production
- Use a verified domain for `AUTH_EMAIL_FROM`
- Test email delivery before deploying to production

---

## 🎯 Benefits of Convex Auth

1. **Fully Integrated** - Runs entirely on your Convex backend
2. **No External Service** - No third-party auth service required
3. **Cost Effective** - Free (runs on Convex deployment)
4. **Flexible** - Easy to customize and extend
5. **Modern** - Supports passkeys, WebAuthn (can be added)

---

## 🔧 Troubleshooting

### "Auth configuration not found"
- Ensure `convex/auth.ts` exists and is exported
- Run `bunx convex deploy` to push changes

### "OAuth callback failed"
- Check callback URLs match exactly in OAuth app settings
- Verify environment variables are set in Convex dashboard

### "Email not sending"
- Verify Resend API key is correct
- Check domain is verified in Resend dashboard
- Look for errors in Convex logs: `bunx convex logs`

### "User is null after sign-in"
- Check browser console for errors
- Verify `convex/users.ts` query is working
- Check auth tables exist in Convex schema

---

## 📚 Documentation

- [Convex Auth Docs](https://labs.convex.dev/auth)
- [GitHub OAuth Guide](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
- [Resend Docs](https://resend.com/docs)

---

## ✅ Next Steps

1. **Configure OAuth Apps** (see Step 2)
2. **Set Environment Variables** (see Step 3)
3. **Deploy to Convex** (`bunx convex deploy`)
4. **Test Authentication** (see Step 5)
5. **Update Production Environment** (set env vars in Convex dashboard)

---

**Questions?** Check the Convex Auth documentation or Discord.

**Ready to deploy!** 🚀
