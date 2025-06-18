# 🚀 Quick Authentication Setup Guide

## What I Fixed

✅ **Created `.env.local`** with all required environment variables  
✅ **Generated secure Better Auth secret**  
✅ **Added environment validation** with helpful error messages  
✅ **Improved OAuth configuration** with proper scopes  
✅ **Enhanced error handling** for authentication flows  

## ⚡ Next Steps to Complete Setup

### 1. **GitHub OAuth Setup** (Required)
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: `ZapDev`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret
5. Replace in `.env.local`:
   ```
   GITHUB_CLIENT_ID=your_actual_github_client_id
   GITHUB_CLIENT_SECRET=your_actual_github_client_secret
   ```

### 2. **Google OAuth Setup** (Required)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API" 
4. Go to Credentials → Create Credentials → OAuth client ID
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret
8. Replace in `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your_actual_google_client_id.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
   ```

### 3. **Convex Setup** (Required)
1. Go to [Convex Dashboard](https://dashboard.convex.dev/)
2. Create a new project
3. Run: `bunx convex dev`
4. Copy the deployment URL
5. Replace in `.env.local`:
   ```
   NEXT_PUBLIC_CONVEX_URL=your_actual_convex_url
   ```

### 4. **Optional API Keys**
Replace these if you want full functionality:
- `NEXT_OPENROUTER_API_KEY` - for AI chat
- `GEMINI_API_KEY` - for prompt enhancement

## 🧪 Test Authentication

1. **Start Convex**: `bunx convex dev`
2. **Start Next.js**: `bun run dev`
3. **Visit**: `http://localhost:3000/auth`
4. **Test both GitHub and Google sign-in**

## 🔍 Troubleshooting

### Environment Variables Not Loading?
```bash
# Check if .env.local exists and has the right values
cat .env.local
```

### Auth Errors in Console?
- Check the console for specific error messages
- Verify OAuth app redirect URLs match exactly
- Make sure Convex is running

### Still Not Working?
1. Clear browser cookies and localStorage
2. Restart both Convex and Next.js servers
3. Check that OAuth app is active and approved

## ✨ What's Improved

- **Better error messages** when env vars are missing
- **Proper OAuth scopes** for email access
- **Enhanced security** with proper cookie settings
- **Validation** that warns about placeholder values

Your authentication should now work perfectly once you add the real OAuth credentials! 🎉