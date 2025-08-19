import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerOrSessionToken, verifyClerkToken } from './_utils/auth';

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

    try {
      // For Polar.sh, customer portal access works differently than Stripe
      // Polar.sh typically redirects users to their dashboard for subscription management
      
      try {
        // Initialize Polar.sh (optional, for future customer portal API if available)
        const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
        if (polarAccessToken) {
          // const polar = new Polar({
          //   accessToken: polarAccessToken,
          //   server: process.env.NODE_ENV === 'production' ? undefined : 'sandbox'
          // });
          
          // If Polar.sh introduces a customer portal API in the future, use it here
          // const portalSession = await polar.customerPortal.create({...});
        }
        
        // For now, redirect to Polar.sh dashboard
        const portalUrl = process.env.NODE_ENV === 'production' 
          ? 'https://polar.sh/dashboard/subscriptions'
          : 'https://sandbox.polar.sh/dashboard/subscriptions';
        
        console.log('Redirecting to Polar.sh dashboard for user:', authenticatedUserId);

        return withCors(res, allowedOrigin).status(200).json({
          url: portalUrl,
          customer_id: authenticatedUserId,
          message: 'Redirecting to subscription management dashboard'
        });
        
      } catch (polarError) {
        console.warn('Polar.sh dashboard redirect failed:', polarError);
        
        // Fallback: redirect to app settings page
        const fallbackUrl = `${process.env.PUBLIC_ORIGIN || 'http://localhost:5173'}/settings?tab=billing`;
        
        return withCors(res, allowedOrigin).status(200).json({
          url: fallbackUrl,
          customer_id: authenticatedUserId,
          message: 'Redirecting to billing settings. Contact support for subscription changes.'
        });
      }

    } catch (portalError) {
      console.error('Error creating portal session:', portalError);
      return withCors(res, allowedOrigin).status(500).json({
        error: 'Portal Error',
        message: portalError instanceof Error ? portalError.message : 'Failed to create portal session'
      });
    }

  } catch (error) {
    console.error('Create portal session API error:', error);
    return withCors(res, allowedOrigin).status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
