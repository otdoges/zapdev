# AI Implementation Setup Guide

This guide will help you fix the failing AI tests by properly configuring your environment.

## Quick Fix Summary

The test failures are due to missing API keys. Here's how to fix them:

1. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Get required API keys**:
   - **Groq API Key**: Visit [https://console.groq.com/keys](https://console.groq.com/keys)
   - **OpenRouter API Key** (Optional - failsafe): Visit [https://openrouter.ai/dashboard](https://openrouter.ai/dashboard)
   - **E2B API Key**: Visit [https://e2b.dev/docs/api-key](https://e2b.dev/docs/api-key)

3. **Add keys to `.env.local`**:
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   VITE_E2B_API_KEY=your_e2b_api_key_here
   ```

4. **Restart your development server**:
   ```bash
   bun dev
   ```

5. **Run tests again**:
   ```bash
   cd src && bun test-ai-implementation.ts
   ```

## Detailed Setup Instructions

### 1. Groq API Key (Required for AI responses)

Groq provides fast inference for the **Kimi K2 Instruct** model (`moonshotai/kimi-k2-instruct`).

**Getting your Groq API Key:**
1. Visit [Groq Console](https://console.groq.com)
2. Sign up or log in
3. Go to [API Keys](https://console.groq.com/keys)
4. Click "Create API Key"
5. Copy the key (starts with `gsk_`)

**Add to `.env.local`:**
```env
VITE_GROQ_API_KEY=gsk_your_actual_key_here
```

### 1.5. OpenRouter API Key (OPTIONAL - Failsafe Provider)

OpenRouter serves as a backup when Groq fails, using the free **Kimi K2** model (`moonshotai/kimi-k2:free`).

**Getting your OpenRouter API Key:**
1. Visit [OpenRouter Dashboard](https://openrouter.ai/dashboard)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-or-`)

**Add to `.env.local`:**
```env
VITE_OPENROUTER_API_KEY=sk-or-your_actual_key_here
```

**Benefits:**
- **Free Tier**: The Kimi K2 free model costs $0 per token
- **High Quality**: Same excellent model as Groq for coding and reasoning
- **32K Context**: Supports up to 32,768 tokens
- **Automatic Failover**: Seamlessly switches when Groq encounters errors

### 2. E2B API Key (Required for code execution)

E2B provides secure sandboxed environments for running Python and JavaScript code.

**Getting your E2B API Key:**
1. Visit [E2B Dashboard](https://e2b.dev)
2. Sign up or log in
3. Go to [API Keys](https://e2b.dev/dashboard)
4. Create a new API key
5. Copy the key (starts with `e2b_`)

**Add to `.env.local`:**
```env
VITE_E2B_API_KEY=e2b_your_actual_key_here
```

### 3. Complete Environment Configuration

Your final `.env.local` should look like this:

```env
# AI Configuration - Required for tests to pass
VITE_GROQ_API_KEY=gsk_your_actual_groq_key_here

# OpenRouter Configuration - Optional failsafe
VITE_OPENROUTER_API_KEY=sk-or-your_actual_openrouter_key_here

# Sandbox Configuration - Required for code execution tests  
VITE_E2B_API_KEY=e2b_your_actual_e2b_key_here

# Other configurations (optional for basic AI tests)
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
# ... other optional keys
```

## What Each Test Does

| Test | Purpose | Requires |
|------|---------|----------|
| AI Configuration | Checks if API keys are set | Environment setup |
| Simple AI Response | Tests basic AI text generation | Groq API key |
| Streaming AI Response | Tests real-time AI streaming | Groq API key |
| Code Generation | Tests AI's ability to write code | Groq API key |
| Sandbox Initialization | Tests code execution environment | E2B API key |
| Python Code Execution | Tests running Python code safely | E2B API key |
| JavaScript Code Execution | Tests running JS code safely | E2B API key |
| Error Handling | Tests how errors are managed | E2B API key |
| Input Security | Tests security and validation | Groq API key |
| Performance | Tests concurrent requests | Groq API key |
| Full Chat Flow | Tests complete AI + code workflow | Both API keys |
| Cleanup | Tests resource management | E2B API key |

## Troubleshooting

### "Invalid API Key" Errors
- Double-check your Groq API key is correct
- Make sure it starts with `gsk_`
- Verify you copied the full key without extra spaces

### "401: Invalid API key" for E2B
- Verify your E2B API key is correct  
- Make sure it starts with `e2b_`
- Check you have sufficient credits in your E2B account

### Environment Variables Not Loading
- Restart your development server after adding keys
- Make sure your file is named `.env.local` (not `.env.local.txt`)
- Verify the file is in the project root directory

### Rate Limiting
- Groq has rate limits - if tests fail due to rate limiting, wait a moment and retry
- E2B has usage limits on free tiers

## Cost Information

### Groq Pricing (as of current rates)
- **Input**: $1.00 per 1M tokens
- **Output**: $3.00 per 333,333 tokens  
- The test suite uses minimal tokens (~$0.01 total)

### E2B Pricing
- Free tier includes 100 hours of sandbox usage per month
- Test suite uses ~1-2 minutes total

## Security Notes

- Never commit `.env.local` to version control
- The `.env.local` file is already in `.gitignore`
- API keys should be kept secret
- Use different keys for development and production

## Support

If you continue having issues:

1. **Check API key validity**: Test your keys directly in the respective platforms
2. **Verify account status**: Ensure your accounts are active and have credits
3. **Review logs**: The test suite provides detailed error messages
4. **Restart everything**: Sometimes a full restart helps with environment variable loading

## Next Steps

Once all tests pass:
1. Your AI implementation is working correctly
2. You can start building AI-powered features
3. Code execution in sandboxes is functioning
4. The security and error handling is operational

The test suite validates that your ZapDev installation can:
- Generate AI responses using the Kimi K2 Instruct model
- Execute user code safely in isolated environments  
- Handle errors gracefully
- Maintain security best practices 