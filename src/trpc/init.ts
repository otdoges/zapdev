import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import superjson from "superjson";
import { getToken } from '@/lib/auth-server';
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const createTRPCContext = cache(async () => {
  const token = await getToken();
  let user = null;
  
  if (token) {
    try {
      user = await fetchQuery(api.auth.getCurrentUser, {}, { token });
    } catch (error) {
      console.error("Failed to get user from Better Auth:", error);
    }
  }
  
  return { user, token };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  return next({
    ctx: {
      user: ctx.user,
      token: ctx.token,
    },
  });
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
