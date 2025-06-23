# Supabase Authentication Setup

This guide will help you set up Supabase authentication for your ZapDev application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up or sign in with GitHub
4. Click "New project"
5. Choose your organization
6. Enter a project name (e.g., "zapdev")
7. Enter a database password (save this!)
8. Choose a region close to your users
9. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy your project URL and anon key

## 3. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Configure Authentication Providers

### GitHub OAuth (Recommended)

1. In Supabase dashboard, go to Authentication → Providers
2. Enable GitHub provider
3. Go to GitHub → Settings → Developer settings → OAuth Apps
4. Click "New OAuth App"
5. Fill in:
   - Application name: ZapDev
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `https://your-project-id.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret to Supabase
7. Save configuration

### Email Authentication

1. In Supabase dashboard, go to Authentication → Providers
2. Enable Email provider
3. Configure email templates if needed
4. Set redirect URLs:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

## 5. Test Authentication

1. Start your development server: `bun dev`
2. Go to `http://localhost:3000/auth`
3. Try signing up with email or GitHub
4. Check that you can sign in and out

## 6. Production Setup

For production deployment:

1. Update environment variables with production URLs
2. Update redirect URLs in Supabase dashboard
3. Configure custom domain if needed

## Troubleshooting

### Common Issues

1. **"Invalid login credentials"**: Check your email/password or try resetting
2. **OAuth errors**: Verify callback URLs match exactly
3. **Environment variables**: Make sure they're properly loaded (restart dev server)
4. **CORS issues**: Ensure site URL is configured in Supabase

### Auth Flow

1. User clicks sign in → redirected to provider
2. Provider authenticates → redirects to `/auth/callback`
3. Callback exchanges code for session → redirects to app
4. Middleware checks auth state on protected routes

### Database Schema

The auth system uses Supabase's built-in auth tables. You can extend with:

```sql
-- Optional: Create a profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);
```

Need help? Check the [Supabase documentation](https://supabase.com/docs/guides/auth) or open an issue! 