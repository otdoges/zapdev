import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { e2bService } from '../../src/lib/e2b-service';

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
        name: 'Llama 3.1 70B',
        provider: 'groq',
        modelId: 'llama-3.1-70b-versatile',
        description: 'Fast and versatile large language model',
        maxTokens: 8192,
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

// Polar billing procedures
const polarRouter = router({
  // Product management
  getProducts: publicProcedure.query(async ({ ctx }) => {
    // This would call the Polar API and sync with Convex
    return [];
  }),

  getProduct: publicProcedure
    .input(z.object({
      productId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      // Get product from Polar API or Convex cache
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
      // Create Polar checkout session
      return {
        url: 'https://checkout.polar.sh/...',
      };
    }),

  cancelSubscription: protectedProcedure
    .input(z.object({
      subscriptionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Cancel subscription via Polar API
      return { success: true };
    }),

  // Usage tracking
  recordUsage: protectedProcedure
    .input(z.object({
      eventName: z.string(),
      metadata: z.record(z.string(), z.any()),
    }))
    .mutation(async ({ input, ctx }) => {
      // Record usage event in Convex
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

  // Meter management
  getMeters: protectedProcedure.query(async ({ ctx }) => {
    // Get meters from Convex cache
    return [];
  }),

  createMeter: protectedProcedure
    .input(z.object({
      name: z.string(),
      slug: z.string(),
      eventName: z.string(),
      valueProperty: z.string(),
      filters: z.array(z.object({
        property: z.string(),
        operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte']),
        value: z.union([z.string(), z.number()]),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Create meter via Polar API and sync to Convex
      return { success: true };
    }),

  // Sync operations (admin only)
  syncProducts: protectedProcedure.mutation(async ({ ctx }) => {
    // Sync products from Polar API to Convex
    return { success: true };
  }),

  syncSubscriptions: protectedProcedure.mutation(async ({ ctx }) => {
    // Sync subscriptions from Polar API to Convex
    return { success: true };
  }),

  // Webhook handler for Polar events
  handleWebhook: publicProcedure
    .input(z.object({
      type: z.string(),
      data: z.record(z.string(), z.any()),
    }))
    .mutation(async ({ input, ctx }) => {
      // Handle Polar webhook events
      return { success: true };
    }),
});

// E2B Code Execution procedures
const e2bRouter = router({
  // Execute TypeScript/JavaScript/Bash code
  executeCode: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        language: z.enum(['javascript', 'typescript', 'bash']).optional().default('javascript'),
        timeout: z.number().min(1000).max(60000).optional().default(30000),
        installPackages: z
          .array(z.string().regex(/^[a-zA-Z0-9_@\/\-]+$/))
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await e2bService.executeCode(input.code, {
        language: input.language,
        timeout: input.timeout,
        installPackages: input.installPackages,
      });
      return result;
    }),

  // Create a file in the sandbox
  createFile: protectedProcedure
    .input(
      z.object({
        path: z.string().regex(/^[^/]*[a-zA-Z0-9._-]+$/, 'Invalid file path'),
        content: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const success = await e2bService.createFile(input.path, input.content);
      if (!success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create file',
        });
      }
      return { success };
    }),

  // Read a file from the sandbox
  readFile: protectedProcedure
    .input(z.object({ path: z.string().regex(/^[^/]*[a-zA-Z0-9._-]+$/, 'Invalid file path') }))
    .query(async ({ input }) => {
      const content = await e2bService.readFile(input.path);
      if (content === null) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found or could not be read',
        });
      }
      return { content };
    }),

  // List files in a directory
  listFiles: protectedProcedure
    .input(
      z.object({
        directory: z
          .string()
          .regex(/^\.?[a-zA-Z0-9._\/\-]*$/, 'Invalid directory path')
          .optional()
          .default('.'),
      }),
    )
    .query(async ({ input }) => {
      const files = await e2bService.listFiles(input.directory);
      return { files };
    }),

  // Install a package in the sandbox
  installPackage: protectedProcedure
    .input(
      z.object({
        packageName: z.string(),
        language: z.enum(['node']).optional().default('node'),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await e2bService.installPackage(input.packageName, input.language);
      return result;
    }),

  // Get E2B service status and metrics
  getStatus: protectedProcedure.query(async () => {
    const status = e2bService.getStatus();
    return status;
  }),
});

// Main app router
export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  chat: chatRouter,
  message: messageRouter,
  aiModel: aiModelRouter,
  polar: polarRouter,
  e2b: e2bRouter,
});

export type AppRouter = typeof appRouter; 