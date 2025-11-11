import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { createConvexAdapter } from "./auth-adapter-convex";
import { SESSION_COOKIE_PREFIX } from "./session-cookie";
import { SESSION_CONFIG } from "./constants";

export const auth = betterAuth({
  database: createConvexAdapter(), // Custom Convex adapter for persistent storage
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== "false", // Enabled by default, disable with env var
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
  },
  session: {
    expiresIn: SESSION_CONFIG.EXPIRES_IN, // 7 days
    updateAge: SESSION_CONFIG.UPDATE_AGE, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: SESSION_CONFIG.CACHE_MAX_AGE, // 5 minutes
    },
  },
  advanced: {
    cookiePrefix: SESSION_COOKIE_PREFIX,
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
