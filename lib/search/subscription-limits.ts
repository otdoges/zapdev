/**
 * Search Subscription Limits
 * 
 * Manages search quotas and limits based on user subscription tiers.
 * Integrates with Convex database and Stripe subscriptions.
 */

import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SearchQuota {
  tier: SubscriptionTier;
  dailyLimit: number;
  monthlyLimit: number;
  advancedFeaturesEnabled: boolean;
  deepSearchEnabled: boolean;
  batchSearchEnabled: boolean;
  prioritySupport: boolean;
  customFilters: boolean;
}

export interface UserSearchUsage {
  userId: string;
  tier: SubscriptionTier;
  dailyUsage: number;
  monthlyUsage: number;
  lastResetDaily: Date;
  lastResetMonthly: Date;
  totalSearches: number;
  currentStreak: number;
}

// Subscription tier configurations
export const SEARCH_QUOTAS: Record<SubscriptionTier, SearchQuota> = {
  free: {
    tier: 'free',
    dailyLimit: 50,
    monthlyLimit: 1000,
    advancedFeaturesEnabled: false,
    deepSearchEnabled: false,
    batchSearchEnabled: false,
    prioritySupport: false,
    customFilters: false
  },
  pro: {
    tier: 'pro',
    dailyLimit: 500,
    monthlyLimit: 10000,
    advancedFeaturesEnabled: true,
    deepSearchEnabled: true,
    batchSearchEnabled: true,
    prioritySupport: true,
    customFilters: true
  },
  enterprise: {
    tier: 'enterprise',
    dailyLimit: 10000,
    monthlyLimit: 200000,
    advancedFeaturesEnabled: true,
    deepSearchEnabled: true,
    batchSearchEnabled: true,
    prioritySupport: true,
    customFilters: true
  }
};

export class SearchSubscriptionManager {
  /**
   * Get user's current subscription tier and search quota
   */
  static async getUserQuota(userId: string): Promise<SearchQuota> {
    try {
      // TODO: Implement actual user tier lookup from Convex/Stripe
      // For now, default to 'free' tier
      const userTier: SubscriptionTier = 'free'; // await this.getUserTier(userId);
      
      return SEARCH_QUOTAS[userTier];
    } catch (error) {
      console.error('Error getting user quota:', error);
      // Default to free tier on error
      return SEARCH_QUOTAS.free;
    }
  }

