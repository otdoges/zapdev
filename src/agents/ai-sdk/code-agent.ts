import { createGateway } from "@ai-sdk/gateway";
import {
  generateText,
  type CoreMessage,
} from "ai";
import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  FRAMEWORK_SELECTOR_PROMPT,
  NEXTJS_PROMPT,
  ANGULAR_PROMPT,
  REACT_PROMPT,
  VUE_PROMPT,
  SVELTE_PROMPT,
} from "@/prompt";
import { filterAIGeneratedFiles } from "@/lib/filter-ai-files";
import { runAiSdkAgent } from "@/lib/ai-sdk-agent";
import { sanitizeTextForDatabase } from "@/lib/utils";
import { captureTelemetry } from "@/lib/telemetry/posthog";
import { validateRequiredEnvVars } from "@/lib/env-validation";

import { e2bCircuitBreaker } from "@/agents/e2b-circuit-breaker";
import {
  createSandboxWithRetry,
  getSandbox,
  validateSandboxHealth,
} from "@/agents/e2b-utils";
import { type Framework, type ModelId } from "@/agents/types";
import {
  SANDBOX_TIMEOUT,
  VALIDATION_TIMEOUT,
  AUTO_FIX_MAX_ATTEMPTS,
  AUTO_FIX_MAX_STEPS,
  MESSAGE_STREAM_THROTTLE,
} from "@/agents/constants";

// Validate environment variables at module initialization
validateRequiredEnvVars();

type ValidationResult = {
  lintErrors: string | null;
  buildErrors: string | null;
};

// Shared Convex client (lazy)
let convexClient: ConvexHttpClient | null = null;
function getConvexClient() {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
    }
    convexClient = new ConvexHttpClient(url);
  }
  return convexClient;
}

const convex = new Proxy({} as ConvexHttpClient, {
  get(_target, prop) {
    return getConvexClient()[prop as keyof ConvexHttpClient];
  },
});

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL:
    process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1/ai",
});

const SUMMARY_TAG_REGEX = /<task_summary>([\s\S]*?)<\/task_summary>/i;

const extractSummaryText = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const match = SUMMARY_TAG_REGEX.exec(trimmed);
  if (match && typeof match[1] === "string") {
    return match[1].trim();
  }

  return trimmed;
};

const getFrameworkPrompt = (framework: Framework): string => {
  switch (framework) {
    case "nextjs":
      return NEXTJS_PROMPT;
    case "angular":
      return ANGULAR_PROMPT;
    case "react":
      return REACT_PROMPT;
    case "vue":
      return VUE_PROMPT;
    case "svelte":
      return SVELTE_PROMPT;
    default:
      return NEXTJS_PROMPT;
  }
};

const getE2BTemplate = (framework: Framework): string => {
  switch (framework) {
    case "nextjs":
      return "zapdev";
    case "angular":
      return "zapdev-angular";
    case "react":
      return "zapdev-react";
    case "vue":
      return "zapdev-vue";
    case "svelte":
      return "zapdev-svelte";
    default:
      return "zapdev";
  }
};

