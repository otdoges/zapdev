# ZapDev - AI Development Team Platform

A Next.js application featuring collaborative AI-powered development with WebContainers integration and modern authentication.

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

### Authentication System
- **GitHub OAuth**: One-click sign-in with GitHub
- **Email & Password**: Traditional email/password authentication
- **Password Recovery**: Secure password reset functionality
- **Email Verification**: Confirmation emails for new accounts
- **Secure Sessions**: JWT-based authentication with Supabase

### Core Features
- Dual authentication system (GitHub OAuth + Email/Password)
- Real-time chat interface powered by AI
- Stripe payment integration for premium features
- Supabase backend with PostgreSQL
- Modern UI with Tailwind CSS and Framer Motion
- Responsive design optimized for all devices

## 🛠 Tech Stack

- **Framework**: Next.js 15 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with GitHub OAuth & Email/Password
- **Payments**: Stripe
- **Package Manager**: Bun
- **AI Integration**: OpenAI GPT-4 and GPT-4o-mini
- **WebContainers**: @webcontainer/api for browser-based development
- **Real-time**: Supabase Realtime for live updates

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
git clone https://github.com/otdoges/zapdev.git
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

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Polar (optional)
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_SERVER=sandbox # or production
```

## 🔐 Authentication Setup

### Supabase Configuration

1. **Create a Supabase Project**
   ```bash
   # Visit https://supabase.com/dashboard
   # Create a new project
   # Copy your project URL and anon key
   ```

2. **Database Schema**
   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     email TEXT,
     full_name TEXT,
     avatar_url TEXT,
     stripe_customer_id TEXT,
     stripe_subscription_id TEXT,
     subscription_plan TEXT DEFAULT 'free',
     subscription_active BOOLEAN DEFAULT false,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Chats table
   CREATE TABLE chats (
     id TEXT PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     title TEXT DEFAULT 'New Chat',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Messages table
   CREATE TABLE messages (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     chat_id TEXT REFERENCES chats(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **Enable GitHub OAuth**
   - Go to Authentication > Providers in your Supabase dashboard
   - Enable GitHub provider
   - Add your GitHub OAuth app credentials
   - Set callback URL: `https://your-domain.com/auth/callback`

4. **Row Level Security (RLS)**
   ```sql
   -- Enable RLS
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = auth_user_id);
   CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = auth_user_id);
   CREATE POLICY "Users can view own chats" ON chats FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
   CREATE POLICY "Users can view own messages" ON messages FOR ALL USING (chat_id IN (SELECT id FROM chats WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())));
   ```

## 🚀 Usage

### Authentication

1. **Sign Up/Sign In**
   - Visit `/auth` 
   - Choose GitHub OAuth or Email/Password
   - For email signup, check your email for verification

2. **Password Recovery**
   - Use "Forgot Password" on sign-in form
   - Check email for reset instructions

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
│   ├── auth/              # Authentication pages & callbacks
│   └── chat/              # Chat interface
├── components/            # React components
│   ├── web-container.tsx  # WebContainers integration
│   ├── ai-team-coordinator.tsx # AI team coordination
│   ├── SupabaseProvider.tsx # Authentication provider
│   └── auth-buttons.tsx   # Authentication UI components
├── lib/                   # Utilities and configurations
│   ├── supabase.ts        # Supabase client configuration
│   ├── supabase-server.ts # Server-side Supabase client
│   ├── supabase-operations.ts # Database operations
│   └── stripe.ts          # Stripe configuration
└── middleware.ts          # Auth middleware
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

- `/` - Landing page with hero section
- `/auth` - Authentication (GitHub OAuth + Email/Password)
- `/auth/callback` - OAuth callback handler
- `/chat` - AI chat interface
- `/chat/[id]` - Individual chat sessions
- `/ai-team` - AI development team
- `/pricing` - Subscription plans
- `/success` - Payment success page

## 🔧 Development Commands

```bash
# Development
bun dev                 # Start development server
bun build              # Build for production
bun start              # Start production server

# Database
bun db:generate        # Generate database types
bun db:push            # Push schema changes
bun db:studio          # Open database studio

# Linting & Formatting
bun lint               # Run ESLint
bun format             # Format with Prettier
```

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure session management
- **Email Verification**: Confirmed email addresses
- **Password Hashing**: Secure password storage
- **CSRF Protection**: Cross-site request forgery prevention
- **Environment Variables**: Secure configuration management

## 💳 Stripe Integration

- **Subscription Management**: Handle recurring payments
- **Webhook Processing**: Real-time payment updates
- **Customer Portal**: Self-service billing management
- **Multiple Plans**: Basic, Pro, and Enterprise tiers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [Supabase Documentation](https://supabase.com/docs)
- [WebContainers Documentation](https://webcontainers.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Stripe Documentation](https://stripe.com/docs)

---

Built with ❤️ using AI collaboration, modern web technologies, and secure authentication.
