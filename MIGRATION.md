# Migration from Supabase to Convex + WorkOS + TRPC

This document outlines the migration from Supabase to a modern stack using Convex for the database, WorkOS for authentication, and TRPC for the API layer.

## Required Environment Variables

Create a `.env.local` file with the following variables:

```env
# Convex
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# WorkOS Authentication
VITE_WORKOS_API_KEY=sk_xxx
VITE_WORKOS_CLIENT_ID=client_xxx
VITE_WORKOS_DOMAIN=your-domain.workos.com

# Groq API (keep for AI functionality)
VITE_GROQ_API_KEY=your_groq_api_key_here
```

## Setup Instructions

### 1. Convex Setup
```bash
# Initialize Convex (if not already done)
npx convex dev

# Deploy schema and functions
npx convex deploy
```

### 2. WorkOS Setup
1. Sign up at [WorkOS](https://workos.com)
2. Create a new organization and application
3. Configure your redirect URI: `http://localhost:5173/auth/callback` (for development)
4. Copy your API key, Client ID, and domain to your `.env.local` file

### 3. Database Migration
The Convex schema has been created to mirror the PostgreSQL tables:
- `users` - User profiles
- `chats` - Chat conversations  
- `messages` - Chat messages
- `aiModels` - AI model configurations
- `userPreferences` - User settings
- `apiUsage` - Usage tracking

### 4. Initialize Default Data
Run the following mutation to set up default AI models:
```typescript
// In Convex dashboard or using a script
await convex.mutation(api.aiModels.initializeDefaultModels)();
```

## Architecture Changes

### Authentication Flow
- **Before**: Supabase Auth with email/password and GitHub OAuth
- **After**: WorkOS SSO with enterprise-grade authentication

### Database
- **Before**: PostgreSQL with Supabase
- **After**: Convex with optimized schema and real-time capabilities

### API Layer
- **Before**: Direct Supabase client calls
- **After**: TRPC with type-safe procedures and middleware

### Access Control
- **Before**: Row Level Security (RLS) policies in PostgreSQL
- **After**: Function-level authorization in Convex with TRPC middleware

## Migration Checklist

- [x] Install new dependencies (TRPC, WorkOS, Convex Auth)
- [x] Create Convex schema
- [x] Set up authentication configuration
- [x] Create TRPC router and procedures
- [x] Create Convex functions (queries/mutations)
- [x] Update frontend to use new auth system
- [ ] Remove Supabase dependencies
- [ ] Update environment variables
- [ ] Test the complete flow
- [ ] Deploy to production

## Breaking Changes

1. **Authentication**: Users will need to re-authenticate using WorkOS
2. **API**: All API calls now go through TRPC instead of direct Supabase calls
3. **Data Format**: Some data structures have been optimized (e.g., timestamps are now numbers instead of ISO strings)

## Testing

After migration, test the following flows:
1. User registration/login via WorkOS
2. Creating and managing chats
3. Sending messages
4. AI model selection
5. User preferences

## Rollback Plan

If issues arise, you can rollback by:
1. Reverting to the previous commit
2. Restoring the Supabase configuration
3. Re-enabling Supabase dependencies in package.json 