import { describe, it, expect } from '@jest/globals';
import { createLocalJWKSet, jwtVerify } from 'jose';
import { extractResetToken } from '../src/lib/reset-password';
import { getJWKS, signConvexJWT } from '../src/lib/convex-auth';
import {
  buildSubscriptionIdempotencyKey,
  extractUserIdFromMetadata,
  sanitizeSubscriptionMetadata,
} from '../src/lib/subscription-metadata';

describe('Convex Auth helpers (Better Auth)', () => {
  describe('subscription metadata parsing', () => {
    it('extracts and trims userId from metadata objects', () => {
      const { metadata, userId } = extractUserIdFromMetadata({ userId: '  user_123  ', plan: 'pro' });
      expect(userId).toBe('user_123');
      expect(metadata).toEqual({ userId: '  user_123  ', plan: 'pro' });
    });

    it('guards against unexpected metadata shapes', () => {
      expect(sanitizeSubscriptionMetadata(null)).toEqual({});
      expect(sanitizeSubscriptionMetadata(42)).toEqual({});
      expect(extractUserIdFromMetadata({} as any).userId).toBe('');
    });

    it('builds stable idempotency keys', () => {
      const key = buildSubscriptionIdempotencyKey({
        id: 'sub_1',
        updatedAt: '2024-01-01T00:00:00Z',
        status: 'active',
      });
      expect(key).toBe('sub_1:1704067200000:active');
    });
  });

  describe('Convex JWT signing', () => {
    it('signs JWTs with a kid and verifies against JWKS', async () => {
      const token = await signConvexJWT({ sub: 'user_abc' });
      const jwks = await getJWKS();
      const jwkSet = createLocalJWKSet(jwks as any);

      const { payload, protectedHeader } = await jwtVerify(token, jwkSet, {
        audience: 'convex',
        issuer: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
      });

      expect(payload.sub).toBe('user_abc');
      expect(protectedHeader.kid).toBeDefined();
    });
  });

  describe('reset password tokens', () => {
    it('prefers token over alternate param names', () => {
      const params = new URLSearchParams({
        oobCode: 'legacy',
        code: 'maybe',
        token: 'canonical',
      });

      expect(extractResetToken(params)).toBe('canonical');
    });

    it('falls back to code variants when token is missing', () => {
      expect(extractResetToken(new URLSearchParams({ code: 'abc' }))).toBe('abc');
      expect(extractResetToken(new URLSearchParams({ oobCode: 'xyz' }))).toBe('xyz');
      expect(extractResetToken(new URLSearchParams())).toBeNull();
    });
  });
});
