import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { enforceRateLimit } from "./rateLimit";

// Helper function to get authenticated user
const getAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("User must be authenticated");
  }
  return identity;
};

// Input sanitization helpers
const sanitizeString = (input: string | undefined, maxLength: number = 255): string | undefined => {
  if (!input) return undefined;
  return input.trim().substring(0, maxLength);
};

const sanitizeEmail = (email: string): string => {
  const trimmed = email.trim().toLowerCase();
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    throw new Error("Invalid email format");
  }
  return trimmed;
};

const sanitizeUsername = (username: string | undefined): string | undefined => {
  if (!username) return undefined;
  const trimmed = username.trim();
  // Username validation: alphanumeric, underscores, hyphens only
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (trimmed && !usernameRegex.test(trimmed)) {
    throw new Error("Username can only contain letters, numbers, underscores, and hyphens");
  }
  return trimmed.substring(0, 50);
};

const sanitizeUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  const trimmed = url.trim();
  // Basic URL validation
  try {
    new URL(trimmed);
    return trimmed.substring(0, 500);
  } catch {
    throw new Error("Invalid URL format");
  }
};

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Use proper index query instead of filter for better performance
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .first();
    
    return user;
  },
});

// Create or update user profile
// Helper function to validate username availability
const validateUsernameAvailability = async (ctx: QueryCtx | MutationCtx, username: string | undefined, currentUserId: string) => {
  if (!username) return;
  
  const existingUserWithUsername = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", username))
    .first();
  
  if (existingUserWithUsername && existingUserWithUsername.userId !== currentUserId) {
    throw new Error("Username is already taken");
  }
};

// Helper function to handle email conflicts and merging
type UserUpdateData = {
  email?: string;
  username?: string;
  profileUrl?: string;
  [key: string]: unknown; // Allow additional fields if needed
};
const handleEmailConflict = async (
  ctx: MutationCtx,
  email: string,
  currentUserId: string,
  sanitizedData: UserUpdateData,
  now: number
) => {
  const existingUserWithEmail = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();

  if (existingUserWithEmail && existingUserWithEmail.userId !== currentUserId) {
    // Merge account by re-assigning the stored userId to the currently authenticated identity
    await ctx.db.patch(existingUserWithEmail._id, {
      userId: currentUserId,
      ...sanitizedData,
      updatedAt: now,
    });
    return existingUserWithEmail._id;
  }
  
  return null; // No conflict found
};

// Helper function to upsert user record
const upsertUserRecord = async (ctx: MutationCtx, userId: string, sanitizedData: Record<string, unknown>, now: number) => {
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .first();

  if (existingUser) {
    // Update existing user
    await ctx.db.patch(existingUser._id, {
      ...sanitizedData,
      updatedAt: now,
    });
    return existingUser._id;
  } else {
    // Create new user
    return await ctx.db.insert("users", {
      userId,
      email: "", // Default empty email, will be updated by upsertUser
      ...sanitizedData,
      createdAt: now,
      updatedAt: now,
    });
  }
};

export const upsertUser = mutation({
  args: {
    email: v.string(),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    await enforceRateLimit(ctx, "upsertUser");
    
    const now = Date.now();
    const sanitizedData = {
      email: sanitizeEmail(args.email),
      fullName: sanitizeString(args.fullName, 100),
      avatarUrl: sanitizeUrl(args.avatarUrl),
      username: sanitizeUsername(args.username),
      bio: sanitizeString(args.bio, 500),
    };

    // Validate username availability
    await validateUsernameAvailability(ctx, sanitizedData.username, identity.subject);

    // Handle email conflicts and potential account merging
    const mergedUserId = await handleEmailConflict(ctx, sanitizedData.email, identity.subject, sanitizedData, now);
    if (mergedUserId) {
      return mergedUserId;
    }

    // Upsert user record
    return await upsertUserRecord(ctx, identity.subject, sanitizedData, now);
  },
});

