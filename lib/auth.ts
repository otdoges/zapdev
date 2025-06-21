import { betterAuth } from "better-auth";
import { convexAdapter } from "@better-auth-kit/convex";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Defensive Convex client creation
const createConvexClient = () => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.warn("NEXT_PUBLIC_CONVEX_URL not found, using placeholder");
    return new ConvexHttpClient("https://placeholder.convex.cloud");
  }
  return new ConvexHttpClient(convexUrl);
};

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-key-for-build",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  
  // Add trusted origins for CORS
  trustedOrigins: [
    "http://localhost:3000",
    "https://localhost:3000", 
    "https://zapdev-mu.vercel.app",
    ...(process.env.NODE_ENV === "development" ? ["http://127.0.0.1:3000"] : [])
  ],
  
  // Use the official Convex adapter with defensive client initialization
  database: convexAdapter(createConvexClient()),
  
  // Optimize session settings for better performance
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session daily instead of every request
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // Cache for 5 minutes
    }
  },
  
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  
  // Add database hooks to sync all user sign-ups to custom users table
  databaseHooks: {
    user: {
      create: {
        after: async (user: any) => {
          // Sync all users to custom users table
          if (!user.email) {
            console.warn("User created without email, skipping Convex sync");
            return;
          }
          
          const convexClient = createConvexClient();
          try {
            await convexClient.mutation(api.users.createOrUpdateUser, {
              email: user.email,
              name: user.name || user.email.split('@')[0],
              avatar: user.image || "",
              provider: user.provider || (user.image ? "oauth" : "email"),
            });
          } catch (error) {
            console.error("Failed to sync user to Convex:", {
              email: user.email,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        },
      },
    },
  },
  
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
    // Add additional optimizations
    generateId: false, // Use default ID generation (faster)
    disableSignup: false,
  },
  
  // Add rate limiting to prevent abuse
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute window
    max: 100, // 100 requests per minute
  },
});

export type Session = typeof auth.$Infer.Session; 