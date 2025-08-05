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
        name: 'Kimi K2 Instruct',
        provider: 'groq',
        modelId: 'moonshotai/kimi-k2-instruct',
        description: 'Advanced conversational AI model',
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

// Billing procedures (Clerk-based)
const billingRouter = router({
  // Get user subscription status
  getUserSubscription: protectedProcedure.query(async ({ ctx }) => {
    // Get user's subscription from Convex (synced with Clerk)
    return {
      planId: 'free',
      planName: 'Free',
      status: 'active',
      features: ['10 AI conversations per month', 'Basic code execution'],
      currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
  }),

  // Get user usage statistics
  getUserUsage: protectedProcedure.query(async ({ ctx }) => {
    // Get usage statistics from Convex
    return {
      conversations: 5,
      codeExecutions: 12,
      resetDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
  }),

  // Record usage event
  recordUsage: protectedProcedure
    .input(z.object({
      eventName: z.string(),
      metadata: z.record(z.union([z.string(), z.number(), z.boolean()])),
    }))
    .mutation(async ({ input, ctx }) => {
      // Record usage event for billing
      return { success: true };
    }),

  // Create checkout session (redirects to Clerk billing)
  createCheckoutSession: protectedProcedure
    .input(z.object({
      planId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Create Clerk billing checkout session
      return {
        url: `https://billing.clerk.dev/checkout?plan=${input.planId}`,
      };
    }),

  // Create customer portal session (redirects to Clerk billing)
  createCustomerPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    // Create Clerk billing portal session
    return {
      url: 'https://billing.clerk.dev/portal',
    };
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