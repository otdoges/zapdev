import { inngest } from "@/inngest/client";
import { ConvexClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  extractDesignSystem,
  generateFigmaCodePrompt,
  extractPageStructure,
} from "@/lib/figma-processor";

const convex = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const processFigmaImport = inngest.createFunction(
  { id: "process-figma-import" },
  { event: "code-agent/process-figma-import" },
  async ({ event, step }) => {
    const { importId, projectId, fileKey, accessToken } = event.data as any;

    try {
      // Mark import as processing
      await step.run("mark-processing", async () => {
        return await convex.mutation(api.imports.markProcessing, { importId });
      });

      // Fetch Figma file data
      const figmaData = await step.run("fetch-figma-file", async () => {
        const response = await fetch(
          `https://api.figma.com/v1/files/${fileKey}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch Figma file: ${response.statusText}`);
        }

        return await response.json();
      });

      // Extract design system
      const designSystem = await step.run("extract-design-system", async () => {
        return extractDesignSystem(figmaData);
      });

      // Generate AI prompt from Figma design
      const aiPrompt = await step.run("generate-ai-prompt", async () => {
        return generateFigmaCodePrompt(figmaData, designSystem);
      });

      // Extract structure info
      const structureInfo = await step.run("extract-structure", async () => {
        return extractPageStructure(figmaData);
      });

      // Create a message with the Figma context
      const message = await step.run("create-message", async () => {
        return await convex.mutation(api.messages.createWithAttachments, {
          value: `Convert this Figma design to code:\n\n${structureInfo}\n\n${aiPrompt}`,
          projectId,
          attachments: [
            {
              url: figmaData.thumbnail_url || "",
              size: 0,
              type: "FIGMA_FILE",
              importId,
              sourceMetadata: {
                figmaFile: figmaData.name,
                designSystem,
              },
            },
          ],
        });
      });

      // Update import status to complete
      await step.run("mark-complete", async () => {
        return await convex.mutation(api.imports.markComplete, {
          importId,
          metadata: {
            designSystem,
            messageId: message._id,
            fileData: {
              name: figmaData.name,
              pageCount: figmaData.document?.children?.length || 0,
            },
          },
        });
      });

      return {
        success: true,
        importId,
        messageId: message._id,
        designSystemSize: Object.keys(designSystem.colors || {}).length,
      };
    } catch (error) {
      // Mark import as failed
      await step.run("mark-failed", async () => {
        return await convex.mutation(api.imports.markFailed, {
          importId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });

      throw error;
    }
  }
);
