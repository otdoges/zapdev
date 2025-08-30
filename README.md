# Zapdev

An advanced AI-powered development platform inspired by scout.new, featuring intelligent code generation, web search integration, and seamless chat-based development workflows.

## ✨ Features

### 🎯 Scout.new-Inspired Features
- **AI Agent Modes**: Fast AF (speed-first) and Max Vibes (deep reasoning)
- **Jam Templates**: Research, Create, Plan, Analyze, and Learn workflows
- **Autonomous Execution**: AI planning with smart task breakdown
- **Virtual Environment**: Simulated sandbox development environment

### 🔍 Web Search Integration
- **Brave Search API**: Fast, private web search powered by Brave's independent index
- **Smart Search Results**: Click to add results to AI context
- **Real-time Research**: Seamless integration with development workflow

### 🔐 Modern Authentication
- **Clerk Integration**: Secure, modern authentication system
- **User Management**: Complete user profiles and preferences
- **Session Management**: Secure, scalable authentication

### 💬 Advanced Chat System
- **Convex Backend**: Real-time database with persistent chat history
- **Multi-Chat Support**: Create, manage, and switch between multiple conversations
- **AI Integration**: Seamless AI responses with context preservation
- **Search & Archive**: Find and organize your development conversations

### 🛠 Development Tools
- **Live Code Generation**: Real-time AI-powered code creation
- **File Management**: Intelligent file structure and editing
- **Package Detection**: Automatic dependency management
- **Preview & Testing**: Instant preview with hot reloading

<img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZtaHFleGRsMTNlaWNydGdianI4NGQ4dHhyZjB0d2VkcjRyeXBucCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZFVLWMa6dVskQX0qu1/giphy.gif" alt="Zapdev Demo" width="100%"/>



## Setup

1. **Clone & Install**
```bash
git clone https://github.com/otdoges/zapdev.git
cd zapdev
bun install
```

2. **Add `.env.local`**
```env
# Required
E2B_API_KEY=your_e2b_api_key  # Get from https://e2b.dev (Sandboxes)
FIRECRAWL_API_KEY=your_firecrawl_api_key  # Get from https://firecrawl.dev (Web scraping)

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key  # Get from https://clerk.com
CLERK_SECRET_KEY=your_clerk_secret_key  # Get from https://clerk.com
# Note: For production, use keys starting with pk_live_ and sk_live_
# For development, use keys starting with pk_test_ and sk_test_

# Backend Database
NEXT_PUBLIC_CONVEX_URL=your_convex_url  # Get from https://convex.dev
CONVEX_DEPLOY_KEY=your_convex_deploy_key  # Get from https://convex.dev

# Web Search
BRAVE_API_KEY=your_brave_api_key  # Get from https://brave.com/search/api/

# Optional (need at least one AI provider)
ANTHROPIC_API_KEY=your_anthropic_api_key  # Get from https://console.anthropic.com
OPENAI_API_KEY=your_openai_api_key  # Get from https://platform.openai.com (GPT-5)
GEMINI_API_KEY=your_gemini_api_key  # Get from https://aistudio.google.com/app/apikey
GROQ_API_KEY=your_groq_api_key  # Get from https://console.groq.com (Fast inference - Kimi K2 recommended)

# Payment Processing - Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key  # Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=your_stripe_secret_key  # Get from https://dashboard.stripe.com/apikeys
STRIPE_WEBHOOK_SECRET=your_webhook_secret  # Get from Stripe Dashboard > Webhooks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run**
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🚀 Usage

### Getting Started
1. **Sign up/Sign in** using the authentication button in the top right
2. **Choose your AI mode**: Fast AF for quick responses, Max Vibes for deep thinking
3. **Select a template**: Use Research, Create, Plan, Analyze, or Learn workflows
4. **Start building**: Chat with AI to generate and modify your applications

### Using Web Search
1. Click the **Search** tab in the main interface
2. Search the web using Brave's search engine
3. Click on results to add them to your AI context
4. Use the information in your development conversations

### Managing Chats
1. Click the **Chats** tab to access your conversation history
2. Create new chats for different projects
3. Switch between conversations seamlessly
4. All chats are automatically saved and synced

### Development Workflow
1. **Generate**: Describe what you want to build
2. **Preview**: See live updates in the preview pane
3. **Iterate**: Refine and improve with AI assistance  
4. **Deploy**: Export or deploy your completed application

## 🔧 Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Run tests
bun run test
```

## 📚 Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Authentication**: Clerk
- **Database**: Convex (real-time)
- **Search**: Brave Search API
- **Styling**: TailwindCSS v4
- **AI**: Multiple providers (OpenAI, Anthropic, Gemini, Groq)
- **Deployment**: E2B Sandboxes
- **Animation**: Framer Motion

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [scout.new](https://scout.new) - AI agent with autonomous execution
- Built on [open-lovable](https://github.com/firecrawl/open-lovable) foundation
- Powered by [Firecrawl](https://firecrawl.dev) for web scraping capabilities
