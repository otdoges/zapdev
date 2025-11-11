import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { createConvexAdapter } from "./auth-adapter-convex";
import { SESSION_COOKIE_PREFIX } from "./session-cookie";

export const auth = betterAuth({
  database: createConvexAdapter() as any, // Custom Convex adapter for persistent storage
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production with email setup
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
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    cookiePrefix: SESSION_COOKIE_PREFIX,
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