// Update user preferences
export const updateUserPreferences = mutation({
  args: {
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    settings: v.optional(v.object({
      notifications: v.optional(v.boolean()),
      autoSave: v.optional(v.boolean()),
      fontSize: v.optional(v.string()),
      aiBackgroundAgent: v.optional(v.object({
        enabled: v.boolean(),
        mode: v.union(v.literal("manual"), v.literal("auto"), v.literal("scheduled")),
        triggers: v.optional(v.array(v.string())),
        restrictions: v.optional(v.array(v.string())),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Enforce rate limiting
    await enforceRateLimit(ctx, "updateUserPreferences");
    
    const now = Date.now();

    // Validate fontSize if provided
    if (args.settings?.fontSize) {
      const validFontSizes = ["xs", "sm", "md", "lg", "xl", "2xl"];
      if (!validFontSizes.includes(args.settings.fontSize)) {
        throw new Error("Invalid font size. Must be one of: " + validFontSizes.join(", "));
      }
    }

    // Validate AI background agent settings for Pro users only
    if (args.settings?.aiBackgroundAgent) {
      // Check user subscription
      const subscription = await ctx.db
        .query("userSubscriptions")
        .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
        .first();
      
      const planType = subscription?.planType || "free";
      
      if (planType === "free") {
        throw new Error("AI Background Agent is a Pro feature. Please upgrade to Pro to enable this feature.");
      }

      // Validate mode
      const validModes = ["manual", "auto", "scheduled"];
      if (!validModes.includes(args.settings.aiBackgroundAgent.mode)) {
        throw new Error("Invalid AI background agent mode. Must be one of: " + validModes.join(", "));
      }

      // For auto mode, ensure triggers are provided
      if (args.settings.aiBackgroundAgent.mode === "auto" && 
          (!args.settings.aiBackgroundAgent.triggers || args.settings.aiBackgroundAgent.triggers.length === 0)) {
        throw new Error("Auto mode requires at least one trigger condition.");
      }
    }

    // Use proper index query instead of filter
    const existingPrefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .first();

    // Rate limiting: prevent too frequent updates
    if (existingPrefs && existingPrefs.updatedAt && (now - existingPrefs.updatedAt) < 1000) { // 1 second cooldown
      throw new Error("Please wait before updating preferences again");
    }

    if (existingPrefs) {
      // Update existing preferences
      await ctx.db.patch(existingPrefs._id, {
        theme: args.theme,
        settings: args.settings,
        updatedAt: now,
      });
      return existingPrefs._id;
    } else {
      // Create new preferences
      const prefsId = await ctx.db.insert("userPreferences", {
        userId: identity.subject,
        theme: args.theme,
        settings: args.settings,
        createdAt: now,
        updatedAt: now,
      });
      return prefsId;
    }
  },
});

// Get user preferences
export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getAuthenticatedUser(ctx);

    // Use proper index query instead of filter
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .first();
    
    return preferences;
  },
});

// Additional secure user management functions

// Delete user account (soft delete or full delete based on requirements)
export const deleteUserAccount = mutation({
  args: {
    confirmEmail: v.string(),
  },
  handler: async (ctx, { confirmEmail }) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Enforce strict rate limiting for account deletion
    await enforceRateLimit(ctx, "deleteUserAccount");

    // Get current user to verify email
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Verify email confirmation
    if (currentUser.email !== confirmEmail.trim().toLowerCase()) {
      throw new Error("Email confirmation does not match");
    }

    // Delete user preferences
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .first();
    
    if (preferences) {
      await ctx.db.delete(preferences._id);
    }

    // Delete user chats and messages
    const userChats = await ctx.db
      .query("chats")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const chat of userChats) {
      // Delete all messages in chat
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat_id", (q) => q.eq("chatId", chat._id))
        .collect();
      
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }
      
      // Delete chat
      await ctx.db.delete(chat._id);
    }

    // Finally delete user record
    await ctx.db.delete(currentUser._id);
    
    return { success: true };
  },
});

// Centralized function to sync Stripe subscription data to Convex - DEPRECATED
// TODO: Replace with Polar.sh integration
export const syncStripeDataToConvex = mutation({
  args: {
    stripeCustomerId: v.string(),
    userId: v.optional(v.string()),
    source: v.union(v.literal("webhook"), v.literal("success"), v.literal("manual")),
  },
  handler: async () => {
    throw new Error('Stripe integration deprecated - please use Polar.sh instead');
  },
});

