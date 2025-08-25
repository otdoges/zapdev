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
    // Require authentication
    const rawAuthHeader = Array.isArray(req.headers['authorization'])
      ? req.headers['authorization'][0]
      : req.headers['authorization'];
    const authorization = typeof rawAuthHeader === 'string' ? rawAuthHeader : undefined;
    if (!authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const authResult = await verifyAuth({
      headers: new Headers({ authorization })
    });
    if (!authResult.success || !authResult.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get subscription status from Polar.sh API
    const baseUrl = process.env.PUBLIC_ORIGIN || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/get-subscription`, {
      headers: { Authorization: authorization },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logSanitizedError('Subscription fetch failed', new Error(errorText));
      
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
    logSanitizedError('Success endpoint error', error instanceof Error ? error : new Error(String(error)));

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process success callback'
    });
  }
}
