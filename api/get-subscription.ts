import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerOrSessionToken, verifyClerkToken } from './_utils/auth';
import { Polar } from '@polar-sh/sdk';
import { 
  UserSubscription,
  PlanType,
  PLAN_FEATURES,
  getPlanDisplayName
} from '../src/types/polar';

function withCors(res: VercelResponse, allowOrigin?: string) {
  const origin = allowOrigin ?? process.env.PUBLIC_ORIGIN ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'private, no-store');
  return res;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS for both www and non-www domains
  const requestOrigin = req.headers.origin as string | undefined;
  let allowedOrigin = process.env.PUBLIC_ORIGIN ?? '*';
  
  if (requestOrigin) {
    // Allow both www and non-www versions of zapdev.link
    const isZapDevDomain = requestOrigin.includes('zapdev.link') || 
                          requestOrigin.includes('localhost') || 
                          requestOrigin.includes('127.0.0.1');
    
    if (isZapDevDomain) {
      allowedOrigin = requestOrigin;
    }
  }

  if (req.method === 'OPTIONS') {
    withCors(res, allowedOrigin);
    return res.status(204).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return withCors(res, allowedOrigin).status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only GET requests are allowed' 
    });
  }

  try {
    // Get and verify Clerk authentication
    const token = getBearerOrSessionToken(req);
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;

    let authenticatedUserId: string | undefined;
    let userEmail: string | undefined;
    
    if (token && issuer) {
      try {
        const audience = process.env.CLERK_JWT_AUDIENCE;
        const verified = await verifyClerkToken(token, issuer, audience);
        authenticatedUserId = verified?.sub;
        userEmail = verified?.email as string | undefined;
        console.log('Token verified for user:', authenticatedUserId, 'email:', userEmail);
      } catch (error) {
        console.error('Token verification failed:', error);
        return withCors(res, allowedOrigin).status(401).json({ 
          error: 'Unauthorized',
          message: 'Authentication required' 
        });
      }
    } else {
      console.log('Missing token or issuer:', { hasToken: !!token, hasIssuer: !!issuer });
      return withCors(res, allowedOrigin).status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    if (!authenticatedUserId) {
      return withCors(res, allowedOrigin).status(401).json({ 
        error: 'Unauthorized',
        message: 'User ID not found in token' 
      });
    }

    try {
      // Initialize Polar.sh
      const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
      if (!polarAccessToken) {
        // If no Polar access token, return free plan
        console.warn('POLAR_ACCESS_TOKEN not set, defaulting to free plan');
        const freeSubscriptionData: UserSubscription = {
          planId: 'free',
          planName: 'Free',
          status: 'none',
          features: PLAN_FEATURES.free,
          currentPeriodStart: Date.now(),
          currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        };
        return withCors(res, allowedOrigin).status(200).json(freeSubscriptionData);
      }

      const polar = new Polar({
        accessToken: polarAccessToken,
        server: process.env.NODE_ENV === 'production' ? undefined : 'sandbox'
      });

      // Get user's subscriptions from Polar.sh
      // Note: This is a simplified implementation. In production, you'd want to:
      // 1. Store customer ID mapping in your database
      // 2. Query subscriptions by customer ID or metadata
      // 3. Handle pagination and filtering properly
      
      try {
        const subscriptions = await polar.subscriptions.list({
          limit: 100 // Get recent subscriptions
        });
        
        // Find active subscription for this user
        // Look for subscriptions with matching userId in metadata
        const subscriptionList = Array.isArray(subscriptions) ? subscriptions : [];
        const activeSubscription = subscriptionList.find((sub: { status: string; metadata?: { userId?: string } }) => 
          (sub.status === 'active' || sub.status === 'trialing') && 
          sub.metadata?.userId === authenticatedUserId
        );
        
        if (!activeSubscription) {
          // No active subscription found, return free plan
          const freeSubscriptionData: UserSubscription = {
            planId: 'free',
            planName: 'Free',
            status: 'none',
            features: PLAN_FEATURES.free,
            currentPeriodStart: Date.now(),
            currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
          };
          return withCors(res, allowedOrigin).status(200).json(freeSubscriptionData);
        }

        // Determine plan ID from subscription metadata or product mapping
        const metadataPlanId = activeSubscription.metadata?.planId;
        const planId = (metadataPlanId && ['free', 'starter', 'pro', 'enterprise'].includes(metadataPlanId) 
          ? metadataPlanId as PlanType 
          : 'pro');

        const subscriptionData: UserSubscription = {
          planId,
          planName: getPlanDisplayName(planId),
          status: activeSubscription.status,
          features: PLAN_FEATURES[planId as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.free,
          currentPeriodStart: new Date(activeSubscription.currentPeriodStart).getTime(),
          currentPeriodEnd: new Date(activeSubscription.currentPeriodEnd).getTime(),
          cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd || false,
        };

        console.log('Retrieved Polar.sh subscription data for user:', authenticatedUserId, 'plan:', planId);
        return withCors(res, allowedOrigin).status(200).json(subscriptionData);
        
      } catch (polarApiError) {
        console.warn('Failed to fetch subscriptions from Polar.sh API:', polarApiError);
        
        // Fallback to free plan if API call fails
        const fallbackData: UserSubscription = {
          planId: 'free',
          planName: 'Free',
          status: 'none',
          features: PLAN_FEATURES.free,
          currentPeriodStart: Date.now(),
          currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        };
        return withCors(res, allowedOrigin).status(200).json(fallbackData);
      }

    } catch (polarError) {
      console.error('Error fetching Polar.sh subscription:', polarError);

      // Fallback to default subscription data if Polar.sh API fails
      const fallbackData: UserSubscription = {
        planId: 'free',
        planName: 'Free',
        status: 'none',
        features: PLAN_FEATURES.free,
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      };

      return withCors(res, allowedOrigin).status(200).json(fallbackData);
    }

  } catch (error) {
    console.error('Get subscription API error:', error);
    return withCors(res, allowedOrigin).status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
}