// Helper function to ensure Stripe customer exists and get/create customer ID
export const ensureStripeCustomer = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
  },
  handler: async () => {
    throw new Error('Stripe integration deprecated - please use Polar.sh instead');
  },
});



// Upsert user subscription (called from webhooks)
export const upsertUserSubscription = mutation({
  args: {
    userId: v.string(),
    planId: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('canceled'),
      v.literal('past_due'),
      v.literal('incomplete'),
      v.literal('trialing'),
      v.literal('none')
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const planType: 'free' | 'pro' | 'enterprise' =
      args.planId.includes('enterprise') ? 'enterprise' : args.planId.includes('pro') ? 'pro' : 'free';

    const features = planType === 'enterprise'
      ? ['Everything in Pro', 'Dedicated support', 'SLA guarantee', 'Custom deployment', 'Advanced analytics', 'Custom billing']
      : planType === 'pro'
      ? ['Unlimited AI conversations', 'Advanced code execution', 'Priority support', 'Fast response time', 'Custom integrations', 'Team collaboration']
      : ['10 AI conversations per month', 'Basic code execution', 'Community support', 'Standard response time'];

    const usageLimits = {
      maxConversations: planType === 'free' ? 10 : undefined,
      maxCodeExecutions: planType === 'free' ? 10 : undefined,
      hasAdvancedFeatures: planType !== 'free',
    } as { maxConversations?: number; maxCodeExecutions?: number; hasAdvancedFeatures: boolean };

    const existing = await ctx.db
      .query('userSubscriptions')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        planId: args.planId,
        planName: planType.charAt(0).toUpperCase() + planType.slice(1),
        planType,
        status: args.status,
        features,
        usageLimits,
        currentUsage: existing.currentUsage ?? { conversationsUsed: 0, codeExecutionsUsed: 0 },
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        resetDate: args.currentPeriodEnd,
        updatedAt: now,
      });
      return existing._id;
    }

    const id = await ctx.db.insert('userSubscriptions', {
      userId: args.userId,
      planId: args.planId,
      planName: planType.charAt(0).toUpperCase() + planType.slice(1),
      planType,
      status: args.status,
      features,
      usageLimits,
      currentUsage: { conversationsUsed: 0, codeExecutionsUsed: 0 },
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      resetDate: args.currentPeriodEnd,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

// Get user profile by username (public profile view)
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      throw new Error("Invalid username");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", sanitizedUsername))
      .first();

    if (!user) {
      return null;
    }

    // Return only public fields
    return {
      username: user.username,
      fullName: user.fullName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  },
});

// Check username availability
export const checkUsernameAvailability = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return { available: false, reason: "Invalid username format" };
    }

    if (sanitizedUsername.length < 3) {
      return { available: false, reason: "Username must be at least 3 characters long" };
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", sanitizedUsername))
      .first();

    return {
      available: !existingUser,
      reason: existingUser ? "Username is already taken" : undefined,
    };
  },
});

// Update user avatar specifically (with additional validation)
export const updateUserAvatar = mutation({
  args: {
    avatarUrl: v.string(),
  },
  handler: async (ctx, { avatarUrl }) => {
    const identity = await getAuthenticatedUser(ctx);

    // Additional avatar URL validation
    const sanitizedUrl = sanitizeUrl(avatarUrl);
    if (!sanitizedUrl) {
      throw new Error("Invalid avatar URL");
    }

    // Check if it's from allowed domains (optional security measure)
    const allowedDomains = [
      'gravatar.com',
      'githubusercontent.com',
      'googleusercontent.com',
      'clerk.dev',
      'clerk.com'
    ];
    
    const url = new URL(sanitizedUrl);
    const isAllowedDomain = allowedDomains.some(domain => 
      url.hostname === domain || url.hostname.endsWith('.' + domain)
    );

    if (!isAllowedDomain) {
      throw new Error("Avatar URL must be from an allowed domain");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      avatarUrl: sanitizedUrl,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});