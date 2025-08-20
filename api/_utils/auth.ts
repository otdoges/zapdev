import type { VercelRequest } from '@vercel/node';
import { parse as parseCookie } from 'cookie';

export type VerifiedClerkToken = { sub?: string; email?: string };

export function getBearerOrSessionToken(req: VercelRequest): string | null {
  const authorizationHeader = Array.isArray(req.headers['authorization'])
    ? req.headers['authorization'][0]
    : req.headers['authorization'];

  if (authorizationHeader && typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
    const token = authorizationHeader.slice(7).trim();
    if (token) return token;
  }

  const cookieHeader = Array.isArray(req.headers['cookie'])
    ? req.headers['cookie'].join('; ')
    : req.headers['cookie'];

  if (typeof cookieHeader === 'string' && cookieHeader.length > 0) {
    const cookies = parseCookie(cookieHeader);
    const raw = cookies['__session'];
    if (typeof raw === 'string' && raw.length > 0) {
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }

  return null;
}

export async function verifyClerkToken(
  token: string,
  issuer: string,
  audience?: string
): Promise<VerifiedClerkToken> {
  const { verifyToken } = await import('@clerk/backend');
  const options: { issuer: string; audience?: string } = { issuer };
  if (audience) options.audience = audience;
  const verified = await verifyToken(token, options);
  return verified as VerifiedClerkToken;
}

export async function verifyAuth(req: { headers: Headers }): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return { success: false, error: 'Empty token' };
    }

    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (!issuer) {
      return { success: false, error: 'Missing CLERK_JWT_ISSUER_DOMAIN' };
    }

    const audience = process.env.CLERK_JWT_AUDIENCE;
    const verified = await verifyClerkToken(token, issuer, audience);
    
    if (!verified.sub) {
      return { success: false, error: 'Invalid token payload' };
    }

    return { success: true, userId: verified.sub };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return { success: false, error: 'Token verification failed' };
  }
}


