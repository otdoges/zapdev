# ZapDev - AI Development Team Platform

A Next.js application featuring collaborative AI-powered development with WebContainers integration.

## 🚀 Features

### AI Development Team
- **System Architect**: Analyzes requirements and designs project architecture
- **Frontend Developer**: Creates UI components with React, TypeScript, and Tailwind CSS
- **Backend Developer**: Builds APIs and server logic when needed
- **DevOps Engineer**: Handles build configuration and deployment setup

### WebContainers Integration
- Real-time development environment in the browser
- Full Node.js environment with pnpm package management
- Live preview of generated applications
- Terminal access for debugging and monitoring

### Core Features
- Authentication system with Better Auth
- Real-time chat interface
- Stripe payment integration
- Convex database backend
- Modern UI with Tailwind CSS and Framer Motion

## 🛠 Tech Stack

- **Framework**: Next.js 15 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Convex
- **Authentication**: Better Auth
- **Payments**: Stripe
- **Package Manager**: Bun
- **AI Integration**: OpenAI GPT-4 and GPT-4o-mini
- **WebContainers**: @webcontainer/api for browser-based development

## 🎯 AI Team Workflow

1. **User Input**: Describe what you want to build
2. **Analysis**: System Architect analyzes requirements
3. **Architecture**: Design project structure and dependencies
4. **Frontend**: Create React components and UI
5. **Backend**: Build APIs if needed
6. **Deployment**: Configure build tools and development environment
7. **Live Preview**: See your application running in real-time

## 🔧 Installation

```bash
# Clone the repository
git clone <https://www.github.com/otdoges/zapdev.git>
cd zapdev

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Fill in your API keys and configuration

# Run the development server
bun dev
```

## 📝 Environment Variables

Create a `.env.local` file with:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Convex
CONVEX_DEPLOYMENT=your_convex_deployment
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# Better Auth
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# Polar
POLAR_ACCESS_TOKEN=your_polar_access_token
```

## 🚀 Usage

### AI Team Development

1. Navigate to `/ai-team`
2. Describe your project requirements
3. Watch as AI agents collaborate to build your application
4. See live preview with WebContainers
5. Download or deploy the generated code

### Example Prompts

- "Build a modern todo app with React and TypeScript. I want drag-and-drop functionality, categories, and dark mode support."
- "Create a dashboard with charts and data visualization using React and Tailwind CSS."
- "Build a simple API with Express that handles user authentication and data management."

## 🏗 Project Structure

```
zapdev/
├── app/                    # Next.js app router
│   ├── ai-team/           # AI team development page
│   ├── api/               # API routes
│   └── chat/              # Chat interface
├── components/            # React components
│   ├── web-container.tsx  # WebContainers integration
│   └── ai-team-coordinator.tsx # AI team coordination
├── lib/                   # Utilities and configurations
└── convex/               # Database schema and functions
```

## 🔄 AI Team API

The AI team coordination happens through `/api/ai-team/coordinate`:

```typescript
POST /api/ai-team/coordinate
{
  "userRequest": "Build a todo app",
  "step": "analyze" | "architect" | "frontend" | "backend" | "deploy"
}
```

Each step returns structured data for the next phase of development.

## 🌐 WebContainers Features

- **Full Node.js Environment**: Complete runtime in the browser
- **Package Management**: pnpm support with fallback to npm
- **Live Reload**: Instant updates as code changes
- **Terminal Access**: Real-time command execution and output
- **File System**: Complete project file management

## 📱 Routes

- `/` - Landing page
- `/auth` - Authentication
- `/chat` - Chat interface
- `/ai-team` - AI development team
- `/pricing` - Pricing plans

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [WebContainers Documentation](https://webcontainers.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev/)
- [Better Auth Documentation](https://better-auth.com/)

---

Built with ❤️ using AI collaboration and modern web technologies.
