import { betterAuth } from "better-auth";
import { convexAdapter } from "@better-auth-kit/convex";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { polar, checkout, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";

// Defensive Convex client creation
const createConvexClient = () => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.warn("NEXT_PUBLIC_CONVEX_URL not found, using placeholder");
    return new ConvexHttpClient("https://placeholder.convex.cloud");
  }
  return new ConvexHttpClient(convexUrl);
};

// Create Polar client following the documentation
const createPolarClient = () => {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("POLAR_ACCESS_TOKEN not found, Polar features will be disabled");
    return null;
  }
  
  return new Polar({
    accessToken,
    // Use 'sandbox' for testing, 'production' for live
    server: (process.env.POLAR_SERVER as "sandbox" | "production") || 'sandbox'
  });
};

const polarClient = createPolarClient();

// Create plugins array following Polar documentation
const createPlugins = () => {
  const plugins: any[] = [];
  
  if (polarClient) {
    try {
      plugins.push(polar({
        client: polarClient,
        // Enable automatic Polar Customer creation on signup
        createCustomerOnSignUp: true,
        use: [
          checkout({
            products: [
              {
                productId: process.env.POLAR_PRODUCT_ID || "8c36fbf5-ad68-44d2-ba2c-682d88727c47", // Replace with actual product ID from Polar Dashboard
                slug: "pro" // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
              }
            ],
            successUrl: "/success?checkout_id={CHECKOUT_ID}",
            authenticatedUsersOnly: true
          }),
          webhooks({
            secret: process.env.POLAR_WEBHOOK_SECRET || "",
            onPayload: async (payload: any) => {
              // Handle webhook payload
              console.log("Polar webhook received:", payload);
              // Add your webhook handling logic here
            },
          })
        ]
      }));
    } catch (error) {
      console.warn("Failed to initialize Polar plugin:", error);
    }
  }
  
  return plugins;
};

const getAuthBaseUrl = () => {
  // If explicitly set, use it
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  // For Vercel deployments, use the Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Default for local development
  return "http://localhost:3000";
};

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-key-for-build",
  baseURL: getAuthBaseUrl(),
  
  // Add trusted origins for CORS
  trustedOrigins: [
    "http://localhost:3000",
    "https://localhost:3000", 
    "https://zapdev-mu.vercel.app",
    "https://zapdev-mu.vercel.app/api/auth/callback",
    "http://localhost:3001",
    "https://zapdev-mu.vercel.app/auth",
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
    requireEmailVerification: false, // Disable email verification for now
    sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
      // TODO: Implement email sending logic
      console.log("Password reset URL:", url);
    },
    sendVerificationEmail: async ({ user, url }: { user: any; url: string }) => {
      // TODO: Implement email sending logic
      console.log("Verification URL:", url);
    },
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
  
  // Add plugins with Polar integration
  plugins: createPlugins(),
  
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