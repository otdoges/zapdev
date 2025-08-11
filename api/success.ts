import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerOrSessionToken, verifyClerkToken, type VerifiedClerkToken } from './_utils/auth';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { ensureStripeCustomerByUser } from './_utils/stripe';
import Stripe from 'stripe';

function withCors(res: VercelResponse, allowOrigin?: string) {
  const origin = allowOrigin ?? process.env.PUBLIC_ORIGIN ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'private, no-store');
  return res;
}

// token extraction centralized in ./_utils/auth

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

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET, OPTIONS');
    return withCors(res, allowedOrigin).status(405).send('Method Not Allowed');
  }

  try {
    // Get userId from token or query parameter
    let userId: string | undefined;
    
    // Try to get from auth token first
    const token = getBearerOrSessionToken(req);
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    
    if (token && issuer) {
      try {
        const audience = process.env.CLERK_JWT_AUDIENCE;
        const verified = await verifyClerkToken(token, issuer, audience);
        userId = verified?.sub;
        console.log('[SUCCESS] Token verified for user:', userId);
      } catch (error) {
        console.error('[SUCCESS] Token verification failed:', error);
      }
    }

    // Fall back to query parameter (for the localStorage pattern from pricing page)
    if (!userId) {
      const queryUserId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId;
      if (typeof queryUserId === 'string' && queryUserId.length > 0) {
        userId = queryUserId;
        console.log('[SUCCESS] Using query parameter userId:', userId);
      }
    }

    if (!userId) {
      console.error('[SUCCESS] No userId found');
      return withCors(res, allowedOrigin).status(400).json({ 
        error: 'No user ID provided. Please ensure you are logged in.', 
        success: false 
      });
    }

    // Initialize Stripe and find customer
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      console.error('[SUCCESS] Missing STRIPE_SECRET_KEY');
      return withCors(res, allowedOrigin).status(500).json({ 
        error: 'Server configuration error', 
        success: false 
      });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
    
    // Find the customer ID for this user
    const customerId = await ensureStripeCustomerByUser(stripe, userId);
    if (!customerId) {
      console.error('[SUCCESS] No Stripe customer found for user:', userId);
      // Instead of failing, just return success - they might be on free plan
      return withCors(res, allowedOrigin).status(200).json({ 
        success: true,
        message: 'No subscription found - remaining on free plan',
        planId: 'free',
        status: 'none',
      });
    }

    // Initialize Convex client and sync data
    const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
    if (!convexUrl) {
      console.error('[SUCCESS] Missing Convex URL');
      return withCors(res, allowedOrigin).status(500).json({ 
        error: 'Server configuration error', 
        success: false 
      });
    }

    const client = new ConvexHttpClient(convexUrl);
    
    // Sync the stripe data to Convex
    console.log('[SUCCESS] Syncing data for user:', userId, 'customer:', customerId);
    const syncResult = await client.mutation(api.users.syncStripeDataToConvex, {
      stripeCustomerId: customerId,
      userId,
      source: 'success',
    });

    console.log('[SUCCESS] Successfully synced data for user:', userId, 'result:', syncResult);

    return withCors(res, allowedOrigin).status(200).json({
      success: true,
      userId,
      planId: syncResult.planId,
      status: syncResult.status,
      message: 'Subscription successfully synced',
    });

  } catch (error) {
    console.error('[SUCCESS] Error in success endpoint:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    
    return withCors(res, allowedOrigin).status(500).json({
      success: false,
      error: `Sync failed: ${message}`,
    });
  }
}


