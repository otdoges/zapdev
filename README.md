# ZapDev

ZapDev is an advanced AI website builder specialized in creating modern, production-ready Next.js applications. It excels at transforming high-level ideas into fully functional websites with beautiful UI, responsive design, and modern web standards.

## WebContainer Integration

This project uses WebContainer API to run Next.js applications directly in the browser. WebContainer provides a browser-based Node.js runtime for instant preview and development.

### Requirements

1. **Browser Support**:
   - Chrome/Chromium (recommended)
   - Safari 16.4+
   - Firefox with experimental features enabled

2. **Security Headers**:
   - Cross-Origin-Embedder-Policy: require-corp
   - Cross-Origin-Opener-Policy: same-origin
   - These are configured in `vite.config.ts` and `vercel.json`

3. **Dependencies**:
   - `@webcontainer/api` v1.6.1+ (included in package.json)
   - Secure context (HTTPS in production)
   - SharedArrayBuffer support

### Development Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start development server:
   ```bash
   bun run dev
   ```

3. The WebContainer will automatically:
   - Check browser compatibility
   - Initialize the runtime
   - Mount Next.js project files
   - Install dependencies
   - Start the development server

### Troubleshooting

If WebContainer fails to initialize:

1. **Check Browser Console** for cross-origin isolation errors
2. **Verify Headers** are set correctly in development and production
3. **Use Supported Browser** (Chrome recommended)
4. **Enable HTTPS** for production deployment
5. **Check SharedArrayBuffer** availability

### Production Deployment

The project is configured for Vercel deployment with proper headers. For other platforms, ensure the following headers are set:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

## Features

- 🤖 AI-powered code generation
- 🔐 WorkOS SSO authentication
- 💬 Real-time chat interface
- 📱 Responsive design
- ⚡ Fast development workflow

## WorkOS Authentication Setup

This application uses WorkOS for Single Sign-On (SSO) authentication. Follow these steps to configure it properly:

### 1. WorkOS Dashboard Configuration

1. **Add Redirect URIs** in your [WorkOS Dashboard](https://dashboard.workos.com/redirects):
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
   - Staging: `https://staging.yourdomain.com/auth/callback` (if applicable)

2. **Set a Default Redirect URI** in the dashboard for your environment

3. **Note**: Redirect URIs using HTTP are only allowed in Sandbox environments. Production must use HTTPS.

### 2. Choose Your Authentication Flow

WorkOS supports two SSO authentication flows. Choose one based on your needs:

#### Option A: Connection-based Flow (Single IdP)
- **Use case**: You have a single identity provider for all users
- **Setup**: 
  1. In WorkOS Dashboard → Single Sign-On → Connections, copy your Connection ID (e.g., `conn_01G...`)
  2. Set `VITE_WORKOS_CONNECTION_ID` in your environment variables
- **Pros**: Simple setup, direct connection to your IdP
- **Cons**: All users must use the same identity provider

#### Option B: Domain-based Flow (Multi-tenant)
- **Use case**: Different organizations use different identity providers
- **Setup**:
  1. In WorkOS Dashboard → Single Sign-On → Domains, add domains (e.g., `acme.com`) and map them to connections
  2. Set `VITE_WORKOS_DOMAIN` in your environment variables
- **Pros**: Supports multiple organizations with different IdPs
- **Cons**: Requires domain configuration for each organization

### 3. Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# WorkOS Configuration
VITE_WORKOS_CLIENT_ID=your_workos_client_id_here

# Choose ONE of the following authentication flows:

# Option A: Domain-based flow (auto-select per organization)
VITE_WORKOS_DOMAIN=your_domain_here
# Example: VITE_WORKOS_DOMAIN=acme.com

# Option B: Connection-based flow (single IdP)
# VITE_WORKOS_CONNECTION_ID=conn_01G...

# Redirect URI configuration
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback

# For production, use:
# VITE_WORKOS_REDIRECT_URI=https://yourdomain.com/auth/callback

# Other required variables
VITE_CONVEX_URL=your_convex_url_here
```

### 4. Wildcard Redirect URIs (Optional)

WorkOS supports wildcard redirect URIs for multiple subdomains:

- ✅ Valid: `https://*.yourdomain.com/auth/callback`
- ❌ Invalid: `https://*.*.yourdomain.com/auth/callback` (multiple wildcards)
- ❌ Invalid: `https://sub.*.yourdomain.com/auth/callback` (wildcard not in leftmost subdomain)

**Important**: Wildcard URIs cannot be set as the default redirect URI.

### 5. Security Considerations

- **Production**: Only HTTPS redirect URIs are allowed (except `http://127.0.0.1` for native clients)
- **Development**: HTTP localhost URIs are permitted
- **State Parameter**: Consider implementing CSRF protection using the state parameter
- **Error Handling**: The app includes comprehensive error handling for redirect URI mismatches

## Quick Start

1. Clone the repository
2. Install dependencies: `bun install`
3. Set up your environment variables (see WorkOS setup above)
4. Start the development server: `bun dev`
5. Open `http://localhost:5173` in your browser

## Development

The application includes validation for redirect URIs that will:
- Warn about HTTP usage in production
- Validate redirect URI format
- Provide helpful error messages for misconfigurations

Check the browser console for any configuration warnings during development.

## Deployment

When deploying to production:

1. Update `VITE_WORKOS_REDIRECT_URI` to use your production domain with HTTPS
2. Add the production redirect URI to your WorkOS Dashboard
3. Ensure all environment variables are properly configured in your deployment platform

## Support

If you encounter authentication issues:
- Check that your redirect URIs are properly configured in the WorkOS Dashboard
- Verify environment variables are set correctly
- Review browser console for validation warnings
- Contact support if redirect URI errors persist
