import { NextResponse } from 'next/server';

export type UsageLimitError = {
  allowed: false;
  error: {
    code: string;
    message: string;
    featureId: string;
  };
};

export type UsageLimitSuccess = {
  allowed: true;
  remaining?: number;
  resetAt?: Date;
};

export type UsageLimitResult = UsageLimitSuccess | UsageLimitError;

/**
 * Creates a standardized response when usage limits are exceeded
 */
export function createUsageLimitResponse(error: UsageLimitError['error']) {
  return NextResponse.json(
    {
      error: {
        ...error,
        redirect: '/pricing',
        type: 'USAGE_LIMIT_EXCEEDED'
      }
    },
    { status: 429 } // Too Many Requests
  );
}

/**
 * Handles usage limit checking and response creation
 */
export function handleUsageLimit(result: UsageLimitResult, featureId: string) {
  if (!result.allowed) {
    return createUsageLimitResponse({
      code: result.error.code || 'USAGE_LIMIT_EXCEEDED',
      message: result.error.message || `You have exceeded your usage limit for ${featureId}. Please upgrade your plan to continue.`,
      featureId
    });
  }
  return null;
}

/**
 * Feature ID constants for consistent usage tracking
 */
export const FEATURE_IDS = {
  AI_MESSAGES: 'ai_messages',
  SANDBOX_CREATION: 'sandbox_creation', 
  CODE_EXECUTION: 'code_execution',
  FILE_OPERATIONS: 'file_operations',
  AUTONOMOUS_AGENTS: 'autonomous_agents',
  SEARCH_QUERIES: 'search_queries',
  DEPLOYMENTS: 'deployments',
  STORAGE: 'storage'
} as const;

export type FeatureId = typeof FEATURE_IDS[keyof typeof FEATURE_IDS];

/**
 * Client-side redirect utility for usage limits
 */
export function redirectToPricing() {
  if (typeof window !== 'undefined') {
    window.location.href = '/pricing';
  }
}