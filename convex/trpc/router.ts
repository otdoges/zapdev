import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
// Stripe calls are handled in API routes with proper auth verification.

type ClerkJwtPayload = {
  sub?: string;
  email?: string;
};

async function verifyClerkJwt(token: string): Promise<{ id: string; email?: string } | null> {
  try {
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (!issuer) throw new Error('Missing CLERK_JWT_ISSUER_DOMAIN');
    const audience = process.env.CLERK_JWT_AUDIENCE;
    const { verifyToken } = await import('@clerk/backend');
    const options: { jwtKey?: string; audience?: string } = { jwtKey: issuer };
    if (audience) options.audience = audience;
    const verified = (await verifyToken(token, options)) as ClerkJwtPayload;
    const sub = verified.sub;
    const email = verified.email;
    if (!sub) return null;
    return { id: sub, email };
  } catch (error) {
    console.error('verifyClerkJwt failed', error);
    return null;
  }
}

// Define the context interface
interface Context {
  authToken?: string;
  user?: {
    id: string;
    email?: string;
  };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Optional: allow adapter to construct context from Request headers
export async function createContext(opts: { req: { headers: Headers } }): Promise<Context> {
  const authHeader = opts.req.headers.get('authorization') || opts.req.headers.get('Authorization');
  const token = typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : undefined;
  return { authToken: token };
}

// Create a procedure that requires authentication
export const protectedProcedure = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    const authToken = ctx.authToken;
    if (!authToken) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Missing bearer token' });
    }
    const verified = await verifyClerkJwt(authToken);
    if (!verified) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
    }

    return next({
      ctx: {
        ...ctx,
        user: { id: verified.id, email: verified.email },
      },
    });
  })
);

// User procedures
const userRouter = router({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    // This would call a Convex query
    // For now returning mock data
    return {
      id: ctx.user!.id,
      email: ctx.user!.email,
      fullName: 'John Doe',
      avatarUrl: null,
      username: 'johndoe',
      bio: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      fullName: z.string().optional(),
      bio: z.string().optional(),
      avatarUrl: z.string().optional(),
    }))
    .mutation(async () => {
      // This would call a Convex mutation
      return { success: true };
    }),
});

// Chat procedures
const chatRouter = router({
  // Get all chats for current user
  getChats: protectedProcedure.query(async () => {
    // This would call a Convex query
    return [];
  }),

  // Create a new chat
  createChat: protectedProcedure
    .input(z.object({
      title: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // This would call a Convex mutation
      return {
        id: 'new-chat-id',
        title: input.title,
        userId: ctx.user!.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }),

  // Update chat
  updateChat: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string(),
    }))
    .mutation(async () => {
      // This would call a Convex mutation
      return { success: true };
    }),

  // Delete chat
  deleteChat: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async () => {
      // This would call a Convex mutation
      return { success: true };
    }),
});

// Message procedures
const messageRouter = router({
  // Get messages for a chat
  getMessages: protectedProcedure
    .input(z.object({
      chatId: z.string(),
    }))
    .query(async () => {
      // This would call a Convex query
      return [];
    }),

  // Send a message
  sendMessage: protectedProcedure
    .input(z.object({
      chatId: z.string(),
      content: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
    }))
    .mutation(async ({ input, ctx }) => {
      // This would call a Convex mutation
      return {
        id: 'new-message-id',
        chatId: input.chatId,
        userId: ctx.user!.id,
        content: input.content,
        role: input.role,
        createdAt: Date.now(),
      };
    }),
});

// AI Model procedures
const aiModelRouter = router({
  // Get all available AI models
  getModels: publicProcedure.query(async () => {
    // This would call a Convex query
    return [
      {
        id: 'model-1',
        name: 'OpenAI OSS 120B',
        provider: 'groq',
        modelId: 'openai/gpt-oss-120b',
        description: 'Primary Groq model',
        maxTokens: 8192,
        temperature: 0.7,
        isActive: true,
        createdAt: Date.now(),
      },
      {
        id: 'model-2',
        name: 'Qwen3 Coder Free',
        provider: 'openrouter',
        modelId: 'qwen/qwen3-coder:free',
        description: 'Code-focused AI model (failsafe)',
        maxTokens: 4000,
        temperature: 0.7,
        isActive: true,
        createdAt: Date.now(),
      },
    ];
  }),
});

// Auth procedures
const authRouter = router({
  // Exchange Clerk code for tokens
  clerkCallback: publicProcedure
    .input(z.object({
      code: z.string(),
    }))
    .mutation(async () => {
      try {
        // This would integrate with Clerk's auth flow
        // For now returning mock data
        return {
          profile: {
            id: 'user-id',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            picture: null,
          },
          idToken: 'mock-id-token',
          accessToken: 'mock-access-token',
        };
      } catch (error) {
        console.error('Clerk callback error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process Clerk authentication',
        });
      }
    }),
});

