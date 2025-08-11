import type { VercelRequest, VercelResponse } from '@vercel/node';
import { autumnHandler } from 'autumn-js/backend';
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

  // Handle both /api/autumn and /api/autumn/* routes
  // The URL might come in as just /api/autumn or with additional path
  const url = req.url || '';
  if (!url.startsWith('/api/autumn')) {
    return withCors(res, allowedOrigin).status(404).json({ 
      error: 'Not Found',
      message: 'This endpoint only handles /api/autumn/* routes' 
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

    // Parse the request body for non-GET requests
    let body = null;
    if (req.method !== 'GET') {
      body = req.body;
    }

    // Call the Autumn handler
    const { statusCode, response } = await autumnHandler({
      customerId: authenticatedUserId,
      customerData: { 
        name: userEmail?.split('@')[0] || '', 
        email: userEmail || '' 
      },
      request: {
        url: req.url || '',
        method: req.method || 'GET',
        body: body,
      },
    });

    return withCors(res, allowedOrigin).status(statusCode).json(response);

  } catch (error) {
    console.error('Autumn API error:', error);
    return withCors(res, allowedOrigin).status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
}