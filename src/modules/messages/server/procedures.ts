import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { consumeCredits } from "@/lib/usage";
import { getAgentEventName } from "@/lib/agent-mode";
import { sanitizeTextForDatabase } from "@/lib/utils";

export const messagesRouter = createTRPCRouter({
  getMany: protectedProcedure
  .input(
      z.object({
        projectId: z.string().min(1, { message: "Project ID is required" }),
      }),
    )
    .query(async ({ input, ctx }) => {
      const messages = await prisma.message.findMany({
        where: {
          projectId: input.projectId,
          Project: {
            userId: ctx.auth.userId,
          },
        },
        include: {
          Fragment: true,
          Attachment: true,
        },
        orderBy: {
          updatedAt: "asc",
        },
      });

      return messages;
    }),
  create: protectedProcedure
    .input(
      z.object({
        value: z.string()
          .min(1, { message: "Value is required" })
          .max(10000, { message: "Value is too long" }),
        projectId: z.string().min(1, { message: "Project ID is required" }),
        attachments: z.array(
          z.object({
            url: z.string(),
            size: z.number(),
            width: z.number().optional(),
            height: z.number().optional(),
          })
        ).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existingProject = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
      });

      if (!existingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      try {
        await consumeCredits();
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Something went wrong" });
        } else {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "You have run out of credits"
          });
        }
      }

      // Sanitize user input to remove NULL bytes which are not supported by PostgreSQL
      const sanitizedValue = sanitizeTextForDatabase(input.value);

      const createdMessage = await prisma.message.create({
        data: {
          projectId: existingProject.id,
          content: sanitizedValue,
          role: "USER",
          type: "RESULT",
          status: "COMPLETE",
          Attachment: input.attachments?.length
            ? {
                create: input.attachments.map((attachment) => ({
                  type: "IMAGE",
                  url: attachment.url,
                  size: attachment.size,
                  width: attachment.width,
                  height: attachment.height,
                })),
              }
            : undefined,
        },
      });

      await inngest.send({
        name: getAgentEventName(),
        data: {
          value: sanitizedValue,
          projectId: input.projectId,
        },
      });

      return createdMessage;
    }),
});
