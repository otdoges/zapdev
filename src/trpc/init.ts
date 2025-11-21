import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import superjson from "superjson";
import { getUser } from "@/lib/stack-auth";

export const createTRPCContext = cache(async () => {
  const user = await getUser();

  return { 
    user: user ? {
      id: user.id,
      email: user.primaryEmail || "",
      emailVerified: user.hasPasswordAuth || user.signedUpAt !== null,
      name: user.displayName,
    } : null 
  };
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

  if (!ctx.user.emailVerified) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Email verification required",
    });
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
