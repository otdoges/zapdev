import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
// Using Web Crypto API instead of Node crypto

// Simple encryption using crypto (for demo purposes - in production, use proper key management)
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || "default-secret-key-change-in-production";

async function encryptApiKey(apiKey: string, userId: string): Promise<{ encrypted: string; hash: string }> {
  // Create a user-specific key by combining the base key with userId
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_KEY + userId);
  const keyHashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  const userKey = await crypto.subtle.importKey('raw', keyHashBuffer, { name: 'AES-CBC' }, false, ['encrypt']);
  
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const data = encoder.encode(apiKey);
  const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, userKey, data);
  
  const encrypted = Array.from(new Uint8Array(iv)).map(b => b.toString(16).padStart(2, '0')).join('') + ':' + 
    Array.from(new Uint8Array(encryptedBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { encrypted, hash };
}

async function decryptApiKey(encryptedApiKey: string, userId: string): Promise<string> {
  // Create the same user-specific key
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_KEY + userId);
  const keyHashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  const userKey = await crypto.subtle.importKey('raw', keyHashBuffer, { name: 'AES-CBC' }, false, ['decrypt']);
  
  const parts = encryptedApiKey.split(':');
  const iv = new Uint8Array(parts[0].match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
  const encryptedData = new Uint8Array(parts[1].match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
  
  const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, userKey, encryptedData);
  const decoder = new TextDecoder();
  
  return decoder.decode(decryptedBuffer);
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
    const { encrypted, hash } = await encryptApiKey(apiKey, userId);

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
      const decryptedKey = await decryptApiKey(apiKeyRecord.encryptedApiKey, userId);
      return decryptedKey;
    } catch (error) {
      console.error("Failed to decrypt API key:", error);
      return null;
    }
  },
});

// Update API key last used timestamp (separate mutation)
export const updateApiKeyLastUsed = mutation({
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

    if (apiKeyRecord) {
      await ctx.db.patch(apiKeyRecord._id, {
        lastUsed: Date.now(),
      });
    }

    return { success: true };
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