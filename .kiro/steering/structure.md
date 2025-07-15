# Project Structure

## Root Directory
```
├── src/                    # Source code
├── public/                 # Static assets
├── .kiro/                  # Kiro configuration and steering
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── components.json        # shadcn/ui configuration
└── tsconfig.json          # TypeScript configuration
```

## Source Structure (`src/`)
```
src/
├── components/            # React components
│   ├── ui/               # shadcn/ui components (auto-generated)
│   ├── features/         # Feature-specific components
│   ├── pricing/          # Pricing-related components
│   └── *.tsx             # Shared/common components
├── pages/                # Route components
│   ├── Index.tsx         # Landing page
│   ├── Auth.tsx          # Authentication page
│   └── Chat.tsx          # Chat interface
├── lib/                  # Utility libraries
│   ├── utils.ts          # General utilities
│   ├── supabase.ts       # Supabase client
│   ├── groq.ts           # Groq AI client
│   ├── ai.ts             # AI utilities
│   └── system-prompt.ts  # AI system prompts
├── hooks/                # Custom React hooks
├── config/               # Configuration files
├── App.tsx               # Main app component
├── main.tsx              # App entry point
└── index.css             # Global styles
```

## Architecture Patterns

### Component Organization
- **UI Components**: Auto-generated shadcn/ui components in `components/ui/`
- **Feature Components**: Domain-specific components in `components/features/`
- **Page Components**: Route-level components in `pages/`
- **Shared Components**: Common components directly in `components/`

### Import Conventions
- Use `@/` alias for all internal imports
- Import UI components from `@/components/ui/`
- Import utilities from `@/lib/utils`
- Import hooks from `@/hooks/`

### File Naming
- React components: PascalCase (e.g., `AuthGuard.tsx`)
- Utilities and hooks: camelCase (e.g., `useAuth.ts`)
- Configuration files: kebab-case (e.g., `system-prompt.ts`)

### Route Structure
- `/` - Landing page (Index.tsx)
- `/auth` - Authentication page
- `/chat` - Protected chat interface (requires AuthGuard)

### State Management
- Use TanStack Query for server state
- Use React Hook Form for form state
- Use custom hooks for shared logic
- Keep component state local when possible