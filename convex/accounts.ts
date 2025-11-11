import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a new OAuth account
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    provider: v.string(),
    providerAccountId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    tokenType: v.optional(v.string()),
    scope: v.optional(v.string()),
    idToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if account already exists
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_provider_accountId", (q) =>
        q.eq("provider", args.provider).eq("providerAccountId", args.providerAccountId)
      )
      .first();

    if (existing) {
      throw new Error("Account already exists");
    }

    const accountId = await ctx.db.insert("accounts", {
      userId: args.userId,
      provider: args.provider,
      providerAccountId: args.providerAccountId,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      tokenType: args.tokenType,
      scope: args.scope,
      idToken: args.idToken,
    });

    return accountId;
  },
});

/**
 * Get account by provider and provider account ID
 */
export const getByProvider = query({
  args: {
    provider: v.string(),
    providerAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_provider_accountId", (q) =>
        q.eq("provider", args.provider).eq("providerAccountId", args.providerAccountId)
      )
      .first();

    return account;
  },
});

/**
 * Get all accounts for a user
 */
export const getByUserId = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return accounts;
  },
});

/**
 * Update OAuth account tokens
 */
export const update = mutation({
  args: {
    provider: v.string(),
    providerAccountId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_provider_accountId", (q) =>
        q.eq("provider", args.provider).eq("providerAccountId", args.providerAccountId)
      )
      .first();

    if (!account) {
      throw new Error("Account not found");
    }

    const updates: any = {};
    if (args.accessToken !== undefined) updates.accessToken = args.accessToken;
    if (args.refreshToken !== undefined) updates.refreshToken = args.refreshToken;
    if (args.expiresAt !== undefined) updates.expiresAt = args.expiresAt;

    await ctx.db.patch(account._id, updates);
    return account._id;
  },
});

/**
 * Delete OAuth account
 */
export const deleteOAuth = mutation({
  args: {
    provider: v.string(),
    providerAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_provider_accountId", (q) =>
        q.eq("provider", args.provider).eq("providerAccountId", args.providerAccountId)
      )
      .first();

    if (!account) {
      throw new Error("Account not found");
    }

    await ctx.db.delete(account._id);
    return true;
  },
});

/**
 * Delete all accounts for a user
 */
export const deleteByUserId = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    return accounts.length;
  },
});
