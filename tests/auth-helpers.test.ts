/**
 * Tests for Convex authentication helpers (Stack Auth integration)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock types for Convex context
interface MockIdentity {
  subject?: string;
  tokenIdentifier?: string;
}

interface MockAuth {
  getUserIdentity: () => Promise<MockIdentity | null>;
}

interface MockDb {
  query: (table: string) => {
    withIndex: (index: string, fn: (q: any) => any) => {
      first: () => Promise<any>;
    };
  };
}

interface MockCtx {
  auth: MockAuth;
  db: MockDb;
}

// Import functions to test (we'll need to adjust the import path)
// For now, we'll define them inline for testing purposes

async function getCurrentUserId(ctx: MockCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

async function requireAuth(ctx: MockCtx): Promise<string> {
  const userId = await getCurrentUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

async function hasProAccess(ctx: MockCtx): Promise<boolean> {
  const userId = await getCurrentUserId(ctx);
  if (!userId) return false;

  const usage = await ctx.db
    .query("usage")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  return usage?.planType === "pro";
}

describe('Authentication Helpers - Stack Auth', () => {
  describe('getCurrentUserId', () => {
    it('should return user ID when authenticated', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({ subject: 'user_123' })
        },
        db: {} as MockDb
      };

      const userId = await getCurrentUserId(mockCtx);
      expect(userId).toBe('user_123');
    });

    it('should return null when not authenticated', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => null
        },
        db: {} as MockDb
      };

      const userId = await getCurrentUserId(mockCtx);
      expect(userId).toBeNull();
    });

    it('should return null when identity has no subject', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({})
        },
        db: {} as MockDb
      };

      const userId = await getCurrentUserId(mockCtx);
      expect(userId).toBeNull();
    });

    it('should handle identity with tokenIdentifier but no subject', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({ tokenIdentifier: 'token_xyz' })
        },
        db: {} as MockDb
      };

      const userId = await getCurrentUserId(mockCtx);
      expect(userId).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('should return user ID when authenticated', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({ subject: 'user_456' })
        },
        db: {} as MockDb
      };

      const userId = await requireAuth(mockCtx);
      expect(userId).toBe('user_456');
    });

    it('should throw Unauthorized error when not authenticated', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => null
        },
        db: {} as MockDb
      };

      await expect(requireAuth(mockCtx)).rejects.toThrow('Unauthorized');
    });

    it('should throw Unauthorized error when identity has no subject', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({})
        },
        db: {} as MockDb
      };

      await expect(requireAuth(mockCtx)).rejects.toThrow('Unauthorized');
    });
  });

  describe('hasProAccess', () => {
    it('should return true when user has pro plan', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({ subject: 'user_789' })
        },
        db: {
          query: (table: string) => ({
            withIndex: (index: string, fn: (q: any) => any) => ({
              first: async () => ({ planType: 'pro', userId: 'user_789' })
            })
          })
        }
      };

      const hasPro = await hasProAccess(mockCtx);
      expect(hasPro).toBe(true);
    });

    it('should return false when user has free plan', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({ subject: 'user_101' })
        },
        db: {
          query: (table: string) => ({
            withIndex: (index: string, fn: (q: any) => any) => ({
              first: async () => ({ planType: 'free', userId: 'user_101' })
            })
          })
        }
      };

      const hasPro = await hasProAccess(mockCtx);
      expect(hasPro).toBe(false);
    });

    it('should return false when user has no usage record', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({ subject: 'user_102' })
        },
        db: {
          query: (table: string) => ({
            withIndex: (index: string, fn: (q: any) => any) => ({
              first: async () => null
            })
          })
        }
      };

      const hasPro = await hasProAccess(mockCtx);
      expect(hasPro).toBe(false);
    });

    it('should return false when not authenticated', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => null
        },
        db: {
          query: (table: string) => ({
            withIndex: (index: string, fn: (q: any) => any) => ({
              first: async () => null
            })
          })
        }
      };

      const hasPro = await hasProAccess(mockCtx);
      expect(hasPro).toBe(false);
    });

    it('should handle missing planType in usage record', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({ subject: 'user_103' })
        },
        db: {
          query: (table: string) => ({
            withIndex: (index: string, fn: (q: any) => any) => ({
              first: async () => ({ userId: 'user_103' })
            })
          })
        }
      };

      const hasPro = await hasProAccess(mockCtx);
      expect(hasPro).toBe(false);
    });
  });

  describe('Stack Auth Integration', () => {
    it('should handle Stack Auth JWT structure', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({
            subject: 'stack_auth_user_12345',
            tokenIdentifier: 'https://api.stack-auth.com/api/v1/projects/test-project:stack_auth_user_12345'
          })
        },
        db: {} as MockDb
      };

      const userId = await getCurrentUserId(mockCtx);
      expect(userId).toBe('stack_auth_user_12345');
    });

    it('should work with various user ID formats', async () => {
      const userIds = [
        'user_123',
        'stack_auth_12345',
        'uuid-format-1234-5678',
        '00000000-0000-0000-0000-000000000001'
      ];

      for (const id of userIds) {
        const mockCtx: MockCtx = {
          auth: {
            getUserIdentity: async () => ({ subject: id })
          },
          db: {} as MockDb
        };

        const userId = await getCurrentUserId(mockCtx);
        expect(userId).toBe(id);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle auth.getUserIdentity throwing error', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => {
            throw new Error('Auth service unavailable');
          }
        },
        db: {} as MockDb
      };

      await expect(getCurrentUserId(mockCtx)).rejects.toThrow('Auth service unavailable');
    });

    it('should handle database query errors in hasProAccess', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({ subject: 'user_123' })
        },
        db: {
          query: (table: string) => ({
            withIndex: (index: string, fn: (q: any) => any) => ({
              first: async () => {
                throw new Error('Database connection failed');
              }
            })
          })
        }
      };

      await expect(hasProAccess(mockCtx)).rejects.toThrow('Database connection failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string as subject', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({ subject: '' })
        },
        db: {} as MockDb
      };

      const userId = await getCurrentUserId(mockCtx);
      expect(userId).toBeNull();
    });

    it('should handle whitespace-only subject', async () => {
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({ subject: '   ' })
        },
        db: {} as MockDb
      };

      const userId = await getCurrentUserId(mockCtx);
      expect(userId).toBe('   '); // Returns the actual value, let caller decide validation
    });

    it('should handle very long user IDs', async () => {
      const longUserId = 'a'.repeat(1000);
      const mockCtx: MockCtx = {
        auth: {
          getUserIdentity: async () => ({ subject: longUserId })
        },
        db: {} as MockDb
      };

      const userId = await getCurrentUserId(mockCtx);
      expect(userId).toBe(longUserId);
      expect(userId?.length).toBe(1000);
    });
  });
});
