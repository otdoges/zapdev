import { createGateway } from "@ai-sdk/gateway";
import {
  streamText,
  tool,
  type CoreMessage,
  type FinishReason,
  type LanguageModelUsage,
  type StreamTextOnStepFinishCallback,
  type StreamTextOnChunkCallback,
} from "ai";
import { Sandbox } from "@e2b/code-interpreter";
import { z } from "zod";

import { SANDBOX_TIMEOUT, type Framework } from "@/agents/types";

export interface AiSdkAgentOptions {
  sandboxId: string;
  framework: Framework;
  messages: CoreMessage[];
  systemPrompt: string;
  model: string;
  maxSteps?: number;
  onStepFinish?: StreamTextOnStepFinishCallback<
    Record<string, ReturnType<typeof tool>>
  >;
  onChunk?: StreamTextOnChunkCallback<Record<string, unknown>>;
}

export interface AiSdkAgentResult {
  text: string;
  files: Record<string, string>;
  finishReason: FinishReason;
  usage: LanguageModelUsage;
  toolResults: unknown[];
}

const createGatewayClient = () =>
  createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
    baseURL:
      process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1/ai",
  });

/**
 * Runs a multi-step coding agent using the Vercel AI SDK gateway provider
 * with E2B sandbox tools (terminal, read, write).
 */
export async function runAiSdkAgent(
  options: AiSdkAgentOptions,
): Promise<AiSdkAgentResult> {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error("AI_GATEWAY_API_KEY is required for AI SDK gateway");
  }

  if (!process.env.E2B_API_KEY) {
    throw new Error("E2B_API_KEY is required to connect to sandboxes");
  }

  const gateway = createGatewayClient();
  const sandbox = await Sandbox.connect(options.sandboxId, {
    apiKey: process.env.E2B_API_KEY,
  });

  await sandbox.setTimeout(SANDBOX_TIMEOUT);

  const trackedFiles: Record<string, string> = {};

  const tools = {
    terminal: tool({
      description: "Run shell commands in the E2B sandbox",
      parameters: z.object({ command: z.string() }),
      execute: async ({ command }) => {
        const result = await sandbox.commands.run(command, {
          timeoutMs: 120_000,
        });

        return {
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
        };
      },
    }),
    createOrUpdateFiles: tool({
      description: "Create or update files in the sandbox",
      parameters: z.object({
        files: z.array(
          z.object({
            path: z.string(),
            content: z.string(),
          }),
        ),
      }),
      execute: async ({ files }) => {
        for (const file of files) {
          await sandbox.files.write(file.path, file.content);
          trackedFiles[file.path] = file.content;
        }

        return `Updated ${files.length} file(s)`;
      },
    }),
    readFiles: tool({
      description: "Read files from the sandbox",
      parameters: z.object({
        files: z.array(z.string()),
      }),
      execute: async ({ files }) => {
        const contents = await Promise.all(
          files.map(async (path) => ({
            path,
            content: await sandbox.files.read(path),
          })),
        );

        return contents;
      },
    }),
  };

  const result = await streamText({
    model: gateway(options.model),
    system: options.systemPrompt,
    messages: options.messages,
    tools,
    maxSteps: options.maxSteps ?? 10,
    onStepFinish: options.onStepFinish,
    onChunk: options.onChunk,
  });

  const [text, usage, finishReason, toolResults] = await Promise.all([
    result.text,
    result.totalUsage,
    result.finishReason,
    result.toolResults,
  ]);

  return {
    text,
    files: trackedFiles,
    finishReason,
    usage,
    toolResults,
  };
}
