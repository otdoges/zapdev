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

    // Here you would validate the JWT token with WorkOS
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
  // Exchange WorkOS code for tokens
  workosCallback: publicProcedure
    .input(z.object({
      code: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Exchange code for tokens with WorkOS (no client_secret needed for public clients)
        const response = await fetch('https://api.workos.com/sso/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${process.env.WORKOS_API_KEY}`,
          },
          body: new URLSearchParams({
            client_id: process.env.WORKOS_CLIENT_ID!,
            grant_type: 'authorization_code',
            code: input.code,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('WorkOS token exchange failed:', response.status, errorText);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `WorkOS token exchange failed: ${response.statusText}`,
          });
        }

        const tokenData = await response.json();
        
        // The profile should be included in the token response
        const profile = tokenData.profile;

        if (!profile) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No profile data received from WorkOS',
          });
        }

        return {
          profile: {
            id: profile.id,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            picture: profile.picture,
          },
          idToken: tokenData.id_token,
          accessToken: tokenData.access_token,
        };
      } catch (error) {
        console.error('WorkOS callback error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process WorkOS authentication',
        });
      }
    }),
});

// Stripe billing procedures
const stripeRouter = router({
  // Product management
  getProducts: publicProcedure.query(async ({ ctx }) => {
    // Get products from Convex cache
    return [];
  }),

  getProduct: publicProcedure
    .input(z.object({
      productId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      // Get product from Convex cache
      return null;
    }),

  // Customer and subscription management
  getCustomerSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    // Get user's subscriptions from Convex
    return [];
  }),

  createCheckoutSession: protectedProcedure
    .input(z.object({
      priceId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Create Stripe checkout session
      return {
        url: 'https://checkout.stripe.com/...',
      };
    }),

  createCustomerPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    // Create Stripe customer portal session
    return {
      url: 'https://billing.stripe.com/...',
    };
  }),

  // Usage tracking
  recordUsage: protectedProcedure
    .input(z.object({
      eventName: z.string(),
      metadata: z.record(z.union([z.string(), z.number(), z.boolean()])),
    }))
    .mutation(async ({ input, ctx }) => {
      // Record usage event for billing
      return { success: true };
    }),

  getUserUsageStats: protectedProcedure
    .input(z.object({
      since: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Get usage statistics from Convex
      return {
        totalEvents: 0,
        period: { since: Date.now() - 30 * 24 * 60 * 60 * 1000, until: Date.now() },
        byEventType: {},
      };
    }),

  // Webhook handler for Stripe events
  handleWebhook: publicProcedure
    .input(z.object({
      body: z.string(),
      signature: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Handle Stripe webhook events
      return { success: true };
    }),
});

// Main app router
export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  chat: chatRouter,
  message: messageRouter,
  aiModel: aiModelRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter; 