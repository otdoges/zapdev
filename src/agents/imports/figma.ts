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

  await convex.mutation(api.imports.markProcessing, { importId });

  const fileResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!fileResponse.ok) {
    await convex.mutation(api.imports.markFailed, {
      importId,
      error: `Failed to fetch Figma file: ${fileResponse.statusText}`,
    });
    throw new Error(`Failed to fetch Figma file: ${fileResponse.statusText}`);
  }
  const figmaData = await fileResponse.json();

  const designSystem = extractDesignSystem(figmaData);
  const aiPrompt = generateFigmaCodePrompt(figmaData, designSystem);
  const structureInfo = extractPageStructure(figmaData);

  const message = await convex.action(api.messages.createWithAttachments, {
    value: `Convert this Figma design to code:\n\n${structureInfo}\n\n${aiPrompt}`,
    projectId,
    attachments: [
      {
        url: figmaData.thumbnail_url || "",
        size: 0,
        importId,
        sourceMetadata: {
          figmaFile: figmaData.name,
          designSystem,
        },
        type: "FIGMA_FILE",
      },
    ],
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
}
