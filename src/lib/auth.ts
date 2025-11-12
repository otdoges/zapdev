import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { createConvexAdapter } from "./auth-adapter-convex";
import { SESSION_COOKIE_PREFIX } from "./session-cookie";
import { SESSION_CONFIG } from "./constants";

const makeSocialProviders = () => {
  const providers: Record<string, unknown> = {};

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (googleClientId && googleClientSecret) {
    providers.google = {
      enabled: true,
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    };
  }

  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (githubClientId && githubClientSecret) {
    providers.github = {
      enabled: true,
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    };
  }

  return providers;
};

// Determine base URL based on environment
const getBaseURL = (): string => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  // Production URL - use hardcoded domain
  return "https://zapdev-mu.vercel.app";
};

const baseURL = getBaseURL();

export const auth = betterAuth({
  baseURL,
  database: createConvexAdapter(),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Email verification disabled by default
  },
  socialProviders: makeSocialProviders(),
  session: {
    expiresIn: SESSION_CONFIG.EXPIRES_IN,
    updateAge: SESSION_CONFIG.UPDATE_AGE,
    cookieCache: {
      enabled: true,
      maxAge: SESSION_CONFIG.CACHE_MAX_AGE,
    },
  },
  advanced: {
    cookiePrefix: SESSION_COOKIE_PREFIX,
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
