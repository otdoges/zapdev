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
      if (!ctx.auth.userId) {
        throw new Error("Unauthorized");
      }

      // First verify the project belongs to the user
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
      });

      if (!project) {
        return null;
      }

      // Then fetch the draft
      const draft = await prisma.fragmentDraft.findUnique({
        where: {
          projectId: input.projectId,
        },
      });

      return draft;
    }),
});
