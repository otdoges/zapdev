# Rate Limiting Setup Guide

Quick guide to set up Upstash Redis for rate limiting in ZapDev.

## 🚀 5-Minute Setup

### Step 1: Create Upstash Account

1. Go to https://upstash.com
2. Sign up (free tier available)
3. Verify your email

### Step 2: Create Redis Database

1. Click **"Create Database"**
2. Choose:
   - **Name**: zapdev-rate-limiting (or any name)
   - **Type**: Regional (cheaper) or Global (lower latency worldwide)
   - **Region**: Choose closest to your users
   - **Primary Region**: Select one closest to your deployment
3. Click **"Create"**

### Step 3: Get REST API Credentials

1. After database is created, click on it
2. Click **"REST API"** tab (or scroll down to REST API section)
3. You'll see two values:
   ```
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXX1AAIjcEXXX...
   ```

### Step 4: Add to Environment Variables

**For Local Development:**

Add to `.env.local`:
```env
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX1AAIjcEXXX...
```

**For Production (Vercel):**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add both variables:
   - `UPSTASH_REDIS_REST_URL` = `https://your-db.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` = `AXX1AAIjcEXXX...`
3. Select all environments (Production, Preview, Development)
4. Click **"Save"**

**For Production (Other Platforms):**

Add the environment variables through your platform's dashboard or CLI.

### Step 5: Test It Works

1. Restart your dev server:
   ```bash
   bun run dev
   ```

2. Test rate limiting by making multiple sign-in attempts:
   ```bash
   # In another terminal, make 11 rapid requests (limit is 10/min)
   for i in {1..11}; do
     curl -X POST http://localhost:3000/api/auth/sign-in \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"wrong"}' \
       -w "\nStatus: %{http_code}\n"
   done
   ```

3. The 11th request should return `429 Too Many Requests`

---

## 📊 Rate Limiting Configuration

### Current Limits

**Standard Auth Endpoints** (`/api/auth/*`):
- **Limit**: 10 requests per minute per IP
- **Window**: Sliding 1 minute
- **Applies to**: Sign in, sign up, session refresh

**Sensitive Operations** (`/api/resend-verification`):
- **Limit**: 3 requests per 5 minutes per IP
- **Window**: Sliding 5 minutes
- **Applies to**: Resend verification email

### Adjusting Limits

Edit `src/lib/rate-limit.ts`:

```typescript
// Change from 10 req/min to 20 req/min
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"), // Changed from 10
  analytics: true,
  prefix: "@zapdev/auth",
});

// Change from 3 req/5min to 5 req/10min
export const sensitiveAuthRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"), // Changed from 3, "5 m"
  analytics: true,
  prefix: "@zapdev/sensitive-auth",
});
```

---

## 🔍 Monitoring

### Upstash Dashboard

1. Go to your Upstash dashboard
2. Click on your database
3. View:
   - **Commands**: See rate limit checks
   - **Data Browser**: View rate limit keys (prefixed with `@zapdev/auth:`)
   - **Metrics**: Request count, latency

### Rate Limit Analytics

Upstash automatically tracks:
- Total requests
- Blocked requests (429s)
- Success rate
- Peak usage times

View in: Database Dashboard → Analytics tab

### Custom Monitoring

Add logging to track rate limit hits:

```typescript
// In src/lib/rate-limit.ts, update checkRateLimit:
if (!success) {
  console.warn("Rate limit exceeded", {
    ip,
    limit,
    remaining,
    reset: new Date(reset).toISOString(),
  });
  
  // Optional: Send to Sentry
  // Sentry.captureMessage("Rate limit exceeded", { level: "warning", extra: { ip } });
  
  return { /* ... */ };
}
```

---

## 💰 Pricing

### Upstash Free Tier
- **10,000 commands/day**
- Perfect for development and small apps
- No credit card required

### Paid Plans
- **Pay-as-you-go**: $0.2 per 100K requests
- **Fixed**: Starting at $10/month for 1M requests
- See: https://upstash.com/pricing

### Estimating Costs

**Example calculation:**
- 1,000 users/day
- Average 5 auth requests per user
- 5,000 requests/day = 150,000 requests/month
- Free tier: ✅ Covered (10K/day × 30 = 300K/month)

**When you'll need paid:**
- >10,000 auth requests per day
- >300,000 auth requests per month
- High-traffic applications

---

## 🐛 Troubleshooting

### Error: "Failed to connect to Redis"

**Check:**
1. Environment variables are set correctly
2. No typos in variable names (must be `UPSTASH_REDIS_REST_URL` not `UPSTASH_REDIS_URL`)
3. Token includes full value (usually very long, 200+ characters)
4. Redis database is active in Upstash dashboard

**Fix:**
```bash
# Verify env vars are loaded
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# If empty, check .env.local exists and restart dev server
```

### Error: "Rate limit not working"

**Check:**
1. Redis client initializes: `Redis.fromEnv()` should not throw
2. Requests are POST (GET is not rate limited)
3. Test with correct endpoint: `/api/auth/sign-in` or similar

**Debug:**
```typescript
// Add to src/lib/rate-limit.ts
console.log("Checking rate limit for IP:", ip);
console.log("Rate limit result:", { success, limit, remaining, reset });
```

### Rate Limit Too Aggressive

**Symptoms:**
- Legitimate users getting blocked
- 429 errors in production

**Solutions:**
1. Increase limits (see "Adjusting Limits" above)
2. Whitelist IPs if needed
3. Use longer windows (e.g., 1 hour instead of 1 minute)

### Rate Limit Too Loose

**Symptoms:**
- Bots still attacking
- Abuse patterns in logs

**Solutions:**
1. Decrease limits
2. Add CAPTCHA for repeated failures
3. Block IPs temporarily after multiple violations

---

## 🔒 Security Best Practices

### IP Extraction
Current implementation extracts IP from:
1. `x-forwarded-for` header (primary)
2. `x-real-ip` header (fallback)
3. "unknown" (last resort)

**Important:** Ensure your proxy/CDN sets these headers correctly.

### Rate Limit Bypass Prevention
- Don't show exact limits to users (prevents gaming)
- Use sliding windows (harder to circumvent than fixed windows)
- Log violations for abuse pattern detection
- Consider adding CAPTCHA after N failures

### Production Checklist
- [ ] Upstash database created
- [ ] Environment variables set in production
- [ ] Tested rate limiting works
- [ ] Monitoring/alerts configured
- [ ] Limits appropriate for traffic
- [ ] Abuse patterns reviewed weekly

---

## 📚 Additional Resources

- **Upstash Docs**: https://upstash.com/docs/redis
- **Rate Limit Docs**: https://upstash.com/docs/redis/features/ratelimiting
- **Upstash GitHub**: https://github.com/upstash/ratelimit

---

**Last Updated**: November 11, 2025
**Estimated Setup Time**: 5-10 minutes
**Status**: ✅ Ready for production use
