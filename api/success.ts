import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_utils/auth';
import { logSanitizedError } from '../src/utils/error-sanitizer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { userId } = body || {};

    // Validate userId in request body
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid userId in request body' 
      });
    }

    // Verify authentication (optional - for additional security)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const authResult = await verifyAuth({ 
        headers: new Headers(req.headers as Record<string, string>) 
      });
      
      if (!authResult.success) {
        return res.status(401).json({ error: 'Invalid authentication' });
      }

      // Verify the authenticated user matches the provided userId
      if (authResult.userId !== userId) {
        return res.status(403).json({ error: 'User ID mismatch' });
      }
    }

    // Get subscription status from Polar.sh API
    const baseUrl = process.env.PUBLIC_ORIGIN || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/get-subscription`, {
      headers: authHeader ? { Authorization: authHeader } : {},
    });

    if (!response.ok) {
      const errorText = await response.text();
      logSanitizedError('Subscription fetch failed', new Error(errorText), {
        status: response.status,
        endpoint: '/api/get-subscription'
      });
      
      // Return a basic success response even if subscription fetch fails
      return res.status(200).json({
        success: true,
        message: 'Success endpoint called, subscription sync may be delayed',
        planId: 'free',
        status: 'none'
      });
    }

    const subscription = await response.json();
    
    return res.status(200).json({
      success: true,
      message: 'Subscription status synced successfully',
      planId: subscription.planId || 'free',
      status: subscription.status || 'none'
    });

  } catch (error) {
    logSanitizedError('Success endpoint error', error instanceof Error ? error : new Error(String(error)), {
      method: req.method,
      url: req.url,
      hasUserId: !!(typeof req.body === 'object' && req.body?.userId)
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process success callback'
    });
  }
}
