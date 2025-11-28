# CUA → Scrapybara Migration Summary

**Migration Date:** 2025-11-28  
**Status:** ✅ Complete

## Overview

Successfully migrated from custom CUA client to official Scrapybara SDK with Vercel AI Gateway integration for all AI model calls.

## Changes Made

### 1. Package Installation
- ✅ Added `scrapybara@2.5.2` - Official Scrapybara TypeScript SDK
- ✅ Added `openai@6.9.1` - OpenAI SDK (already used by Vercel AI Gateway)

### 2. Code Changes

#### New Files
- `src/lib/scrapybara-client.ts` - Wrapper around Scrapybara SDK
- `tests/mocks/scrapybara-client.ts` - Test mocks for Scrapybara client

#### Deleted Files
- `src/lib/cua-client.ts` - Removed old custom CUA client
- `tests/mocks/cua-client.ts` - Removed old CUA mocks

#### Modified Files
- `src/inngest/council.ts` - Updated to use Scrapybara client + Vercel AI Gateway
- `src/app/agents/[jobId]/page.tsx` - Updated comments
- `CLAUDE.md` - Updated environment variable documentation
- `AGENTS.md` - Updated environment variable documentation
- `README.md` - Added Scrapybara setup section

### 3. API Changes

#### Scrapybara SDK API Pattern
```typescript
// Initialize client
const client = new ScrapybaraClient({ apiKey: SCRAPYBARA_API_KEY });

// Start instance
const instance = await client.startUbuntu({ timeoutHours: 1 });

// Get stream URL
const { streamUrl } = await instance.getStreamUrl();

// Run commands
const result = await instance.bash({ command: "echo 'hello'" });

// Stop instance
await instance.stop();
```

#### Vercel AI Gateway Integration
The `@inngest/agent-kit` `openai()` helper now routes through Vercel AI Gateway:
```typescript
model: openai({
  model: MODEL,
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
})
```

### 4. Environment Variables

**Updated:**
- `CUA_API_KEY` → `SCRAPYBARA_API_KEY`

**Existing (unchanged):**
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway authentication
- `AI_GATEWAY_BASE_URL` - Vercel AI Gateway endpoint

## Architecture Notes

### Instance Management
- Scrapybara instances are ephemeral (created per job, destroyed after completion)
- Instance objects are passed through Inngest `step.run()` context
- Only `sandboxId` (string ID) is persisted in Convex for reference
- Instance objects include: `id`, `status`, `launchTime`, plus API methods

### AI Gateway Routing
All AI model calls route through Vercel AI Gateway:
- `src/inngest/functions.ts` - Main agent functions (no changes needed)
- `src/inngest/council.ts` - Council network agents (updated to use `openai()` helper)

This provides centralized:
- Model routing and failover
- Rate limiting
- Usage monitoring
- Cost tracking

## Setup Instructions

### For New Environments

1. **Install Dependencies**
   ```bash
   bun install
   ```

2. **Set Environment Variables**
   ```bash
   # In .env or deployment environment
   SCRAPYBARA_API_KEY="your-scrapybara-api-key"
   AI_GATEWAY_API_KEY="your-ai-gateway-api-key"
   AI_GATEWAY_BASE_URL="https://ai-gateway.vercel.sh/v1"
   ```

3. **Get Scrapybara API Key**
   - Sign up at [Scrapybara Dashboard](https://scrapybara.com/dashboard)
   - API key is auto-generated on signup

### For Existing Environments

1. **Update Environment Variables**
   - Rename `CUA_API_KEY` to `SCRAPYBARA_API_KEY` in all deployment configs
   - Ensure `AI_GATEWAY_API_KEY` and `AI_GATEWAY_BASE_URL` are set

2. **Deploy Updated Code**
   ```bash
   git pull
   bun install
   # Deploy to Vercel or your hosting platform
   ```

## TypeScript Compilation

✅ All migration code compiles without errors
- `src/lib/scrapybara-client.ts` - No errors
- `src/inngest/council.ts` - No errors
- `tests/mocks/scrapybara-client.ts` - No errors

**Note:** Pre-existing TypeScript errors in `convex/backgroundJobs.ts` and `convex/councilDecisions.ts` are unrelated to this migration.

## Testing

### Manual Testing Checklist
- [ ] Create background job via UI
- [ ] Verify Scrapybara dashboard shows instance creation
- [ ] Check Inngest logs for successful execution
- [ ] Verify Vercel AI Gateway dashboard shows AI requests
- [ ] Confirm sandbox termination after job completion

### Automated Tests
- Test mocks updated in `tests/mocks/scrapybara-client.ts`
- Mock instance structure matches real Scrapybara SDK

## Breaking Changes

⚠️ **None** - This migration is backward compatible at the API level. The only user-facing change is updating the environment variable name.

## Rollback Plan

If issues arise:

1. **Revert Code**
   ```bash
   git revert <commit-hash>
   ```

2. **Restore Environment Variables**
   - Rename `SCRAPYBARA_API_KEY` back to `CUA_API_KEY`

3. **Restore Old Files** (if needed)
   ```bash
   git checkout <previous-commit> -- src/lib/cua-client.ts tests/mocks/cua-client.ts
   git checkout <previous-commit> -- src/inngest/council.ts
   ```

## Resources

- [Scrapybara Documentation](https://docs.scrapybara.com)
- [Scrapybara Act SDK](https://docs.scrapybara.com/act-sdk)
- [Vercel AI Gateway OpenAI Compatibility](https://vercel.com/docs/ai-gateway/openai-compat)
- [Scrapybara Python SDK](https://github.com/scrapybara/scrapybara-python)

## Future Enhancements

Consider these improvements:

1. **Use Scrapybara Act SDK** - Replace `@inngest/agent-kit` with Scrapybara's native agent framework for deeper integration
2. **Instance Pause/Resume** - Use Scrapybara's pause/resume for long-running sessions instead of ephemeral instances
3. **Auth States** - Implement browser auth state persistence for authenticated workflows
4. **Structured Outputs** - Leverage Scrapybara's structured output capabilities

## Migration Credits

- Specification: [2025-11-28-migrate-cua-to-scrapybara-with-vercel-ai-gateway-integration.md](/.factory/specs/2025-11-28-migrate-cua-to-scrapybara-with-vercel-ai-gateway-integration.md)
- Implementation Date: November 28, 2025
- Tools Used: Scrapybara SDK v2.5.2, OpenAI SDK v6.9.1
