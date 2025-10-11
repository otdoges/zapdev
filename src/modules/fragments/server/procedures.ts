import { z } from "zod";

import { prisma } from "@/lib/db";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";

export const fragmentsRouter = createTRPCRouter({
  getDraft: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, { message: "Project ID is required" }),
      }),
    )
    .query(async ({ input, ctx }) => {
      const draft = await prisma.fragmentDraft.findFirst({
        where: {
          projectId: input.projectId,
          project: {
            userId: ctx.auth.userId,
          },
        },
      });

      return draft;
    }),
});
