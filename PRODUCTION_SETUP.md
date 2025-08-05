# 🚨 CRITICAL: Production Authentication Setup

## Current Issues Fixed
- ✅ Test keys in production environment detected and blocked
- ✅ Enhanced error handling in authentication components  
- ✅ Added production validation checks
- ✅ Improved Clerk domain configuration

## Required Actions for Production

### 1. Get Production Clerk Keys
Visit your [Clerk Dashboard](https://dashboard.clerk.com) and:

1. **Switch to Production instance**
2. **Get Production Keys:**
   - Publishable Key: `pk_live_...` 
   - Secret Key: `sk_live_...`

### 2. Update Environment Variables

Replace these in your `.env.local` (or production environment):

```bash
# Production Clerk Keys (REQUIRED)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_PRODUCTION_KEY
CLERK_SECRET_KEY=sk_live_YOUR_ACTUAL_PRODUCTION_SECRET

# Set your production domain in Clerk settings
CLERK_JWT_ISSUER_DOMAIN=https://your-app-domain.clerk.accounts.dev
```

### 3. Configure Clerk Dashboard for Production

In your Clerk Dashboard:

1. **Allowed redirect URLs:** Add your production domain
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/*`

2. **CORS origins:** Add your production domain
   - `https://yourdomain.com`

3. **Webhook endpoints** (if using): Update to production URLs

### 4. Deploy Convex to Production

```bash
# Deploy to production
npx convex deploy --prod

# Update CONVEX_DEPLOYMENT in environment
CONVEX_DEPLOYMENT=prod:your-production-deployment-name
VITE_CONVEX_URL=https://your-production-deployment.convex.cloud
```

### 5. Security Checklist

- [ ] Production Clerk keys configured (`pk_live_*` and `sk_live_*`)
- [ ] Redirect URLs configured in Clerk Dashboard
- [ ] CORS origins properly set
- [ ] Convex deployed to production environment
- [ ] Environment variables secured (not in git)
- [ ] HTTPS enabled on your domain
- [ ] JWT issuer domain matches your Clerk instance
- [ ] Test authentication flow end-to-end

## Testing Your Setup

1. **Clear browser data** (cookies, localStorage)
2. **Visit your production site**
3. **Test sign-up flow**
4. **Test sign-in flow** 
5. **Verify protected routes work**
6. **Check browser console for errors**

## Security Notes

- Never commit `.env*` files to git
- Use environment-specific configurations
- Production keys should only be used in production
- Monitor authentication errors in production logs
- Set up proper error reporting (Sentry is already configured)

## Common Issues & Solutions

### "Invalid JWT" Error
- Check JWT issuer domain matches your Clerk instance
- Verify production keys are being used

### "CORS Error"
- Add your domain to Clerk's allowed origins
- Check redirect URLs are properly configured

### "User Sync Failed"
- Check Convex deployment is in production mode
- Verify Convex auth configuration matches Clerk

## Need Help?
- Clerk Documentation: https://clerk.com/docs
- Convex Documentation: https://docs.convex.dev
- Check browser console and network tab for specific errors