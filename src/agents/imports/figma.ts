import { ConvexClient } from "convex/browser";
import { api } from "@/lib/convex-api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  extractDesignSystem,
  generateFigmaCodePrompt,
  extractPageStructure,
} from "@/lib/figma-processor";

let convexClient: ConvexClient | null = null;
function getConvexClient() {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
    }
    convexClient = new ConvexClient(url);
  }
  return convexClient;
}

const convex = new Proxy({} as ConvexClient, {
  get(_target, prop) {
    return getConvexClient()[prop as keyof ConvexClient];
  },
});

interface FigmaImportParams {
  importId: Id<"imports">;
  projectId: string;
  fileKey: string;
  accessToken: string;
}

export async function processFigmaImport(params: FigmaImportParams) {
  const { importId, projectId, fileKey, accessToken } = params;

  try {
    await convex.mutation(api.imports.markProcessing, { importId });

    // Wrap fetch in AbortController with 15s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let figmaData;
    try {
      const fileResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!fileResponse.ok) {
        await convex.mutation(api.imports.markFailed, {
          importId,
          error: `Failed to fetch Figma file: ${fileResponse.statusText}`,
        });
        throw new Error(`Failed to fetch Figma file: ${fileResponse.statusText}`);
      }
      figmaData = await fileResponse.json();
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle timeout explicitly
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        await convex.mutation(api.imports.markFailed, {
          importId,
          error: 'Figma fetch timed out after 15 seconds',
        });
        throw new Error('Figma fetch timed out after 15 seconds');
      }

      throw fetchError;
    }

    const designSystem = extractDesignSystem(figmaData);
    const aiPrompt = generateFigmaCodePrompt(figmaData, designSystem);
    const structureInfo = extractPageStructure(figmaData);

    // Only create attachment if we have a valid thumbnail URL
    const attachments = figmaData.thumbnail_url
      ? [
          {
            url: figmaData.thumbnail_url,
            size: -1, // -1 indicates unknown size (actual size not available from Figma API)
            importId,
            sourceMetadata: {
              figmaFile: figmaData.name,
              designSystem,
            },
            type: "FIGMA_FILE" as const,
          },
        ]
      : [];

    const message = await convex.action(api.messages.createWithAttachments, {
      value: `Convert this Figma design to code:\n\n${structureInfo}\n\n${aiPrompt}`,
      projectId,
      attachments,
    });

    await convex.mutation(api.imports.markComplete, {
      importId,
      metadata: {
        designSystem,
        messageId: message.messageId,
        fileData: {
          name: figmaData.name,
          pageCount: figmaData.document?.children?.length || 0,
        },
      },
    });

    return { messageId: message.messageId, designSystem };
  } catch (error) {
    // Skip marking failed if it's a timeout error (already handled in fetch handler)
    if (!(error instanceof Error && error.message === 'Figma fetch timed out after 15 seconds')) {
      await convex.mutation(api.imports.markFailed, {
        importId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
}