// Billing procedures (Stripe)
const billingRouter = router({
  // Get user subscription status (delegates to API route)
  getUserSubscription: protectedProcedure.query(async ({ ctx }) => {
    try {
      const base = process.env.PUBLIC_ORIGIN;
      if (!base) throw new Error('PUBLIC_ORIGIN not set');
      const res = await fetch(`${base}/api/get-subscription`, {
        headers: { Authorization: `Bearer ${ctx.authToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch subscription');
      const sub = await res.json();
      const planId = (sub?.planId as 'free' | 'pro' | 'enterprise') || 'free';
      const features = planId === 'enterprise' ? ENTERPRISE_FEATURES : planId === 'pro' ? PRO_FEATURES : FREE_FEATURES;
      return {
        planId,
        planName: planId.charAt(0).toUpperCase() + planId.slice(1),
        status: sub?.status || 'none',
        features,
        currentPeriodStart: sub?.currentPeriodStart || Date.now(),
        currentPeriodEnd: sub?.currentPeriodEnd || Date.now(),
        cancelAtPeriodEnd: !!sub?.cancelAtPeriodEnd,
      };
    } catch (error) {
      console.error('getUserSubscription error:', error);
      return {
        planId: 'free' as const,
        planName: 'Free',
        status: 'none' as const,
        features: FREE_FEATURES,
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now(),
        cancelAtPeriodEnd: false,
      };
    }
  }),

  // Create Stripe checkout session (delegates to API route)
  createCheckoutSession: protectedProcedure
    .input(z.object({ planId: z.enum(['free', 'starter', 'pro', 'enterprise']), period: z.enum(['month', 'year']).optional().default('month') }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (input.planId === 'free') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Free plan does not require checkout' });
        }
        if (input.planId === 'enterprise') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Enterprise plan is not available for direct purchase. Please contact our sales team.'
          });
        }

        const stripeSecret = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecret || stripeSecret.trim() === '') {
           throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe configuration missing' });
         }

         // Get server-side secret for HMAC generation
         const hmacSecret = process.env.USER_ID_HMAC_SECRET;
         if (!hmacSecret || hmacSecret.trim() === '') {
           throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'HMAC secret not configured' });
         }

         const { default: Stripe } = await import('stripe');
         const stripe = new Stripe(stripeSecret);

         // Generate hashed user reference instead of exposing raw user ID
         const generateUserReference = async (userId: string): Promise<string> => {
           const encoder = new TextEncoder();
           const data = encoder.encode(userId);
           const keyData = encoder.encode(hmacSecret);
           
           // Import key for HMAC-SHA256
           const key = await crypto.subtle.importKey(
             'raw', 
             keyData, 
             { name: 'HMAC', hash: 'SHA-256' }, 
             false, 
             ['sign']
           );
           
           // Generate HMAC
           const signature = await crypto.subtle.sign('HMAC', key, data);
           const hashArray = Array.from(new Uint8Array(signature));
           const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
           
           // Return truncated hash for metadata (first 32 chars for readability)
           return `usr_${hashHex.substring(0, 32)}`;
         };

         const hashedUserId = await generateUserReference(ctx.user!.id);

         // Note: To resolve user ID from Stripe webhook metadata, use:
         // 1. Extract userRef from Stripe webhook metadata
         // 2. Query your database for users where HMAC(userId, secret) matches userRef
         // 3. Alternatively, store userRef -> userId mapping in a separate secure table
         // This ensures the original user ID is never exposed in Stripe metadata

        // Resolve price ID using existing env naming used across the app
        const resolvePriceId = (planId: 'starter' | 'pro', period: 'month' | 'year'): string | null => {
          if (planId === 'pro') {
            const month = process.env.STRIPE_PRICE_PRO_MONTH || process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
            const year = process.env.STRIPE_PRICE_PRO_YEAR || process.env.STRIPE_PRO_YEARLY_PRICE_ID;
            return period === 'month' ? (month || null) : (year || null);
          }
          if (planId === 'starter') {
            const month = process.env.STRIPE_PRICE_STARTER_MONTH || process.env.STRIPE_STARTER_MONTHLY_PRICE_ID;
            const year = process.env.STRIPE_PRICE_STARTER_YEAR || process.env.STRIPE_STARTER_YEARLY_PRICE_ID;
            return period === 'month' ? (month || null) : (year || null);
          }
          return null;
        };

        const priceId = resolvePriceId(input.planId === 'starter' ? 'starter' : 'pro', input.period);
        if (!priceId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Unsupported plan ${input.planId} / ${input.period}` });
        }

        const publicOrigin = process.env.PUBLIC_ORIGIN || 'http://localhost:5173';

        // Prefer session email from token if available
        const customerEmail = ctx.user?.email;

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [
            { price: priceId, quantity: 1 },
          ],
          // Let Stripe create the customer; pass email when available
          ...(customerEmail ? { customer_email: customerEmail } : {}),
          success_url: `${publicOrigin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${publicOrigin}/pricing`,
          metadata: {
            userRef: hashedUserId, // Use hashed reference instead of raw user ID
            planId: input.planId,
            originalUserId: '', // Don't store original - use lookup by hash instead
          },
        });

        if (!session.url) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe did not return a checkout URL' });
        }

        return { url: session.url };
      } catch (error) {
        console.error('createCheckoutSession error:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create checkout session' });
      }
    }),

  // Create Stripe billing portal session (delegates to API route)
  createCustomerPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const base = process.env.PUBLIC_ORIGIN;
      if (!base) throw new Error('PUBLIC_ORIGIN not set');
      const res = await fetch(`${base}/api/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctx.authToken}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Failed to create portal session');
      const data = await res.json();
      return { url: data.url as string };
    } catch (error) {
      console.error('createCustomerPortalSession error:', error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create billing portal session' });
    }
  }),
});

// Helper constants and functions for Stripe plan mapping
const PRO_FEATURES = [
  'Unlimited AI conversations',
  'Advanced code execution',
  'Priority support',
  'Fast response time',
  'Custom integrations',
  'Team collaboration',
];
const ENTERPRISE_FEATURES = [
  'Everything in Pro',
  'Dedicated support',
  'SLA guarantee',
  'Custom deployment',
  'Advanced analytics',
  'Custom billing',
];
const FREE_FEATURES = [
  '10 AI conversations per month',
  'Basic code execution',
  'Community support',
  'Standard response time',
];

// Local feature sets used to describe plans in return payload

// Main app router
export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  chat: chatRouter,
  message: messageRouter,
  aiModel: aiModelRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;