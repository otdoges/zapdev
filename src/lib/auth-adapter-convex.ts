/**
 * Convex Database Adapter for Better Auth
 * 
 * This adapter connects Better Auth to Convex database tables
 * for persistent session and user management.
 */

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export interface ConvexAdapterConfig {
  // No specific config needed for Convex adapter
}

/**
 * Create a Better Auth database adapter for Convex
 */
export function createConvexAdapter(config?: ConvexAdapterConfig) {
  return {
    /**
     * Create a new user
     */
    async createUser(user: {
      email: string;
      name?: string;
      image?: string;
      emailVerified?: boolean;
    }) {
      try {
        const userId = await fetchMutation(api.users.createOrUpdate, {
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified ?? false,
        });

        return this.getUser(userId);
      } catch (error) {
        console.error("Failed to create user:", error);
        throw error;
      }
    },

    /**
     * Get user by ID
     */
    async getUser(id: string) {
      try {
        const user = await fetchQuery(api.users.getById, { userId: id as Id<"users"> });
        if (!user) return null;

        return {
          id: user._id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified ?? false,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        };
      } catch (error) {
        console.error("Failed to get user:", error);
        return null;
      }
    },

    /**
     * Get user by email
     */
    async getUserByEmail(email: string) {
      try {
        const user = await fetchQuery(api.users.getByEmail, { email });
        if (!user) return null;

        return {
          id: user._id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified ?? false,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        };
      } catch (error) {
        console.error("Failed to get user by email:", error);
        return null;
      }
    },

    /**
     * Update user
     */
    async updateUser(
      id: string,
      updates: {
        name?: string;
        email?: string;
        image?: string;
        emailVerified?: boolean;
      }
    ) {
      try {
        await fetchMutation(api.users.update, {
          userId: id as Id<"users">,
          ...updates,
        });

        return this.getUser(id);
      } catch (error) {
        console.error("Failed to update user:", error);
        throw error;
      }
    },

    /**
     * Delete user
     */
    async deleteUser(id: string) {
      try {
        await fetchMutation(api.users.deleteUser, { userId: id as Id<"users"> });
        return true;
      } catch (error) {
        console.error("Failed to delete user:", error);
        return false;
      }
    },

    /**
     * Create a new session
     */
    async createSession(session: {
      userId: string;
      expiresAt: Date;
      token: string;
      ipAddress?: string;
      userAgent?: string;
    }) {
      try {
        const sessionId = await fetchMutation(api.sessions.create, {
          userId: session.userId as Id<"users">,
          expiresAt: session.expiresAt.getTime(),
          token: session.token,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
        });

        return {
          id: sessionId,
          userId: session.userId,
          expiresAt: session.expiresAt,
          token: session.token,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
        };
      } catch (error) {
        console.error("Failed to create session:", error);
        throw error;
      }
    },

    /**
     * Get session by token
     */
    async getSession(token: string) {
      try {
        const session = await fetchQuery(api.sessions.getByToken, { token });
        if (!session) return null;

        return {
          id: session._id,
          userId: session.userId,
          expiresAt: new Date(session.expiresAt),
          token: session.token,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
        };
      } catch (error) {
        console.error("Failed to get session:", error);
        return null;
      }
    },

    /**
     * Update session
     */
    async updateSession(
      token: string,
      updates: {
        expiresAt?: Date;
      }
    ) {
      try {
        await fetchMutation(api.sessions.updateByToken, {
          token,
          expiresAt: updates.expiresAt?.getTime(),
        });
        
        const updatedSession = await this.getSession(token);
        if (!updatedSession) {
          throw new Error("Session not found after update");
        }
        
        return updatedSession;
      } catch (error) {
        console.error("Failed to update session:", error);
        throw error;
      }
    },

    /**
     * Delete session by token
     */
    async deleteSession(token: string) {
      try {
        await fetchMutation(api.sessions.deleteByToken, { token });
        return true;
      } catch (error) {
        console.error("Failed to delete session:", error);
        return false;
      }
    },

    /**
     * Create OAuth account
     */
    async createAccount(account: {
      userId: string;
      provider: string;
      providerAccountId: string;
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
      tokenType?: string;
      scope?: string;
      idToken?: string;
    }) {
      try {
        const accountId = await fetchMutation(api.accounts.create, {
          userId: account.userId as Id<"users">,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: account.accessToken,
          refreshToken: account.refreshToken,
          expiresAt: account.expiresAt,
          tokenType: account.tokenType,
          scope: account.scope,
          idToken: account.idToken,
        });

        return {
          id: accountId,
          ...account,
        };
      } catch (error) {
        console.error("Failed to create account:", error);
        throw error;
      }
    },

    /**
     * Get account by provider and provider account ID
     */
    async getAccount(provider: string, providerAccountId: string) {
      try {
        const account = await fetchQuery(api.accounts.getByProvider, {
          provider,
          providerAccountId,
        });
        if (!account) return null;

        return {
          id: account._id,
          userId: account.userId,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: account.accessToken,
          refreshToken: account.refreshToken,
          expiresAt: account.expiresAt,
          tokenType: account.tokenType,
          scope: account.scope,
          idToken: account.idToken,
        };
      } catch (error) {
        console.error("Failed to get account:", error);
        return null;
      }
    },

    /**
     * Update OAuth account
     */
    async updateAccount(
      provider: string,
      providerAccountId: string,
      updates: {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
      }
    ) {
      try {
        await fetchMutation(api.accounts.update, {
          provider,
          providerAccountId,
          ...updates,
        });

        return this.getAccount(provider, providerAccountId);
      } catch (error) {
        console.error("Failed to update account:", error);
        throw error;
      }
    },

    /**
     * Delete OAuth account
     */
    async deleteAccount(provider: string, providerAccountId: string) {
      try {
        await fetchMutation(api.accounts.deleteOAuth, {
          provider,
          providerAccountId,
        });
        return true;
      } catch (error) {
        console.error("Failed to delete account:", error);
        return false;
      }
    },
  };
}
