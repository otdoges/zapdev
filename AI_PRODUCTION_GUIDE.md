# 🚀 AI Production Deployment Guide

This guide covers everything you need to know to deploy the AI functionality to production successfully.

## 📋 Pre-Deployment Checklist

Run the validation script to ensure everything is ready:

```bash
bun run validate:production
```

This will check:
- ✅ Environment configuration
- ✅ Required dependencies
- ✅ Code integrity
- ✅ Security vulnerabilities
- ✅ Build configuration

## 🔑 API Key Configuration

### Required API Keys

1. **Groq API Key** (Primary AI Provider)
   - Get from: https://console.groq.com/keys
   - Environment variable: `VITE_GROQ_API_KEY`
   - Format: `gsk_xxxxxxxxxxxx`

2. **Clerk API Keys** (Authentication)
   - Get from: https://dashboard.clerk.com
   - Production keys: `pk_live_xxx` and `sk_live_xxx`
   - Environment variables:
     - `VITE_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`

3. **Convex Deployment** (Database)
   - Deploy with: `npx convex deploy --prod`
   - Environment variable: `VITE_CONVEX_URL`

### Optional API Keys

1. **OpenRouter API Key** (Fallback AI Provider)
   - Get from: https://openrouter.ai/keys
   - Environment variable: `VITE_OPENROUTER_API_KEY`
   - Format: `sk-or-xxxxxxxxxxxx`

2. **E2B API Key** (Code Execution)
   - Get from: https://e2b.dev/docs/api-key
   - Environment variable: `VITE_E2B_API_KEY`
   - Format: `e2b_xxxxxxxxxxxx`

3. **Sentry DSN** (Error Monitoring)
   - Get from: https://sentry.io
   - Environment variable: `VITE_SENTRY_DSN`

4. **PostHog** (Analytics)
   - Get from: https://posthog.com
   - Environment variables:
     - `VITE_PUBLIC_POSTHOG_KEY`
     - `VITE_PUBLIC_POSTHOG_HOST`

## 🛡️ Production Security Features

### 1. API Key Security
- ✅ Client-side API keys are encrypted with AES-GCM
- ✅ Keys are validated before storage
- ✅ Production monitoring detects exposed keys
- ✅ Automatic security alerts via Sentry

### 2. Rate Limiting
- **Client-side**: Cost-based daily limits ($1.00/day default)
- **Server-side**: Request-based rate limiting
  - Free tier: 5 requests/minute
  - Pro tier: 30 requests/minute
  - Enterprise: 100 requests/minute

### 3. Input Validation
- Maximum message length: 50,000 characters
- XSS protection via SafeText component
- Malicious pattern detection
- SQL injection prevention

## 📊 Monitoring & Observability

### Real-time Metrics
The AI monitoring system tracks:
- Request success/failure rates
- Response times (P50, P95, P99)
- Token usage and costs
- Error patterns and types
- Circuit breaker status

### Alerts
Critical alerts are sent for:
- 🚨 API quota exceeded
- 🚨 Daily cost limit reached (80% threshold)
- 🚨 Circuit breaker opened
- 🚨 Health score below 50%

### Dashboard Access
Monitor AI performance at:
- Sentry: Real-time errors and performance
- PostHog: User analytics and feature usage
- Convex Dashboard: Database metrics

## 🔄 Failover & Reliability

### 1. Retry Logic
- Exponential backoff with jitter
- Maximum 3 retries by default
- Only retries on transient errors

### 2. Circuit Breaker
- Opens after 5 consecutive failures
- Auto-resets after 60 seconds
- Prevents cascade failures

### 3. Provider Fallback
- Primary: Groq (openai/gpt-oss-20b)
- Fallback: OpenRouter (qwen/qwen3-coder:free)
- Automatic failover on errors

### 4. Response Caching
- 5-minute TTL by default
- Maximum 100 cached responses
- Reduces costs and latency

## 🚀 Deployment Steps

### 1. Environment Setup

Create `.env.production`:
```bash
# Required
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
VITE_CONVEX_URL=https://xxx.convex.cloud
VITE_GROQ_API_KEY=gsk_xxx

# Recommended
VITE_OPENROUTER_API_KEY=sk-or-xxx
VITE_E2B_API_KEY=e2b_xxx
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_PUBLIC_POSTHOG_KEY=phc_xxx
VITE_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 2. Build for Production

```bash
# Install dependencies
bun install

# Run validation
bun run validate:production

# Build optimized bundle
bun run build

# Preview locally
bun run preview
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_GROQ_API_KEY production
# ... repeat for all variables
```

### 4. Post-Deployment Verification

1. **Test Authentication**
   - Sign up with new account
   - Sign in/out flow
   - Protected routes

2. **Test AI Functionality**
   - Send test message
   - Verify response generation
   - Check cost tracking

3. **Test Error Handling**
   - Invalid API key
   - Rate limit exceeded
   - Network failures

4. **Monitor Initial Traffic**
   - Check Sentry for errors
   - Review AI metrics
   - Verify cost tracking

## 📈 Performance Optimization

### 1. Bundle Size
- Lazy load AI components
- Use dynamic imports for heavy dependencies
- Enable Vite's build optimizations

### 2. Response Times
- Cache frequently used prompts
- Use streaming for long responses
- Implement request batching

### 3. Cost Optimization
- Monitor daily usage
- Implement user-specific limits
- Use caching aggressively
- Consider prompt optimization

## 🐛 Troubleshooting

### Common Issues

1. **"No API key configured" Error**
   - Verify environment variables are set
   - Check for typos in variable names
   - Ensure no trailing spaces in keys

2. **Rate Limit Errors**
   - Check user's subscription tier
   - Review rate limit configuration
   - Monitor usage patterns

3. **High Latency**
   - Check circuit breaker status
   - Review Sentry performance data
   - Verify caching is working

4. **Cost Overruns**
   - Review daily cost reports
   - Check for infinite loops
   - Implement stricter limits

### Debug Mode

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('AI_DEBUG', 'true');
```

### Support Contacts

- **Technical Issues**: Check Sentry dashboard
- **API Keys**: Contact respective providers
- **Billing**: Review Clerk/Stripe dashboard

## 🔒 Security Best Practices

1. **Regular Key Rotation**
   - Rotate API keys monthly
   - Use separate keys for staging/production
   - Monitor key usage

2. **Access Control**
   - Implement role-based access
   - Audit AI usage regularly
   - Monitor suspicious patterns

3. **Data Privacy**
   - Don't log sensitive prompts
   - Implement data retention policies
   - Comply with GDPR/CCPA

## 📚 Additional Resources

- [Groq Documentation](https://console.groq.com/docs)
- [OpenRouter Docs](https://openrouter.ai/docs)
- [E2B Documentation](https://e2b.dev/docs)
- [Convex Security](https://docs.convex.dev/production/security)
- [Clerk Production](https://clerk.com/docs/deployments/overview)

## 🎯 Performance Targets

- **Response Time**: < 3s for 95% of requests
- **Availability**: 99.9% uptime
- **Error Rate**: < 1% of requests
- **Cost Efficiency**: < $0.001 per request average

## 🔄 Maintenance Schedule

- **Daily**: Monitor costs and errors
- **Weekly**: Review performance metrics
- **Monthly**: Rotate API keys, review usage
- **Quarterly**: Security audit, dependency updates

---

**Last Updated**: November 2024
**Version**: 1.0.0