# ZapDev

Chat with AI to build React apps instantly. ZapDev automatically detects your API keys and intelligently routes URLs vs search terms to provide the most seamless development experience.

## ⚡ Key Features

- **🤖 Smart Model Detection**: Automatically selects the best AI model based on your available API keys
- **🔗 Intelligent URL Routing**: Detects URLs (.com, .org, etc.) and routes them directly without manual selection
- **🛠️ Auto-Linting**: Built-in ESLint integration that automatically fixes code issues before presenting results
- **⚡ Streamlined UX**: No manual model selection - just enter URLs or search terms and go!
- **🚀 Bun-Powered**: Uses Bun for lightning-fast package management and development

<img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZtaHFleGRsMTNlaWNydGdianI4NGQ4dHhyZjB0d2VkcjRyeXBucCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZFVLWMa6dVskQX0qu1/giphy.gif" alt="ZapDev Demo" width="100%"/>

## Setup

1. **Clone & Install**
```bash
git clone https://github.com/your-username/zapdev.git
cd zapdev
bun install  # ZapDev uses Bun for faster package management
```

2. **Add `.env.local`**

```env
# =================================================================
# REQUIRED
# =================================================================
FIRECRAWL_API_KEY=your_firecrawl_api_key    # https://firecrawl.dev

# =================================================================
# AI PROVIDER - Choose your LLM
# =================================================================
ANTHROPIC_API_KEY=your_anthropic_api_key  # https://console.anthropic.com
OPENAI_API_KEY=your_openai_api_key        # https://platform.openai.com
GEMINI_API_KEY=your_gemini_api_key        # https://aistudio.google.com/app/apikey
GROQ_API_KEY=your_groq_api_key            # https://console.groq.com

# =================================================================
# SANDBOX PROVIDER - Choose ONE: Vercel (default) or E2B
# =================================================================
SANDBOX_PROVIDER=vercel  # or 'e2b'

# Option 1: Vercel Sandbox (default)
# Choose one authentication method:

# Method A: OIDC Token (recommended for development)
# Run `vercel link` then `vercel env pull` to get VERCEL_OIDC_TOKEN automatically
VERCEL_OIDC_TOKEN=auto_generated_by_vercel_env_pull

# Method B: Personal Access Token (for production or when OIDC unavailable)
# VERCEL_TEAM_ID=team_xxxxxxxxx      # Your Vercel team ID 
# VERCEL_PROJECT_ID=prj_xxxxxxxxx    # Your Vercel project ID
# VERCEL_TOKEN=vercel_xxxxxxxxxxxx   # Personal access token from Vercel dashboard

# Option 2: E2B Sandbox
# E2B_API_KEY=your_e2b_api_key      # https://e2b.dev
```

3. **Run**
```bash
bun dev  # Start ZapDev development server
```

Open [http://localhost:3000](http://localhost:3000)

## License
MIT 


## Credit.

Shoutout to firecrawl and the contribuers. We are building on their base.  [https://github.com/firecrawl/open-lovable.git]
