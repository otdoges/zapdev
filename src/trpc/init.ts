import { initTRPC } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import superjson from "superjson";

import { auth } from "@clerk/nextjs/server";

const createInnerContext = async () => {
  const { sessionId, userId } = await auth();
  return {
    auth: {
      sessionId,
      userId,
    },
  };
};

export const createTRPCContext = async () => {
  return createInnerContext();
};

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx,
  });
});
