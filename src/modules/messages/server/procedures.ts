import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { consumeCredits } from "@/lib/usage";

const aiGateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseURL: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
  compatibility: "compatible",
});

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

      const createdMessage = await prisma.message.create({
        data: {
          projectId: existingProject.id,
          content: input.value,
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
        name: "code-agent/run",
        data: {
          value: input.value,
          projectId: input.projectId,
        },
      });

      return createdMessage;
    }),
  streamProgress: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        messageId: z.string().min(1),
      })
    )
    .subscription(async function* ({ input, ctx }) {
      const project = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const message = await prisma.message.findUnique({
        where: {
          id: input.messageId,
          projectId: input.projectId,
        },
      });

      if (!message) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
      }

      yield {
        type: "status" as const,
        status: "starting",
        message: "Initializing code generation...",
      };

      const interval = setInterval(async () => {
        const updatedMessage = await prisma.message.findUnique({
          where: { id: input.messageId },
          include: { Fragment: true },
        });

        if (updatedMessage?.status === "COMPLETE") {
          clearInterval(interval);
        }
      }, 1000);

      yield {
        type: "status" as const,
        status: "complete",
        message: "Code generation complete",
      };
    }),
  streamResponse: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(1),
        model: z.enum(["gemini", "kimi"]).default("gemini"),
      })
    )
    .mutation(async ({ input }) {
      const model = input.model === "gemini" 
        ? aiGateway("google/gemini-2.5-flash-lite")
        : aiGateway("moonshotai/kimi-k2-0905");

      const result = await streamText({
        model,
        prompt: input.prompt,
        temperature: input.model === "gemini" ? 0.3 : 0.7,
        maxTokens: 4000,
      });

      const chunks: string[] = [];
      for await (const chunk of result.textStream) {
        chunks.push(chunk);
      }

      return {
        text: chunks.join(""),
        usage: await result.usage,
      };
    }),
});
