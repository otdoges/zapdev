import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerOrSessionToken, verifyClerkToken } from './_utils/auth';
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

  // Only allow POST requests
  if (req.method !== 'POST') {
    return withCors(res, allowedOrigin).status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only POST requests are allowed' 
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

    // Parse request body to get the plan information
    const { planId, period = 'month' } = req.body;
    
    if (!planId) {
      return withCors(res, allowedOrigin).status(400).json({
        error: 'Bad Request',
        message: 'planId is required'
      });
    }

    if (planId === 'free') {
      return withCors(res, allowedOrigin).status(400).json({
        error: 'Bad Request',
        message: 'Free plan does not require checkout'
      });
    }

    if (planId === 'enterprise') {
      return withCors(res, allowedOrigin).status(400).json({
        error: 'Bad Request',
        message: 'Enterprise plan is not available for direct purchase. Please contact our sales team.',
        contactEmail: process.env.ENTERPRISE_CONTACT_EMAIL || 'enterprise@zapdev.link'
      });
    }

    try {
      // Initialize Stripe
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY environment variable is not set');
      }

      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-07-30.basil',
      });

      // Map planId to Stripe price IDs based on period
      const priceIdMap: Record<string, Record<string, string>> = {
        'pro': {
          'month': process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
          'year': process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
        },
        'enterprise': {
          'month': process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
          'year': process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly',
        },
        'starter': {
          'month': process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
          'year': process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly',
        },
      };

      const stripePriceId = priceIdMap[planId]?.[period];
      if (!stripePriceId) {
        return withCors(res, allowedOrigin).status(400).json({
          error: 'Invalid Plan',
          message: `Plan ${planId} with period ${period} is not supported`
        });
      }

      // Create or get Stripe customer
      let customer: Stripe.Customer;
      try {
        // Try to find existing customer by email
        const existingCustomers = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
          console.log('Found existing Stripe customer:', customer.id);
        } else {
          // Create new customer
          customer = await stripe.customers.create({
            email: userEmail,
            metadata: {
              userId: authenticatedUserId,
            },
          });
          console.log('Created new Stripe customer:', customer.id);
        }
      } catch (customerError) {
        console.error('Error handling Stripe customer:', customerError);
        throw new Error('Failed to create or retrieve customer');
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.PUBLIC_ORIGIN || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.PUBLIC_ORIGIN || 'http://localhost:5173'}/pricing`,
        metadata: {
          userId: authenticatedUserId,
          planId: planId,
        },
      });

      console.log('Created Stripe checkout session:', session.id, 'for user:', authenticatedUserId);

      return withCors(res, allowedOrigin).status(200).json({
        url: session.url,
        customer_id: authenticatedUserId,
        session_id: session.id,
      });

    } catch (stripeError) {
      console.error('Error creating Stripe checkout session:', stripeError);
      return withCors(res, allowedOrigin).status(500).json({
        error: 'Checkout Error',
        message: stripeError instanceof Error ? stripeError.message : 'Failed to create checkout session'
      });
    }

  } catch (error) {
    console.error('Create checkout session API error:', error);
    return withCors(res, allowedOrigin).status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
