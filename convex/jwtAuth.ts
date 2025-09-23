/**
 * Example Convex functions demonstrating JWT authentication with Clerk
 * This shows how to access user identity and custom claims from JWT tokens
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Query to get the current user's identity from JWT token
 * This demonstrates how to access user information in Convex functions
 */
export const getCurrentUser = query({
  handler: async (ctx) => {
    // Get user identity from JWT token
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return null;
    }
    
    return {
      tokenIdentifier: identity.tokenIdentifier,
      subject: identity.subject,
      issuer: identity.issuer,
      name: identity.name,
      email: identity.email,
      picture: identity.picture,
      givenName: identity.given_name,
      familyName: identity.family_name,
      nickname: identity.nickname,
      // Add any other custom claims you have in your JWT template
    };
  },
});

/**
 * Query to test JWT authentication and return user details
 * This is useful for debugging your JWT template setup
 */
export const testJWTAuthentication = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    return {
      isAuthenticated: !!identity,
      identity: identity ? {
        tokenIdentifier: identity.tokenIdentifier,
        subject: identity.subject,
        issuer: identity.issuer,
        allClaims: identity, // This will show all available claims
      } : null,
      timestamp: new Date().toISOString(),
    };
  },
});

/**
 * Mutation example that requires authentication
 * This shows how to protect mutations with JWT authentication
 */
export const createUserProfile = mutation({
  args: {
    displayName: v.string(),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }
    
    // You can now safely use the user's identity
    const userId = identity.subject;
    const email = identity.email;
    
    // Example: Insert user profile data
    const profileId = await ctx.db.insert('userProfiles', {
      userId,
      email: email || '',
      displayName: args.displayName,
      bio: args.bio || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return {
      success: true,
      profileId,
      userId,
      message: 'User profile created successfully',
    };
  },
});

/**
 * Query to get user profile by authenticated user's ID
 */
export const getUserProfile = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .first();
    
    return profile;
  },
});