  /**
   * Check if user can perform a specific type of search
   */
  static async canPerformSearch(
    userId: string,
    searchType: 'standard' | 'deep' | 'batch'
  ): Promise<{
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
  }> {
    const quota = await this.getUserQuota(userId);
    const usage = await this.getUserUsage(userId);

    // Check daily limits
    if (usage.dailyUsage >= quota.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily search limit reached (${quota.dailyLimit} searches per day)`,
        upgradeRequired: quota.tier === 'free'
      };
    }

    // Check monthly limits
    if (usage.monthlyUsage >= quota.monthlyLimit) {
      return {
        allowed: false,
        reason: `Monthly search limit reached (${quota.monthlyLimit} searches per month)`,
        upgradeRequired: quota.tier === 'free'
      };
    }

    // Check feature-specific permissions
    switch (searchType) {
      case 'deep':
        if (!quota.deepSearchEnabled) {
          return {
            allowed: false,
            reason: 'Deep search requires Pro or Enterprise subscription',
            upgradeRequired: true
          };
        }
        break;
      case 'batch':
        if (!quota.batchSearchEnabled) {
          return {
            allowed: false,
            reason: 'Batch search requires Pro or Enterprise subscription',
            upgradeRequired: true
          };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Record a search usage
   */
  static async recordSearchUsage(
    userId: string,
    searchType: 'standard' | 'deep' | 'batch' = 'standard'
  ): Promise<void> {
    try {
      // TODO: Implement actual usage recording in Convex
      // This would increment daily/monthly counters and update usage stats
      console.log(`Recording search usage for ${userId}: ${searchType}`);
    } catch (error) {
      console.error('Error recording search usage:', error);
    }
  }

  /**
   * Get detailed usage statistics for a user
   */
  static async getUserUsage(userId: string): Promise<UserSearchUsage> {
    try {
      // TODO: Implement actual usage lookup from Convex
      // For now, return mock data
      return {
        userId,
        tier: 'free',
        dailyUsage: 12,
        monthlyUsage: 150,
        lastResetDaily: new Date(),
        lastResetMonthly: new Date(),
        totalSearches: 245,
        currentStreak: 5
      };
    } catch (error) {
      console.error('Error getting user usage:', error);
      // Return safe defaults
      return {
        userId,
        tier: 'free',
        dailyUsage: 0,
        monthlyUsage: 0,
        lastResetDaily: new Date(),
        lastResetMonthly: new Date(),
        totalSearches: 0,
        currentStreak: 0
      };
    }
  }

  /**
   * Get upgrade suggestions based on usage patterns
   */
  static async getUpgradeSuggestions(userId: string): Promise<{
    shouldUpgrade: boolean;
    currentTier: SubscriptionTier;
    suggestedTier: SubscriptionTier;
    reasons: string[];
    benefits: string[];
  }> {
    const quota = await this.getUserQuota(userId);
    const usage = await this.getUserUsage(userId);
    
    const reasons: string[] = [];
    const benefits: string[] = [];
    let shouldUpgrade = false;
    let suggestedTier: SubscriptionTier = quota.tier;

    // Check if user is hitting limits frequently
    if (usage.dailyUsage >= quota.dailyLimit * 0.8) {
      reasons.push('Approaching daily search limit');
      shouldUpgrade = true;
    }

    if (usage.monthlyUsage >= quota.monthlyLimit * 0.8) {
      reasons.push('Approaching monthly search limit');
      shouldUpgrade = true;
    }

    // Suggest tier based on usage patterns
    if (quota.tier === 'free' && (usage.monthlyUsage > 500 || usage.dailyUsage > 25)) {
      suggestedTier = 'pro';
      benefits.push('10x higher search limits');
      benefits.push('AI-powered deep search');
      benefits.push('Batch search capabilities');
      benefits.push('Advanced filtering options');
    } else if (quota.tier === 'pro' && (usage.monthlyUsage > 5000 || usage.dailyUsage > 200)) {
      suggestedTier = 'enterprise';
      benefits.push('Unlimited search capabilities');
      benefits.push('Priority API access');
      benefits.push('Custom integration support');
    }

    return {
      shouldUpgrade,
      currentTier: quota.tier,
      suggestedTier,
      reasons,
      benefits
    };
  }

  /**
   * Get feature comparison between tiers
   */
  static getFeatureComparison(): Record<SubscriptionTier, string[]> {
    return {
      free: [
        '50 searches per day',
        '1,000 searches per month',
        'Basic web search',
        'Standard relevance scoring',
        'Community support'
      ],
      pro: [
        '500 searches per day',
        '10,000 searches per month',
        'AI-enhanced search results',
        'Deep search capability',
        'Batch search operations',
        'Advanced filters and categories',
        'Search analytics',
        'Priority email support'
      ],
      enterprise: [
        '10,000+ searches per day',
        '200,000+ searches per month',
        'All Pro features',
        'Custom search integrations',
        'Dedicated account manager',
        'Priority API access',
        'Custom rate limits',
        '24/7 phone support'
      ]
    };
  }

  /**
   * Calculate cost per search for billing
   */
  static calculateSearchCost(tier: SubscriptionTier, searchType: 'standard' | 'deep' | 'batch'): number {
    const baseCosts = {
      free: { standard: 0, deep: 0, batch: 0 }, // Free tier is included in subscription
      pro: { standard: 0.001, deep: 0.003, batch: 0.005 }, // $0.001 per standard search
      enterprise: { standard: 0.0005, deep: 0.0015, batch: 0.002 } // Discounted rates
    };

    return baseCosts[tier][searchType];
  }
}

/**
 * React hook for subscription and usage information
 */
export function useSearchSubscription(userId?: string) {
  // TODO: Replace with actual Convex query
  // const subscription = useQuery(api.subscriptions.getUserSubscription, { userId });
  // const usage = useQuery(api.searchUsage.getUserUsage, { userId });

  // Mock data for now
  const subscription = {
    tier: 'free' as SubscriptionTier,
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };

  const usage = {
    dailyUsage: 12,
    monthlyUsage: 150,
    dailyLimit: 50,
    monthlyLimit: 1000
  };

  return {
    subscription,
    usage,
    quota: SEARCH_QUOTAS[subscription?.tier || 'free'],
    isLoading: false
  };
}

/**
 * Utility functions
 */
export function formatSearchLimit(limit: number): string {
  if (limit >= 1000) {
    return `${(limit / 1000).toFixed(0)}K`;
  }
  return limit.toString();
}

export function getTimeUntilReset(resetDate: Date): string {
  const now = new Date();
  const diff = resetDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Reset available';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function calculateUsagePercentage(used: number, limit: number): number {
  return Math.min((used / limit) * 100, 100);
}