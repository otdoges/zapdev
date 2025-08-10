import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';

// Define the context interface
interface Context {
  authToken?: string;
  user?: {
    id: string;
    email: string;
  };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Create a procedure that requires authentication
export const protectedProcedure = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    const authToken = ctx.authToken;
    if (!authToken) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'No authorization token provided',
      });
    }

    // Here you would validate the JWT token with Clerk
    // For now, we'll assume the token is valid
    const user = { id: 'user-id', email: 'user@example.com' }; // Mock user data
    
    return next({
      ctx: {
        ...ctx,
        user,
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
    .mutation(async ({ input, ctx }) => {
      // This would call a Convex mutation
      return { success: true };
    }),
});

// Chat procedures
const chatRouter = router({
  // Get all chats for current user
  getChats: protectedProcedure.query(async ({ ctx }) => {
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
    .mutation(async ({ input, ctx }) => {
      // This would call a Convex mutation
      return { success: true };
    }),

  // Delete chat
  deleteChat: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
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
    .query(async ({ input, ctx }) => {
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
    .mutation(async ({ input }) => {
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
  // Get user subscription status directly from API
  getUserSubscription: protectedProcedure.query(async ({ ctx }) => {
    try {
      const base = process.env.PUBLIC_ORIGIN;
      if (!base) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'PUBLIC_ORIGIN not set',
        });
      }
      const resp = await fetch(`${base}/api/get-subscription`, {
        headers: { Authorization: `Bearer ${ctx.authToken}` },
      });
      if (!resp.ok) {
        return { planId: 'free', planName: 'Free', status: 'none', features: [], currentPeriodEnd: Date.now() };
      }
      const sub = await resp.json();
      const priceId: string | null = sub?.priceId || null;
      const planId = priceId?.includes('pro') ? 'pro' : priceId?.includes('enterprise') ? 'enterprise' : 'free';
      return {
        planId,
        planName: planId.charAt(0).toUpperCase() + planId.slice(1),
        status: sub?.status || 'none',
        features: planId === 'pro' ? ['Unlimited AI conversations', 'Advanced code execution'] : ['10 AI conversations per month', 'Basic code execution'],
        currentPeriodEnd: sub?.currentPeriodEnd ? sub.currentPeriodEnd * 1000 : Date.now(),
      };
    } catch (e) {
      return { planId: 'free', planName: 'Free', status: 'none', features: [], currentPeriodEnd: Date.now() };
    }
  }),

    // Create Stripe checkout session via API route
  createCheckoutSession: protectedProcedure
    .input(z.object({ planId: z.string(), period: z.enum(['month', 'year']).optional() }))
    .mutation(async ({ input, ctx }) => {
      const base = process.env.PUBLIC_ORIGIN || '';
        const res = await fetch(`${base}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: input.planId, period: input.period, userId: ctx.user!.id, email: ctx.user!.email }),
      });
      if (!res.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create checkout session' });
      const data = await res.json();
      return { url: data.url as string };
    }),
});

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