const getFrameworkPort = (framework: Framework): number => {
  const parsePort = (value?: string) => {
    const parsed = value ? Number(value) : NaN;
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const envPorts: Partial<Record<Framework, number>> = {
    nextjs: parsePort(process.env.FRAMEWORK_PORT_NEXTJS),
    angular: parsePort(process.env.FRAMEWORK_PORT_ANGULAR),
    react: parsePort(process.env.FRAMEWORK_PORT_REACT),
    vue: parsePort(process.env.FRAMEWORK_PORT_VUE),
    svelte: parsePort(process.env.FRAMEWORK_PORT_SVELTE),
  };

  switch (framework) {
    case "nextjs":
      return envPorts.nextjs ?? 3000;
    case "angular":
      return envPorts.angular ?? 4200;
    case "react":
    case "vue":
    case "svelte":
      return envPorts[framework] ?? 5173;
    default:
      return 3000;
  }
};

const frameworkToConvexEnum = (
  framework: Framework,
): "NEXTJS" | "ANGULAR" | "REACT" | "VUE" | "SVELTE" => {
  const mapping: Record<
    Framework,
    "NEXTJS" | "ANGULAR" | "REACT" | "VUE" | "SVELTE"
  > = {
    nextjs: "NEXTJS",
    angular: "ANGULAR",
    react: "REACT",
    vue: "VUE",
    svelte: "SVELTE",
  };
  return mapping[framework] ?? "NEXTJS";
};

const resolveSandboxUrl = (sandboxId: string): string =>
  `https://${sandboxId}.sandbox.e2b.dev`;

const runLintCheck = async (sandboxId: string): Promise<string | null> => {
  try {
    const sandbox = await getSandbox(sandboxId);
    const buffers: { stdout: string; stderr: string } = { stdout: "", stderr: "" };

    const result = await sandbox.commands.run("bun run lint", {
      onStdout: (data: string) => {
        buffers.stdout += data;
      },
      onStderr: (data: string) => {
        buffers.stderr += data;
      },
      timeoutMs: SANDBOX_TIMEOUT,
    });

    const output = buffers.stdout + buffers.stderr;

    if (result.exitCode === 127) {
      return null;
    }

    if (result.exitCode !== 0 && output.trim().length > 0) {
      return output;
    }

    return null;
  } catch (error) {
    console.error("[AI SDK] lint check failed:", error);
    return null;
  }
};

const runBuildCheck = async (sandboxId: string): Promise<string | null> => {
  try {
    const sandbox = await getSandbox(sandboxId);
    const buffers: { stdout: string; stderr: string } = { stdout: "", stderr: "" };

    const result = await sandbox.commands.run("bun run build", {
      onStdout: (data: string) => {
        buffers.stdout += data;
      },
      onStderr: (data: string) => {
        buffers.stderr += data;
      },
      timeoutMs: SANDBOX_TIMEOUT,
    });

    const output = buffers.stdout + buffers.stderr;

    if (result.exitCode === 127) {
      return null;
    }

    if (result.exitCode !== 0 && output.trim().length > 0) {
      return output;
    }

    return null;
  } catch (error) {
    console.error("[AI SDK] build check failed:", error);
    return null;
  }
};

const validateSandbox = async (sandboxId: string): Promise<ValidationResult> => {
  const [lintErrors, buildErrors] = await Promise.all([
    runLintCheck(sandboxId),
    runBuildCheck(sandboxId),
  ]);

  return { lintErrors, buildErrors };
};

const getPreviousMessages = async (
  userId: string,
  projectId: Id<"projects">,
): Promise<CoreMessage[]> => {
  try {
    const messages = await convex.query(api.messages.listForUser, {
      userId,
      projectId,
    });

    return messages.slice(-3).map((message) => ({
      role: message.role === "ASSISTANT" ? "assistant" : "user",
      content: message.content,
    })) as CoreMessage[];
  } catch (error) {
    console.error("[AI SDK] failed to load previous messages:", error);
    return [];
  }
};

interface CodeAgentRequest {
  projectId: Id<"projects">;
  messageId: Id<"messages">;
  value: string;
  model?: ModelId;
  frameworkOverride?: Framework;
  sandboxId?: string;
  specContent?: string;
}

export async function runCodeAgent(request: CodeAgentRequest) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error("AI_GATEWAY_API_KEY is required to run the AI SDK agent");
  }
  if (!process.env.SYSTEM_API_KEY) {
    throw new Error("SYSTEM_API_KEY is required to run the AI SDK agent");
  }

  const project = await convex.query(api.projects.getForSystem, {
    projectId: request.projectId,
    systemKey: process.env.SYSTEM_API_KEY!,
  });

  if (!project) {
    throw new Error("Project not found for code generation");
  }

  let selectedFramework: Framework =
    request.frameworkOverride ||
    (project.framework?.toLowerCase() as Framework) ||
    "nextjs";

  const telemetryBase = {
    userId: project.userId,
    projectId: request.projectId,
    messageId: request.messageId,
    requestedModel: request.model || "auto",
  };

  let validation: ValidationResult | undefined = undefined;

  try {
    if (!project.framework && !request.frameworkOverride) {
      const detected = await generateText({
        model: gateway("google/gemini-2.5-flash-lite"),
        system: FRAMEWORK_SELECTOR_PROMPT,
        prompt: request.value,
        temperature: 0.3,
      });

      const lower = (detected.text || "").trim().toLowerCase();
      if (["nextjs", "angular", "react", "vue", "svelte"].includes(lower)) {
        selectedFramework = lower as Framework;
      }

      await convex.mutation(api.projects.updateForUser, {
        userId: project.userId,
        projectId: request.projectId,
        framework: frameworkToConvexEnum(selectedFramework),
      });
    }

    const assistantMessageId = await convex.mutation(
      api.messages.createForUser,
      {
        userId: project.userId,
        projectId: request.projectId,
        content: "",
        role: "ASSISTANT",
        type: "RESULT",
        status: "STREAMING",
      },
    );

    const sandboxDetails = await (async () => {
      if (request.sandboxId) {
        return {
          sandboxId: request.sandboxId,
          sandboxUrl: resolveSandboxUrl(request.sandboxId),
        };
      }

      const template = getE2BTemplate(selectedFramework);

      const sandbox = await e2bCircuitBreaker.execute(async () => {
        const created = await createSandboxWithRetry(template, 3);
        await created.setTimeout(SANDBOX_TIMEOUT);
        return created;
      });

      const isHealthy = await validateSandboxHealth(sandbox);
      if (!isHealthy) {
        console.warn("[AI SDK] sandbox health check failed; continuing anyway");
      }

      return {
        sandboxId: sandbox.sandboxId,
        sandboxUrl: resolveSandboxUrl(sandbox.sandboxId),
      };
    })();

    await captureTelemetry("agent_start", {
      ...telemetryBase,
      framework: selectedFramework,
      sandboxId: sandboxDetails.sandboxId,
      specMode: Boolean(request.specContent),
    });

    let streamedText = "";
    let lastSent = 0;
    const sendUpdate = async () => {
      lastSent = Date.now();
      await convex.mutation(api.messages.updateForSystem, {
        systemKey: process.env.SYSTEM_API_KEY!,
        messageId: assistantMessageId as Id<"messages">,
        content: streamedText,
        status: "STREAMING",
      });
    };

    const systemPrompt = getFrameworkPrompt(selectedFramework);
    const previousMessages = await getPreviousMessages(
      project.userId,
      request.projectId,
    );

    const userContent =
      request.specContent && request.specContent.length > 0
        ? `${request.value}\n\nApproved specification:\n${request.specContent}`
        : request.value;

    const baseMessages: CoreMessage[] = [
      ...previousMessages,
      { role: "user", content: userContent },
    ];

    const onChunk = async ({ chunk }: { chunk: { type: string; textDelta?: string } }) => {
      if (chunk.type !== "text-delta") {
        return;
      }
      streamedText = chunk.textDelta || "";
      const now = Date.now();
      if (now - lastSent > MESSAGE_STREAM_THROTTLE) {
        await sendUpdate();
      }
    };

    // Default to Haiku for "auto" or absent model selections to prioritize speed and cost.
    const defaultModel: ModelId = "anthropic/claude-haiku-4.5";
    const model =
      request.model && request.model !== "auto" ? request.model : defaultModel;

    const runAgent = (messages: CoreMessage[], maxSteps = 10) =>
      runAiSdkAgent({
        sandboxId: sandboxDetails.sandboxId,
        framework: selectedFramework,
        messages,
        systemPrompt,
        model,
        maxSteps,
        onStepFinish: undefined,
        onChunk,
      });

    let agentResult = await runAgent(baseMessages);

    let files = { ...agentResult.files };
    let summaryText = extractSummaryText(agentResult.text);

    validation = await validateSandbox(sandboxDetails.sandboxId);

    let attempts = 0;
    
    /**
     * Counts total error lines from validation result.
     * Used to detect if errors are improving between auto-fix iterations.
     */
    const countErrors = (val: ValidationResult): number => {
      const lintCount = (val?.lintErrors || '').split('\n').filter(line => line.trim()).length;
      const buildCount = (val?.buildErrors || '').split('\n').filter(line => line.trim()).length;
      return lintCount + buildCount;
    };

    let previousErrorCount = Infinity;

    while (
      attempts < AUTO_FIX_MAX_ATTEMPTS &&
      (validation?.lintErrors || validation?.buildErrors)
    ) {
      const currentErrorCount = countErrors(validation);
      
      // Break if errors aren't improving (same or worse)
      if (currentErrorCount >= previousErrorCount) {
        console.warn(
          `[Auto-fix] Errors not improving (previous: ${previousErrorCount}, current: ${currentErrorCount}), breaking retry loop`
        );
        break;
      }
      
      attempts += 1;
      previousErrorCount = currentErrorCount;
      
      const errorContext = [validation?.lintErrors, validation?.buildErrors]
        .filter(Boolean)
        .join("\n\n");

      const retryMessages: CoreMessage[] = [
        ...baseMessages,
        { role: "assistant", content: agentResult.text },
        { role: "user", content: `Fix these errors:\n${errorContext}` },
      ];

      agentResult = await runAgent(retryMessages, AUTO_FIX_MAX_STEPS);
      files = { ...files, ...agentResult.files };
      summaryText = extractSummaryText(agentResult.text) || summaryText;
      validation = await validateSandbox(sandboxDetails.sandboxId);
    }

    const filePaths = Object.keys(files);
    if (!summaryText && filePaths.length > 0) {
      const preview = filePaths.slice(0, 5);
      summaryText = `Generated or updated ${filePaths.length} file(s): ${preview.join(", ")}`;
    }

    const filteredFiles = filterAIGeneratedFiles(files);

    const metadata = {
      summary: sanitizeTextForDatabase(summaryText),
      model,
      validation,
      finishReason: agentResult.finishReason,
    };

    await convex.mutation(api.messages.createFragmentForUser, {
      userId: project.userId,
      messageId: assistantMessageId as Id<"messages">,
      sandboxId: sandboxDetails.sandboxId,
      sandboxUrl: sandboxDetails.sandboxUrl,
      title: "Fragment",
      files: filteredFiles,
      framework: frameworkToConvexEnum(selectedFramework),
      metadata,
    });

    await convex.mutation(api.messages.updateForSystem, {
      systemKey: process.env.SYSTEM_API_KEY!,
      messageId: assistantMessageId as Id<"messages">,
      content: summaryText || agentResult.text,
      status: "COMPLETE",
    });

    await captureTelemetry("agent_complete", {
      ...telemetryBase,
      framework: selectedFramework,
      sandboxId: sandboxDetails.sandboxId,
      filesCount: Object.keys(filteredFiles).length,
      validationHasErrors:
        Boolean(validation?.lintErrors) || Boolean(validation?.buildErrors),
      lintErrorLength: validation?.lintErrors?.length || 0,
      buildErrorLength: validation?.buildErrors?.length || 0,
    });

    return {
      sandboxId: sandboxDetails.sandboxId,
      sandboxUrl: sandboxDetails.sandboxUrl,
      summary: summaryText,
      files: filteredFiles,
      validation,
      assistantMessageId,
    };
  } catch (error) {
    await captureTelemetry("agent_error", {
      ...telemetryBase,
      framework: selectedFramework,
      validationHasErrors:
        Boolean(validation?.lintErrors) || Boolean(validation?.buildErrors),
      lintErrorLength: validation?.lintErrors?.length || 0,
      buildErrorLength: validation?.buildErrors?.length || 0,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
