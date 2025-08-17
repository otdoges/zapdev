import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { enforceRateLimit } from "./rateLimit";
import { api } from "./_generated/api";
import { getSubscriptionPeriod } from "../src/types/stripe";

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
const upsertUserRecord = async (ctx: MutationCtx, userId: string, sanitizedData: any, now: number) => {
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

// Centralized function to sync Stripe subscription data to Convex
export const syncStripeDataToConvex = mutation({
  args: {
    stripeCustomerId: v.string(),
    userId: v.optional(v.string()),
    source: v.union(v.literal("webhook"), v.literal("success"), v.literal("manual")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecret) {
      console.error('[SYNC] Missing STRIPE_SECRET_KEY environment variable');
      throw new Error('Stripe configuration missing');
    }

    // Dynamic import of Stripe to avoid bundle issues
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeSecret, { apiVersion: '2025-07-30.basil' });

    try {
      // Get customer info first
      const customer = await stripe.customers.retrieve(args.stripeCustomerId);
      if (!customer || customer.deleted) {
        console.error('[SYNC] Customer not found or deleted:', args.stripeCustomerId);
        throw new Error('Customer not found');
      }

      // Extract userId from customer metadata or use provided userId
      const userId = args.userId || customer.metadata?.userId;
      if (!userId) {
        console.error('[SYNC] No userId found in customer metadata or args');
        throw new Error('User ID required for sync');
      }

      // Ensure stripeCustomers record exists
      const existingCustomerRecord = await ctx.db
        .query('stripeCustomers')
        .withIndex('by_user_id', (q) => q.eq('userId', userId))
        .first();

      if (!existingCustomerRecord) {
        await ctx.db.insert('stripeCustomers', {
          userId,
          stripeCustomerId: args.stripeCustomerId,
          email: customer.email || '',
          metadata: {
            createdViaCheckout: args.source === 'success',
          },
          createdAt: now,
          updatedAt: now,
        });
      } else if (existingCustomerRecord.stripeCustomerId !== args.stripeCustomerId) {
        // Update if customer ID changed (shouldn't happen but be safe)
        await ctx.db.patch(existingCustomerRecord._id, {
          stripeCustomerId: args.stripeCustomerId,
          email: customer.email || existingCustomerRecord.email,
          updatedAt: now,
        });
      }

      // Fetch latest subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: args.stripeCustomerId,
        limit: 5,
        status: 'all',
        expand: ['data.default_payment_method'],
      });

      // Find the most relevant subscription (active/trialing first, then most recent)
      const activeOrTrialing = subscriptions.data.find(s => s.status === 'active' || s.status === 'trialing');
      const subscription = activeOrTrialing || subscriptions.data[0];

      let syncData: {
        userId: string;
        stripeCustomerId: string;
        subscriptionId?: string;
        status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused' | 'none';
        priceId?: string;
        planId: 'free' | 'pro' | 'enterprise';
        currentPeriodStart?: number;
        currentPeriodEnd?: number;
        cancelAtPeriodEnd: boolean;
        paymentMethod?: { brand?: string; last4?: string };
        lastSyncAt: number;
        syncSource: typeof args.source;
        updatedAt: number;
      };

      if (!subscription) {
        // No subscription found - free plan
        syncData = {
          userId,
          stripeCustomerId: args.stripeCustomerId,
          status: 'none',
          planId: 'free',
          cancelAtPeriodEnd: false,
          lastSyncAt: now,
          syncSource: args.source,
          updatedAt: now,
        };
      } else {
        // Map Stripe subscription status to our enum
        const mappedStatus = mapSubscriptionStatus(subscription.status);
        
        // Get price ID and map to plan
        const priceId = subscription.items.data[0]?.price?.id || '';
        const planId = mapPriceIdToPlan(priceId);
        
        // Extract payment method info
        let paymentMethod: { brand?: string; last4?: string } | undefined;
        if (subscription.default_payment_method && typeof subscription.default_payment_method !== 'string') {
          const pm = subscription.default_payment_method;
          paymentMethod = {
            brand: pm.card?.brand || undefined,
            last4: pm.card?.last4 || undefined,
          };
        }

        syncData = {
          userId,
          stripeCustomerId: args.stripeCustomerId,
          subscriptionId: subscription.id,
          status: mappedStatus,
          priceId,
          planId,
          ...(() => {
            const period = getSubscriptionPeriod(subscription);
            return period ? {
              currentPeriodStart: Math.floor(period.currentPeriodStart / 1000), // Convert back to seconds for Convex
              currentPeriodEnd: Math.floor(period.currentPeriodEnd / 1000),
            } : {
              currentPeriodStart: 0,
              currentPeriodEnd: 0,
            };
          })(),
          cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
          paymentMethod,
          lastSyncAt: now,
          syncSource: args.source,
          updatedAt: now,
        };
      }

      // Upsert to stripeSubscriptionCache
      const existingCache = await ctx.db
        .query('stripeSubscriptionCache')
        .withIndex('by_user_id', (q) => q.eq('userId', userId))
        .first();

      if (existingCache) {
        await ctx.db.patch(existingCache._id, syncData);
      } else {
        await ctx.db.insert('stripeSubscriptionCache', {
          ...syncData,
          createdAt: now,
        });
      }

      // Also update the existing userSubscriptions table for backward compatibility
      const planType: 'free' | 'pro' | 'enterprise' = syncData.planId;
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

      const existingSubscription = await ctx.db
        .query('userSubscriptions')
        .withIndex('by_user_id', (q) => q.eq('userId', userId))
        .first();

      if (existingSubscription) {
        await ctx.db.patch(existingSubscription._id, {
          planId: mapPlanIdToString(syncData.planId),
          planName: planType.charAt(0).toUpperCase() + planType.slice(1),
          planType,
          status: mapStripeStatusToUserStatus(syncData.status),
          features,
          usageLimits,
          currentUsage: existingSubscription.currentUsage ?? { conversationsUsed: 0, codeExecutionsUsed: 0 },
          currentPeriodStart: (syncData.currentPeriodStart || 0) * 1000, // Convert to ms
          currentPeriodEnd: (syncData.currentPeriodEnd || 0) * 1000, // Convert to ms
          resetDate: (syncData.currentPeriodEnd || 0) * 1000,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert('userSubscriptions', {
          userId,
          planId: mapPlanIdToString(syncData.planId),
          planName: planType.charAt(0).toUpperCase() + planType.slice(1),
          planType,
          status: mapStripeStatusToUserStatus(syncData.status),
          features,
          usageLimits,
          currentUsage: { conversationsUsed: 0, codeExecutionsUsed: 0 },
          currentPeriodStart: (syncData.currentPeriodStart || 0) * 1000, // Convert to ms
          currentPeriodEnd: (syncData.currentPeriodEnd || 0) * 1000, // Convert to ms
          resetDate: (syncData.currentPeriodEnd || 0) * 1000,
          createdAt: now,
          updatedAt: now,
        });
      }

      console.log('[SYNC] Successfully synced subscription for user:', userId, 'plan:', syncData.planId, 'status:', syncData.status);
      
      return {
        success: true,
        userId,
        planId: syncData.planId,
        status: syncData.status,
        subscriptionId: syncData.subscriptionId,
      };

    } catch (error) {
      console.error('[SYNC] Error syncing Stripe data:', error);
      throw new Error(`Failed to sync Stripe data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Helper function to ensure Stripe customer exists and get/create customer ID
export const ensureStripeCustomer = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if we already have a customer record
    const existingRecord = await ctx.db
      .query('stripeCustomers')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .first();
    
    if (existingRecord) {
      return { stripeCustomerId: existingRecord.stripeCustomerId };
    }

    // Need to create Stripe customer
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      throw new Error('Stripe configuration missing');
    }

    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeSecret, { apiVersion: '2025-07-30.basil' });

    try {
      // Create idempotency key to prevent duplicate customers
      const idempotencyKey = `customer_${args.userId}_${args.email.toLowerCase()}`.slice(0, 255);
      
      const customer = await stripe.customers.create(
        {
          email: args.email,
          metadata: {
            userId: args.userId,
          },
        },
        { idempotencyKey }
      );

      // Store the mapping
      await ctx.db.insert('stripeCustomers', {
        userId: args.userId,
        stripeCustomerId: customer.id,
        email: args.email,
        metadata: {
          createdViaCheckout: true,
        },
        createdAt: now,
        updatedAt: now,
      });

      return { stripeCustomerId: customer.id };

    } catch (error) {
      console.error('[ENSURE_CUSTOMER] Error creating Stripe customer:', error);
      throw new Error(`Failed to create Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Helper functions
function mapSubscriptionStatus(stripeStatus: string): 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused' | 'none' {
  switch (stripeStatus) {
    case 'incomplete': return 'incomplete';
    case 'incomplete_expired': return 'incomplete_expired';
    case 'trialing': return 'trialing';
    case 'active': return 'active';
    case 'past_due': return 'past_due';
    case 'canceled': return 'canceled';
    case 'unpaid': return 'unpaid';
    case 'paused': return 'paused';
    default: return 'none';
  }
}

function mapPriceIdToPlan(priceId: string): 'free' | 'pro' | 'enterprise' {
  const pro = [
    process.env.STRIPE_PRICE_PRO_MONTH, 
    process.env.STRIPE_PRICE_PRO_YEAR,
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_YEARLY_PRICE_ID
  ].filter(Boolean);
  const enterprise = [
    process.env.STRIPE_PRICE_ENTERPRISE_MONTH, 
    process.env.STRIPE_PRICE_ENTERPRISE_YEAR,
    process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID
  ].filter(Boolean);
  
  if (enterprise.includes(priceId)) return 'enterprise';
  if (pro.includes(priceId)) return 'pro';
  return 'free';
}

function mapPlanIdToString(planId: 'free' | 'pro' | 'enterprise'): string {
  return planId;
}

// Helper function to map Stripe statuses to userSubscriptions allowed statuses
function mapStripeStatusToUserStatus(stripeStatus: string): "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "none" {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'canceled':
      return 'canceled';
    case 'past_due':
      return 'past_due';
    case 'incomplete':
      return 'incomplete';
    case 'trialing':
      return 'trialing';
    case 'incomplete_expired':
      return 'incomplete'; // Map to incomplete
    case 'unpaid':
      return 'past_due'; // Map to past_due
    case 'paused':
      return 'canceled'; // Map to canceled
    case 'none':
      return 'none';
    default:
      return 'none'; // Default fallback
  }
}

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