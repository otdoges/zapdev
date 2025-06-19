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
  
  // Use the official Convex adapter with defensive client initialization
  database: convexAdapter(createConvexClient()),
  
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
        after: async (user) => {
          // Sync all users to custom users table
          if (user.email) {
            const convexClient = createConvexClient();
            try {
              await convexClient.mutation(api.users.createOrUpdateUser, {
                email: user.email,
                name: user.name || user.email.split('@')[0],
                avatar: user.image || "",
                provider: user.image ? "oauth" : "email", // Simple heuristic
              });
            } catch (error) {
              console.error("Failed to sync user to Convex:", error);
            }
          }
        },
      },
    },
  },
  
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  },
});

export type Session = typeof auth.$Infer.Session; 