import { betterAuth } from "better-auth";
import { convexAdapter } from "@better-auth-kit/convex";
import { ConvexHttpClient } from "convex/browser";

// Validate required environment variables
const requiredEnvVars = {
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

// Check for missing environment variables and provide helpful feedback
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value || value.startsWith('your_'))
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('📖 Please check ENV-SETUP.md for setup instructions');
  console.error('🔑 Make sure to replace placeholder values in .env.local');
}

const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  
  // Use the official Convex adapter
  database: convexAdapter(convexClient),
  
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: ["user:email"], // Ensure we can access user email
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ["openid", "email", "profile"], // Standard Google OAuth scopes
    },
  },
  
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
    cookies: {
      // Improve cookie security
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },

  callbacks: {
    // Better error handling for OAuth flows
    async signIn({ user, account }) {
      console.log(`✅ User signed in: ${user.email} via ${account?.provider || 'email'}`);
      return true;
    },
    async error({ error }) {
      console.error("❌ Better Auth error:", error);
      return { error: error.message };
    },
  },
});

export type Session = typeof auth.$Infer.Session; 