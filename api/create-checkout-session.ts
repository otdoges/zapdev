import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerOrSessionToken, verifyClerkToken } from './_utils/auth';
import { Polar } from '@polar-sh/sdk';

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
      // Initialize Polar.sh
      const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
      if (!polarAccessToken) {
        throw new Error('POLAR_ACCESS_TOKEN environment variable is not set');
      }

      const polar = new Polar({
        accessToken: polarAccessToken,
        server: process.env.NODE_ENV === 'production' ? undefined : 'sandbox'
      });

      // Map planId to Polar.sh product IDs based on period
      const productIdMap: Record<string, Record<string, string>> = {
        'pro': {
          'month': process.env.POLAR_PRODUCT_PRO_MONTH_ID || 'pro_monthly',
          'year': process.env.POLAR_PRODUCT_PRO_YEAR_ID || 'pro_yearly',
        },
        'enterprise': {
          'month': process.env.POLAR_PRODUCT_ENTERPRISE_MONTH_ID || 'enterprise_monthly',
          'year': process.env.POLAR_PRODUCT_ENTERPRISE_YEAR_ID || 'enterprise_yearly',
        },
        'starter': {
          'month': process.env.POLAR_PRODUCT_STARTER_MONTH_ID || 'starter_monthly',
          'year': process.env.POLAR_PRODUCT_STARTER_YEAR_ID || 'starter_yearly',
        },
      };

      const polarProductId = productIdMap[planId as keyof typeof productIdMap]?.[period as keyof typeof productIdMap[keyof typeof productIdMap]];
      if (!polarProductId) {
        return withCors(res, allowedOrigin).status(400).json({
          error: 'Invalid Plan',
          message: `Plan ${planId} with period ${period} is not supported`
        });
      }

      // Create Polar.sh checkout session
      const checkout = await polar.checkouts.create({
        products: [polarProductId],
        customerBillingAddress: {
          country: 'US' // Default, can be customized based on user location
        },
        metadata: {
          userId: authenticatedUserId,
          planId: planId,
          period: period,
        },
        successUrl: `${process.env.PUBLIC_ORIGIN || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
        customerEmail: userEmail,
      });

      console.log('Created Polar.sh checkout session:', checkout.id, 'for user:', authenticatedUserId);

      return withCors(res, allowedOrigin).status(200).json({
        url: checkout.url,
        customer_id: authenticatedUserId,
        session_id: checkout.id,
      });

    } catch (polarError) {
      console.error('Error creating Polar.sh checkout session:', polarError);
      return withCors(res, allowedOrigin).status(500).json({
        error: 'Checkout Error',
        message: polarError instanceof Error ? polarError.message : 'Failed to create checkout session'
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
