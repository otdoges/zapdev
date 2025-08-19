import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import crypto from "crypto";

// Simple encryption using crypto (for demo purposes - in production, use proper key management)
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || "default-secret-key-change-in-production";

function encryptApiKey(apiKey: string, userId: string): { encrypted: string; hash: string } {
  // Create a user-specific key by combining the base key with userId
  const userKey = crypto.createHash('sha256').update(ENCRYPTION_KEY + userId).digest();
  
  const cipher = crypto.createCipher('aes-256-cbc', userKey);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  return { encrypted, hash };
}

function decryptApiKey(encryptedApiKey: string, userId: string): string {
  // Create the same user-specific key
  const userKey = crypto.createHash('sha256').update(ENCRYPTION_KEY + userId).digest();
  
  const decipher = crypto.createDecipher('aes-256-cbc', userKey);
  let decrypted = decipher.update(encryptedApiKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Get user's API keys (returns only metadata, not the actual keys)
export const getUserApiKeys = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const apiKeys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    return apiKeys.map(key => ({
      _id: key._id,
      provider: key.provider,
      isActive: key.isActive,
      lastUsed: key.lastUsed,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
      // Don't return the actual encrypted key or hash
    }));
  },
});

// Store or update user's API key
export const setApiKey = mutation({
  args: {
    provider: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, { provider, apiKey }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate provider
    const validProviders = ["gemini", "openai", "anthropic"];
    if (!validProviders.includes(provider)) {
      throw new Error("Invalid provider");
    }

    // Basic API key validation
    if (!apiKey || apiKey.length < 10) {
      throw new Error("Invalid API key");
    }

    // Encrypt the API key
    const { encrypted, hash } = encryptApiKey(apiKey, userId);

    // Check if user already has an API key for this provider
    const existingKey = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", (q) => 
        q.eq("userId", userId).eq("provider", provider)
      )
      .first();

    if (existingKey) {
      // Update existing key
      await ctx.db.patch(existingKey._id, {
        encryptedApiKey: encrypted,
        keyHash: hash,
        isActive: true,
        updatedAt: Date.now(),
      });
    } else {
      // Create new key
      await ctx.db.insert("userApiKeys", {
        userId,
        provider,
        encryptedApiKey: encrypted,
        keyHash: hash,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get decrypted API key for use (internal function)
export const getDecryptedApiKey = query({
  args: {
    provider: v.string(),
  },
  handler: async (ctx, { provider }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const apiKeyRecord = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", (q) => 
        q.eq("userId", userId).eq("provider", provider)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!apiKeyRecord) {
      return null;
    }

    try {
      const decryptedKey = decryptApiKey(apiKeyRecord.encryptedApiKey, userId);
      
      // Update last used timestamp
      await ctx.db.patch(apiKeyRecord._id, {
        lastUsed: Date.now(),
      });
      
      return decryptedKey;
    } catch (error) {
      console.error("Failed to decrypt API key:", error);
      return null;
    }
  },
});

// Delete API key
export const deleteApiKey = mutation({
  args: {
    provider: v.string(),
  },
  handler: async (ctx, { provider }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const apiKeyRecord = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", (q) => 
        q.eq("userId", userId).eq("provider", provider)
      )
      .first();

    if (apiKeyRecord) {
      await ctx.db.delete(apiKeyRecord._id);
    }

    return { success: true };
  },
});

// Toggle API key active status
export const toggleApiKey = mutation({
  args: {
    provider: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, { provider, isActive }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const apiKeyRecord = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", (q) => 
        q.eq("userId", userId).eq("provider", provider)
      )
      .first();

    if (apiKeyRecord) {
      await ctx.db.patch(apiKeyRecord._id, {
        isActive,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});