import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import { openai, createAgent, createTool, createNetwork, type Tool, type Message, createState, type NetworkRun } from "@inngest/agent-kit";
import { Prisma, Framework as PrismaFramework } from "@/generated/prisma";
import { inspect } from "util";

import { prisma } from "@/lib/db";
import { crawlUrl, type CrawledContent } from "@/lib/firecrawl";
import {
  FRAGMENT_TITLE_PROMPT,
  RESPONSE_PROMPT,
  FRAMEWORK_SELECTOR_PROMPT,
  NEXTJS_PROMPT,
  ANGULAR_PROMPT,
  REACT_PROMPT,
  VUE_PROMPT,
  SVELTE_PROMPT,
} from "@/prompt";

import { inngest } from "./client";
import { SANDBOX_TIMEOUT, type Framework, type AgentState } from "./types";
import { getSandbox, lastAssistantTextMessageContent, parseAgentOutput } from "./utils";
// Multi-agent workflow removed; only single code agent is used.

type SandboxWithHost = Sandbox & {
  getHost?: (port: number) => string | undefined;
};

const AUTO_FIX_MAX_ATTEMPTS = 2;

const AUTO_FIX_ERROR_PATTERNS = [
  /Error:/i, /\[ERROR\]/i, /ERROR/, /Failed\b/i, /failure\b/i, /Exception\b/i,
  /SyntaxError/i, /TypeError/i, /ReferenceError/i, /Module not found/i,
  /Cannot find module/i, /Failed to resolve/i, /Build failed/i,
  /Compilation error/i, /undefined is not/i, /null is not/i,
  /Cannot read propert/i, /is not a function/i, /is not defined/i,
  /ESLint/i, /Type error/i, /TS\d+/i,
];

const usesShadcnComponents = (files: Record<string, string>) => {
  return Object.entries(files).some(([path, content]) => {
    if (!path.endsWith(".tsx")) {
      return false;
    }
    return content.includes("@/components/ui/");
  });
};

const shouldTriggerAutoFix = (message?: string): boolean => {
  if (!message) return false;
  return AUTO_FIX_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};

const URL_REGEX = /(https?:\/\/[^\s\]\)"'<>]+)/gi;

const extractUrls = (value: string) => {
  const matches = value.matchAll(URL_REGEX);
  const urls = new Set<string>();

  for (const match of matches) {
    try {
      const parsed = new URL(match[0]);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        urls.add(parsed.toString());
      }
    } catch {
      // skip invalid URLs
    }
  }

  return Array.from(urls);
};

const SUMMARY_TAG_REGEX = /<task_summary>([\s\S]*?)<\/task_summary>/i;

const extractSummaryText = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }

  const match = SUMMARY_TAG_REGEX.exec(trimmed);
  if (match && typeof match[1] === "string") {
    return match[1].trim();
  }

  return trimmed;
};

const getLastAssistantMessage = (
  networkRun: NetworkRun<AgentState>,
): string | undefined => {
  const results = networkRun.state.results;

  if (results.length === 0) {
    return undefined;
  }

  const latestResult = results[results.length - 1];

  return lastAssistantTextMessageContent(latestResult);
};

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
      }
    });

    const output = buffers.stdout + buffers.stderr;

    // If lint found errors (non-zero exit code and has output)
    if (result.exitCode !== 0 && output.length > 0) {
      // Check if output contains actual error indicators (not just warnings)
      if (/error|✖/i.test(output)) {
        console.log("[DEBUG] Lint check found ERRORS:\n", output);
        return output;
      }
      // Also check for any pattern match indicating a problem
      if (AUTO_FIX_ERROR_PATTERNS.some((pattern) => pattern.test(output))) {
        console.log("[DEBUG] Lint check found issues:\n", output);
        return output;
      }
    }

    console.log("[DEBUG] Lint check passed with no errors");
    return null;
  } catch (error) {
    console.error("[DEBUG] Lint check failed:", error);
    // Don't fail the entire process if lint check fails
    return null;
  }
};

const runBuildCheck = async (sandboxId: string): Promise<string | null> => {
  try {
    const sandbox = await getSandbox(sandboxId);
    const buffers: { stdout: string; stderr: string } = { stdout: "", stderr: "" };

    // Try to build the project to catch build-time errors
    const buildCommand = 'bun run build';
    console.log("[DEBUG] Running build check with command:", buildCommand);

    const result = await sandbox.commands.run(buildCommand, {
      onStdout: (data: string) => {
        buffers.stdout += data;
      },
      onStderr: (data: string) => {
        buffers.stderr += data;
      },
      timeoutMs: 60000, // 60 second timeout for build
    });

    const output = buffers.stdout + buffers.stderr;

    // If build failed (non-zero exit code)
    if (result.exitCode !== 0) {
      console.log("[DEBUG] Build check FAILED with exit code:", result.exitCode);
      console.log("[DEBUG] Build output:\n", output);
      
      // Check if output contains error patterns
      if (AUTO_FIX_ERROR_PATTERNS.some((pattern) => pattern.test(output))) {
        return `Build failed with errors:\n${output}`;
      }
      
      // Even if no specific pattern matches, if build failed it's an error
      return `Build failed with exit code ${result.exitCode}:\n${output}`;
    }

    console.log("[DEBUG] Build check passed successfully");
    return null;
  } catch (error) {
    console.error("[DEBUG] Build check failed with exception:", error);
    if (error instanceof Error && error.stack) {
      console.error("[DEBUG] Stack trace:", error.stack);
    } else {
      console.error("[DEBUG] Serialized exception:", inspect(error, { depth: null }));
    }

    const serializedError = error instanceof Error
      ? `${error.message}${error.stack ? `\n${error.stack}` : ""}`.trim()
      : inspect(error, { depth: null });

    // Return the error as it likely indicates a build problem
    return `Build check exception: ${serializedError}`;
  }
};

const getE2BTemplate = (framework: Framework): string => {
  switch (framework) {
    case 'nextjs':
      return 'zapdev';
    case 'angular':
      return 'zapdev-angular';
    case 'react':
      return 'zapdev-react';
    case 'vue':
      return 'zapdev-vue';
    case 'svelte':
      return 'zapdev-svelte';
    default:
      return 'zapdev';
  }
};

const getFrameworkPort = (framework: Framework): number => {
  switch (framework) {
    case 'nextjs':
      return 3000;
    case 'angular':
      return 4200;
    case 'react':
    case 'vue':
    case 'svelte':
      return 5173;
    default:
      return 3000;
  }
};

const getFrameworkPrompt = (framework: Framework): string => {
  switch (framework) {
    case 'nextjs':
      return NEXTJS_PROMPT;
    case 'angular':
      return ANGULAR_PROMPT;
    case 'react':
      return REACT_PROMPT;
    case 'vue':
      return VUE_PROMPT;
    case 'svelte':
      return SVELTE_PROMPT;
    default:
      return NEXTJS_PROMPT;
  }
};

const toPrismaFramework = (framework: Framework): PrismaFramework => {
  return framework.toUpperCase() as PrismaFramework;
};

const createCodeAgentTools = (sandboxId: string) => [
  createTool({
    name: "terminal",
    description: "Use the terminal to run commands",
    parameters: z.object({
      command: z.string(),
    }),
    handler: async (
      { command }: { command: string },
      opts: Tool.Options<AgentState>
    ) => {
      return await opts.step?.run("terminal", async () => {
        const buffers: { stdout: string; stderr: string } = { stdout: "", stderr: "" };

        try {
          const sandbox = await getSandbox(sandboxId);
          const result = await sandbox.commands.run(command, {
            onStdout: (data: string) => {
              buffers.stdout += data;
            },
            onStderr: (data: string) => {
              buffers.stderr += data;
            }
          });
          return result.stdout;
        } catch (e) {
          console.error(
            `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`,
          );
          return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
        }
      });
    },
  }),
  createTool({
    name: "createOrUpdateFiles",
    description: "Create or update files in the sandbox",
    parameters: z.object({
      files: z.array(
        z.object({
          path: z.string(),
          content: z.string(),
        }),
      ),
    }),
    handler: async (
      { files },
      { step, network }: Tool.Options<AgentState>
    ) => {
      const newFiles = await step?.run("createOrUpdateFiles", async () => {
        try {
          const updatedFiles = network.state.data.files || {};
          const sandbox = await getSandbox(sandboxId);
          for (const file of files) {
            await sandbox.files.write(file.path, file.content);
            updatedFiles[file.path] = file.content;
          }

          return updatedFiles;
        } catch (e) {
          return "Error: " + e;
        }
      });

      if (typeof newFiles === "object") {
        network.state.data.files = newFiles;
      }
    }
  }),
  createTool({
    name: "readFiles",
    description: "Read files from the sandbox",
    parameters: z.object({
      files: z.array(z.string()),
    }),
    handler: async ({ files }, { step }) => {
      return await step?.run("readFiles", async () => {
        try {
          const sandbox = await getSandbox(sandboxId);
          const contents = [];
          for (const file of files) {
            const content = await sandbox.files.read(file);
            contents.push({ path: file, content });
          }
          return JSON.stringify(contents);
        } catch (e) {
          return "Error: " + e;
        }
      })
    },
  })
];

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    console.log("[DEBUG] Starting code-agent function");
    console.log("[DEBUG] Event data:", JSON.stringify(event.data));
    console.log("[DEBUG] E2B_API_KEY present:", !!process.env.E2B_API_KEY);
    console.log("[DEBUG] AI_GATEWAY_API_KEY present:", !!process.env.AI_GATEWAY_API_KEY);
    
    // Get project to check if framework is already set
    const project = await step.run("get-project", async () => {
      return await prisma.project.findUnique({
        where: { id: event.data.projectId },
      });
    });

    let selectedFramework: Framework = project?.framework?.toLowerCase() as Framework || 'nextjs';

    // If project doesn't have a framework set, use framework selector
    if (!project?.framework) {
      console.log("[DEBUG] No framework set, running framework selector...");
      
      const frameworkSelectorAgent = createAgent({
        name: "framework-selector",
        description: "Determines the best framework for the user's request",
        system: FRAMEWORK_SELECTOR_PROMPT,
        model: openai({
          model: "google/gemini-2.5-flash-lite",
          apiKey: process.env.AI_GATEWAY_API_KEY!,
          baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
          defaultParameters: {
            temperature: 0.3,
          },
        }),
      });

      const frameworkResult = await frameworkSelectorAgent.run(event.data.value);
      const frameworkOutput = frameworkResult.output[0];
      
      if (frameworkOutput.type === "text") {
        const detectedFramework = (typeof frameworkOutput.content === "string" 
          ? frameworkOutput.content 
          : frameworkOutput.content.map((c) => c.text).join("")).trim().toLowerCase();
        
        console.log("[DEBUG] Framework selector output:", detectedFramework);
        
        if (['nextjs', 'angular', 'react', 'vue', 'svelte'].includes(detectedFramework)) {
          selectedFramework = detectedFramework as Framework;
        }
      }
      
      console.log("[DEBUG] Selected framework:", selectedFramework);
      
      // Update project with selected framework
      await step.run("update-project-framework", async () => {
        return await prisma.project.update({
          where: { id: event.data.projectId },
          data: { framework: toPrismaFramework(selectedFramework) },
        });
      });
    } else {
      console.log("[DEBUG] Using existing framework:", selectedFramework);
    }
    
    const sandboxId = await step.run("get-sandbox-id", async () => {
      console.log("[DEBUG] Creating E2B sandbox for framework:", selectedFramework);
      const template = getE2BTemplate(selectedFramework);
      
      try {
        let sandbox;
        try {
          console.log("[DEBUG] Attempting to create sandbox with template:", template);
          sandbox = await Sandbox.create(template, {
            apiKey: process.env.E2B_API_KEY,
            timeoutMs: SANDBOX_TIMEOUT,
          });
        } catch {
          // Fallback to default zapdev template if framework-specific doesn't exist
          console.log("[DEBUG] Framework template not found, using default 'zapdev' template");
          sandbox = await Sandbox.create("zapdev", {
            apiKey: process.env.E2B_API_KEY,
            timeoutMs: SANDBOX_TIMEOUT,
          });
          // Fallback framework to nextjs if template doesn't exist
          selectedFramework = 'nextjs';
        }
        
        console.log("[DEBUG] Sandbox created successfully:", sandbox.sandboxId);
        await sandbox.setTimeout(SANDBOX_TIMEOUT);
        return sandbox.sandboxId;
      } catch (error) {
        console.error("[ERROR] Failed to create E2B sandbox:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`E2B sandbox creation failed: ${errorMessage}`);
      }
    });

    const previousMessages = await step.run("get-previous-messages", async () => {
      console.log("[DEBUG] Fetching previous messages for project:", event.data.projectId);
      const formattedMessages: Message[] = [];

      try {
        const messages = await prisma.message.findMany({
          where: {
            projectId: event.data.projectId,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 3,
        });
        
        console.log("[DEBUG] Found", messages.length, "previous messages");

        for (const message of messages) {
          formattedMessages.push({
            type: "text",
            role: message.role === "ASSISTANT" ? "assistant" : "user",
            content: message.content,
          })
        }

        return formattedMessages.reverse();
      } catch (error) {
        console.error("[ERROR] Failed to fetch previous messages:", error);
        return [];
      }
    });

    await step.run("notify-screenshots", async () => {
      const urls = extractUrls(event.data.value ?? "").slice(0, 2);
      if (urls.length === 0) {
        return;
      }

      try {
        for (const url of urls) {
          await prisma.message.create({
            data: {
              projectId: event.data.projectId,
              content: `📸 Taking screenshot of ${url}...`,
              role: "ASSISTANT",
              type: "RESULT",
              status: "COMPLETE",
            },
          });
        }
      } catch (error) {
        console.error("[ERROR] Failed to create screenshot notifications:", error);
      }
    });

    const crawledContexts = await step.run("crawl-url-context", async () => {
      try {
        const urls = extractUrls(event.data.value ?? "").slice(0, 2);

        if (urls.length === 0) {
          return [] as CrawledContent[];
        }

        console.log("[DEBUG] Found URLs in input:", urls);

        const crawlWithTimeout = async (url: string): Promise<CrawledContent | null> => {
          try {
            return await Promise.race([
              crawlUrl(url),
              new Promise<null>((resolve) => 
                setTimeout(() => {
                  console.warn("[DEBUG] Crawl timeout for URL:", url);
                  resolve(null);
                }, 10000)
              ),
            ]);
          } catch (error) {
            console.error("[ERROR] Crawl error for URL:", url, error);
            return null;
          }
        };

        const results = await Promise.all(
          urls.map(url => crawlWithTimeout(url))
        );

        return results.filter((crawled): crawled is CrawledContent => crawled !== null);
      } catch (error) {
        console.error("[ERROR] Failed to crawl URLs", error);
        return [] as CrawledContent[];
      }
    });

    const contextMessages: Message[] = (crawledContexts ?? []).map((context) => ({
      type: "text",
      role: "system",
      content: `Crawled context from ${context.url}:\n${context.content}`,
    }));

    const initialMessages = [...contextMessages, ...previousMessages];

    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
        selectedFramework,
        summaryRetryCount: 0,
      },
      {
        messages: initialMessages,
      },
    );

    const frameworkPrompt = getFrameworkPrompt(selectedFramework);
    console.log("[DEBUG] Using prompt for framework:", selectedFramework);

    const codeAgent = createAgent<AgentState>({
      name: `${selectedFramework}-code-agent`,
      description: `An expert ${selectedFramework} coding agent`,
      system: frameworkPrompt,
      model: openai({
        model: "anthropic/claude-haiku-4.5",
        apiKey: process.env.AI_GATEWAY_API_KEY!,
        baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
        defaultParameters: {
          temperature: 0.7,
          frequency_penalty: 0.5,
        },
      }),
      tools: createCodeAgentTools(sandboxId),
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            const containsSummaryTag = lastAssistantMessageText.includes("<task_summary>");
            console.log(
              `[DEBUG] Agent response received (contains summary tag: ${containsSummaryTag})`
            );
            if (containsSummaryTag) {
              network.state.data.summary = extractSummaryText(lastAssistantMessageText);
              network.state.data.summaryRetryCount = 0;
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 8,
      defaultState: state,
      router: async ({ network }) => {
        const summaryText = extractSummaryText(network.state.data.summary ?? "");
        const fileEntries = network.state.data.files ?? {};
        const fileCount = Object.keys(fileEntries).length;

        if (summaryText.length > 0) {
          return;
        }

        if (fileCount === 0) {
          network.state.data.summaryRetryCount = 0;
          return codeAgent;
        }

        const currentRetry = network.state.data.summaryRetryCount ?? 0;
        if (currentRetry >= 2) {
          console.warn(
            "[WARN] Missing <task_summary> after multiple attempts despite generated files; proceeding with fallback handling."
          );
          return;
        }

        const nextRetry = currentRetry + 1;
        network.state.data.summaryRetryCount = nextRetry;
        console.log(
          `[DEBUG] No <task_summary> yet; retrying agent to request summary (attempt ${nextRetry}).`
        );
        return codeAgent;
      },
    });

    console.log("[DEBUG] Running network with input:", event.data.value);
    let result = await network.run(event.data.value, { state });

    // Post-completion validation: Run lint and build checks to catch any errors the agent missed
    console.log("[DEBUG] Running post-completion validation checks...");
    const [lintErrors, buildErrors] = await Promise.all([
      step.run("post-completion-lint-check", async () => {
        return await runLintCheck(sandboxId);
      }),
      step.run("post-completion-build-check", async () => {
        return await runBuildCheck(sandboxId);
      })
    ]);

    let autoFixAttempts = 0;
    let lastAssistantMessage = getLastAssistantMessage(result);

    if (selectedFramework === 'nextjs') {
      const currentFiles = (result.state.data.files || {}) as Record<string, string>;
      if (Object.keys(currentFiles).length > 0 && !usesShadcnComponents(currentFiles)) {
        const shadcnErrorMessage = "[ERROR] Missing Shadcn UI usage. Rebuild the UI using components imported from '@/components/ui/*' instead of plain HTML elements.";
        console.warn("[WARN] Shadcn usage check failed. Triggering auto-fix.");
        if (!shouldTriggerAutoFix(lastAssistantMessage)) {
          lastAssistantMessage = shadcnErrorMessage;
        } else {
          lastAssistantMessage = `${lastAssistantMessage}\n${shadcnErrorMessage}`;
        }
      }
    }

    // Collect all validation errors
    let validationErrors = [lintErrors, buildErrors].filter(Boolean).join("\n\n");
    
    // Always include validation errors in the error message if they exist
    if (validationErrors) {
      console.log("[DEBUG] Validation errors detected:", validationErrors);
      if (!lastAssistantMessage || !shouldTriggerAutoFix(lastAssistantMessage)) {
        lastAssistantMessage = `Validation Errors Detected:\n${validationErrors}`;
      } else {
        lastAssistantMessage = `${lastAssistantMessage}\n\nValidation Errors:\n${validationErrors}`;
      }
    }

    // Auto-fix loop: continue until errors are resolved or max attempts reached
    while (
      autoFixAttempts < AUTO_FIX_MAX_ATTEMPTS &&
      (shouldTriggerAutoFix(lastAssistantMessage) || validationErrors)
    ) {
      autoFixAttempts += 1;
      const errorDetails = validationErrors || lastAssistantMessage || "No error details provided.";

      console.log(
        `\n[DEBUG] Auto-fix triggered (attempt ${autoFixAttempts}). Errors detected.\n${errorDetails}\n`
      );

      result = await network.run(
        `CRITICAL ERROR DETECTED - IMMEDIATE FIX REQUIRED

The previous attempt encountered an error that must be corrected before proceeding.

Error details:
${errorDetails}

REQUIRED ACTIONS:
1. Carefully analyze the error message to identify the root cause
2. Check for common issues:
   - Missing imports or incorrect import paths
   - TypeScript type errors or incorrect type usage
   - Missing package installations
   - Syntax errors or typos
   - Security vulnerabilities (XSS, injection, etc.)
   - Runtime errors (undefined variables, null references)
3. Apply the necessary fix to resolve the error completely
4. Verify the fix by checking the code logic and types
5. If needed, install missing packages or update configurations
6. Rerun any commands that failed and verify they now succeed
7. Provide an updated <task_summary> only after the error is fully resolved

DO NOT proceed until the error is completely fixed. The fix must be thorough and address the root cause, not just mask the symptoms.`,
        { state: result.state }
      );

      lastAssistantMessage = getLastAssistantMessage(result);

      // Re-run validation checks to verify if errors are actually fixed
      console.log("[DEBUG] Re-running validation checks after auto-fix attempt...");
      const [newLintErrors, newBuildErrors] = await Promise.all([
        step.run(`post-fix-lint-check-${autoFixAttempts}`, async () => {
          return await runLintCheck(sandboxId);
        }),
        step.run(`post-fix-build-check-${autoFixAttempts}`, async () => {
          return await runBuildCheck(sandboxId);
        })
      ]);

      validationErrors = [newLintErrors, newBuildErrors].filter(Boolean).join("\n\n");
      
      if (validationErrors) {
        console.log("[DEBUG] Validation errors still present after fix attempt:", validationErrors);
      } else {
        console.log("[DEBUG] All validation errors resolved!");
      }

      // Update lastAssistantMessage with validation results if still present
      if (validationErrors) {
        if (!shouldTriggerAutoFix(lastAssistantMessage)) {
          lastAssistantMessage = `Validation Errors Still Present:\n${validationErrors}`;
        } else {
          lastAssistantMessage = `${lastAssistantMessage}\n\nValidation Errors:\n${validationErrors}`;
        }
      }
    }

    lastAssistantMessage = getLastAssistantMessage(result);

    const files = (result.state.data.files || {}) as Record<string, string>;
    const filePaths = Object.keys(files);
    const hasFiles = filePaths.length > 0;

    let summaryText = extractSummaryText(
      typeof result.state.data.summary === "string" ? result.state.data.summary : ""
    );
    const agentProvidedSummary = summaryText.length > 0;
    const agentReportedError = shouldTriggerAutoFix(lastAssistantMessage);

    if (!agentProvidedSummary && hasFiles) {
      const previewFiles = filePaths.slice(0, 5);
      const remainingCount = filePaths.length - previewFiles.length;
      summaryText = `Generated or updated ${filePaths.length} file${filePaths.length === 1 ? "" : "s"}: ${previewFiles.join(", ")}${remainingCount > 0 ? ` (and ${remainingCount} more)` : ""}.`;
      console.warn(
        "[WARN] Missing <task_summary> from agent despite generated files; using fallback summary."
      );
    }

    result.state.data.summary = summaryText;

    const hasSummary = summaryText.length > 0;

    console.log(
      `[DEBUG] Network run complete. Summary status: ${hasSummary ? "present" : "missing"}`
    );
    if (hasSummary) {
      console.log("[DEBUG] Summary preview:", summaryText.slice(0, 160));
    }
    console.log("[DEBUG] Files generated:", filePaths.length);
    if (filePaths.length > 0) {
      console.log("[DEBUG] File list preview:", filePaths.slice(0, 10));
    }
    if (agentReportedError) {
      console.warn("[WARN] Last assistant message still signals an unresolved error.");
    }

    const errorReasons: string[] = [];
    const shadcnCompliant = selectedFramework !== 'nextjs' || usesShadcnComponents(files);

    if (!hasFiles) {
      errorReasons.push("no files generated");
    }
    if (!hasSummary) {
      errorReasons.push("no summary available");
    }
    if (agentReportedError) {
      errorReasons.push("agent reported unresolved error");
    }
    if (!shadcnCompliant) {
      errorReasons.push("missing Shadcn UI components");
    }

    const isError = errorReasons.length > 0;
    if (isError) {
      console.warn(`[WARN] Completion flagged as error: ${errorReasons.join(", ")}`);
    } else {
      console.log("[DEBUG] Completion flagged as success.");
    }

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);

      if (typeof (sandbox as SandboxWithHost).getHost === "function") {
        const host = (sandbox as SandboxWithHost).getHost(getFrameworkPort(selectedFramework));

        if (host && host.length > 0) {
          return host.startsWith("http") ? host : `https://${host}`;
        }
      }

      const fallbackHost = `https://${sandboxId}.sandbox.e2b.dev`;
      console.warn("[WARN] Using fallback sandbox host:", fallbackHost);
      return fallbackHost;
    });

    let fragmentTitleOutput: Message[] | undefined;
    let responseOutput: Message[] | undefined;

    if (!isError && hasSummary && hasFiles) {
      try {
        const titleModel = openai({
          model: "google/gemini-2.5-flash-lite",
          apiKey: process.env.AI_GATEWAY_API_KEY!,
          baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
          defaultParameters: {
            temperature: 0.3,
          },
        });

        const fragmentTitleGenerator = createAgent({
          name: "fragment-title-generator",
          description: "A fragment title generator",
          system: FRAGMENT_TITLE_PROMPT,
          model: titleModel,
        });

        const responseGenerator = createAgent({
          name: "response-generator",
          description: "A response generator",
          system: RESPONSE_PROMPT,
          model: titleModel,
        });

        const [titleResult, responseResult] = await Promise.all([
          fragmentTitleGenerator.run(summaryText),
          responseGenerator.run(summaryText),
        ]);

        fragmentTitleOutput = titleResult.output;
        responseOutput = responseResult.output;
      } catch (gatewayError) {
        console.error("[ERROR] Failed to generate fragment metadata:", gatewayError);
        fragmentTitleOutput = undefined;
        responseOutput = undefined;
      }
    }

    const allScreenshots = await step.run("collect-screenshots", async () => {
      const screenshots: string[] = [];
      for (const context of crawledContexts) {
        if (context.screenshots && Array.isArray(context.screenshots)) {
          screenshots.push(...context.screenshots);
        }
      }
      return screenshots.filter((s): s is string => typeof s === "string" && s.length > 0);
    });

    const allSandboxFiles = await step.run("read-all-sandbox-files", async () => {
      if (isError) {
        return {};
      }

      try {
        const sandbox = await getSandbox(sandboxId);
        const allFilesMap: Record<string, string> = {};

        const findCommand = selectedFramework === 'nextjs' 
          ? "find /home/user -type f -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' 2>/dev/null || find . -type f -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' 2>/dev/null"
          : "find /home/user -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' 2>/dev/null || find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' 2>/dev/null";

        const findResult = await sandbox.commands.run(findCommand);
        const filePaths = findResult.stdout
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.includes('Permission denied'));

        console.log(`[DEBUG] Found ${filePaths.length} files in sandbox`);

        for (const filePath of filePaths) {
          try {
            const content = await sandbox.files.read(filePath);
            if (content !== null && content !== undefined) {
              allFilesMap[filePath] = content;
            }
          } catch {
            console.log(`[DEBUG] File ${filePath} not readable, skipping`);
          }
        }

        console.log(`[DEBUG] Successfully read ${Object.keys(allFilesMap).length} files from sandbox`);
        return allFilesMap;
      } catch (error) {
        console.error("[ERROR] Failed to read all sandbox files:", error);
        return {};
      }
    });

    const agentFiles = result.state.data.files || {};
    const mergedFiles = { ...allSandboxFiles, ...agentFiles };

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
            status: "COMPLETE",
          },
        });
      }

      const parsedResponse = parseAgentOutput(responseOutput);
      const parsedTitle = parseAgentOutput(fragmentTitleOutput);

      const metadata: Prisma.JsonObject = {};
      if (allScreenshots.length > 0) {
        metadata.screenshots = allScreenshots;
      }

      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: parsedResponse ?? "Generated code is ready.",
          role: "ASSISTANT",
          type: "RESULT",
          status: "COMPLETE",
          Fragment: {
            create: {
              sandboxId: sandboxId,
              sandboxUrl: sandboxUrl,
              title: parsedTitle ?? "Generated Fragment",
              files: mergedFiles,
              framework: toPrismaFramework(selectedFramework),
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            },
          },
        },
      })
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: mergedFiles,
      summary: result.state.data.summary,
    };
  },
);

export const sandboxTransferFunction = inngest.createFunction(
  { id: "sandbox-transfer" },
  { event: "sandbox-transfer/run" },
  async ({ event, step }) => {
    console.log("[DEBUG] Starting sandbox resume function");
    console.log("[DEBUG] Event data:", JSON.stringify(event.data));

    const fragment = await step.run("get-fragment", async () => {
      return await prisma.fragment.findUnique({
        where: { id: event.data.fragmentId },
      });
    });

    if (!fragment) {
      throw new Error("Fragment not found");
    }

    if (!fragment.sandboxId) {
      throw new Error("Fragment has no sandbox");
    }

    const sandboxId = fragment.sandboxId;
    const framework = (fragment.framework?.toLowerCase() || "nextjs") as Framework;

    const sandbox = await step.run("resume-sandbox", async () => {
      try {
        console.log("[DEBUG] Connecting to sandbox to resume:", sandboxId);
        const connection = await getSandbox(sandboxId);
        console.log("[DEBUG] Sandbox resumed successfully");
        return connection;
      } catch (error) {
        console.error("[ERROR] Failed to resume sandbox:", error);
        throw new Error("Sandbox resume failed. Please trigger a new build.");
      }
    });

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      if (typeof (sandbox as SandboxWithHost).getHost === "function") {
        const host = (sandbox as SandboxWithHost).getHost(getFrameworkPort(framework));
        if (host && host.length > 0) {
          return host.startsWith("http") ? host : `https://${host}`;
        }
      }

      const fallbackHost = `https://${sandboxId}.sandbox.e2b.dev`;
      console.warn("[WARN] Using fallback sandbox host:", fallbackHost);
      return fallbackHost;
    });

    await step.run("update-fragment", async () => {
      return await prisma.fragment.update({
        where: { id: event.data.fragmentId },
        data: {
          sandboxUrl,
        },
      });
    });

    console.log("[DEBUG] Sandbox resume complete. URL:", sandboxUrl);

    return {
      sandboxId,
      sandboxUrl,
    };
  },
);

export const errorFixFunction = inngest.createFunction(
  { id: "error-fix" },
  { event: "error-fix/run" },
  async ({ event, step }) => {
    console.log("[DEBUG] Starting error-fix function (no credit charge)");
    console.log("[DEBUG] Event data:", JSON.stringify(event.data));

    const fragment = await step.run("get-fragment", async () => {
      return await prisma.fragment.findUnique({
        where: { id: event.data.fragmentId },
      });
    });

    if (!fragment) {
      throw new Error("Fragment not found");
    }

    if (!fragment.sandboxId) {
      throw new Error("Fragment has no active sandbox");
    }

    const fragmentFramework = (fragment.framework?.toLowerCase() || 'nextjs') as Framework;
    const sandboxId = fragment.sandboxId;

    await step.run("validate-sandbox", async () => {
      try {
        await getSandbox(sandboxId);
      } catch (error) {
        console.error("[ERROR] Sandbox validation failed:", error);
        throw new Error("Sandbox is no longer active. Please refresh the fragment.");
      }
    });

    const toJsonObject = (value: unknown): Prisma.JsonObject => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return {} as Prisma.JsonObject;
      }

      return { ...(value as Prisma.JsonObject) };
    };

    const fragmentRecord = fragment as Record<string, unknown>;
    const supportsMetadata = Object.prototype.hasOwnProperty.call(fragmentRecord, "metadata");
    const initialMetadata = supportsMetadata ? toJsonObject(fragmentRecord.metadata) : ({} as Prisma.JsonObject);

    const fragmentFiles = (fragment.files || {}) as Record<string, string>;
    const originalFiles = { ...fragmentFiles };

    console.log("[DEBUG] Running error detection on sandbox:", sandboxId);

    // Run validation checks to detect errors
    const [lintErrors, buildErrors] = await Promise.all([
      step.run("error-fix-lint-check", async () => {
        return await runLintCheck(sandboxId);
      }),
      step.run("error-fix-build-check", async () => {
        return await runBuildCheck(sandboxId);
      })
    ]);

    const validationErrors = [lintErrors, buildErrors].filter(Boolean).join("\n\n");

    if (!validationErrors) {
      console.log("[DEBUG] No errors detected in fragment");
      return {
        success: true,
        message: "No errors detected",
      };
    }

    console.log("[DEBUG] Errors detected, running fix agent...");

    // Create a minimal state with existing files
    const state = createState<AgentState>(
      {
        summary: (fragmentRecord.metadata as Record<string, unknown>)?.summary as string ?? "",
        files: fragmentFiles,
        selectedFramework: fragmentFramework,
        summaryRetryCount: 0,
      },
      {
        messages: [],
      },
    );

    const frameworkPrompt = getFrameworkPrompt(fragmentFramework);
    const codeAgent = createAgent<AgentState>({
      name: `${fragmentFramework}-error-fix-agent`,
      description: `An expert ${fragmentFramework} coding agent for fixing errors`,
      system: frameworkPrompt,
      model: openai({
        model: "minimax/minimax-m2",
        apiKey: process.env.AI_GATEWAY_API_KEY!,
        baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
        defaultParameters: {
          temperature: 0.5,
          frequency_penalty: 0.5,
        },
      }),
      tools: createCodeAgentTools(sandboxId),
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText = lastAssistantTextMessageContent(result);
          if (lastAssistantMessageText && network) {
            const containsSummaryTag = lastAssistantMessageText.includes("<task_summary>");
            console.log(
              `[DEBUG] Error-fix agent response received (contains summary tag: ${containsSummaryTag})`
            );
            if (containsSummaryTag) {
              network.state.data.summary = extractSummaryText(lastAssistantMessageText);
              network.state.data.summaryRetryCount = 0;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "error-fix-network",
      agents: [codeAgent],
      maxIter: 10,
      defaultState: state,
      router: async ({ network }) => {
        const summaryText = extractSummaryText(network.state.data.summary ?? "");
        const fileEntries = network.state.data.files ?? {};
        const fileCount = Object.keys(fileEntries).length;

        if (summaryText.length > 0) {
          return;
        }

        if (fileCount === 0) {
          network.state.data.summaryRetryCount = 0;
          return codeAgent;
        }

        const currentRetry = network.state.data.summaryRetryCount ?? 0;
        if (currentRetry >= 3) {
          console.warn(
            "[WARN] Error-fix agent missing <task_summary> after multiple retries; proceeding with collected fixes."
          );
          return;
        }

        const nextRetry = currentRetry + 1;
        network.state.data.summaryRetryCount = nextRetry;
        console.log(
          `[DEBUG] Error-fix agent missing <task_summary>; retrying (attempt ${nextRetry}).`
        );
        return codeAgent;
      },
    });

    const fixPrompt = `CRITICAL ERROR FIX REQUEST

The following errors were detected in the application and need to be fixed immediately:

${validationErrors}

REQUIRED ACTIONS:
1. Carefully analyze the error messages to identify the root cause
2. Check for common issues:
   - Missing imports or incorrect import paths
   - TypeScript type errors or incorrect type usage
   - Syntax errors or typos in the code
   - Missing package installations
   - Configuration issues
3. Apply the necessary fixes to resolve ALL errors completely
4. Verify the fixes by ensuring the code is syntactically correct
5. Provide a <task_summary> explaining what was fixed

DO NOT proceed until all errors are completely resolved. Focus on fixing the root cause, not just masking symptoms.`;

    try {
      const result = await network.run(fixPrompt, { state });

      // Re-run validation checks to verify if errors are actually fixed
      console.log("[DEBUG] Re-running validation checks after error fix...");
      const [newLintErrors, newBuildErrors] = await Promise.all([
        step.run("error-fix-verification-lint-check", async () => {
          return await runLintCheck(sandboxId);
        }),
        step.run("error-fix-verification-build-check", async () => {
          return await runBuildCheck(sandboxId);
        })
      ]);

      const remainingErrors = [newLintErrors, newBuildErrors].filter(Boolean).join("\n\n");
      
      if (remainingErrors) {
        console.warn("[WARN] Some errors remain after fix attempt:", remainingErrors);
      } else {
        console.log("[DEBUG] All errors resolved!");
      }

      // Ensure all fixed files are written back to the sandbox
      await step.run("sync-fixed-files-to-sandbox", async () => {
        const fixedFiles = result.state.data.files || {};
        const sandbox = await getSandbox(sandboxId);
        
        console.log("[DEBUG] Writing fixed files back to sandbox:", Object.keys(fixedFiles).length);
        
        for (const [path, content] of Object.entries(fixedFiles)) {
          try {
            await sandbox.files.write(path, content);
          } catch (error) {
            console.error(`[ERROR] Failed to write file ${path} to sandbox:`, error);
          }
        }
        
        console.log("[DEBUG] All fixed files synced to sandbox");
      });

      const backupMetadata = await step.run("backup-original-files", async () => {
        if (!supportsMetadata) {
          console.warn("[WARN] Fragment metadata field not available; skipping backup snapshot");
          return null;
        }

        console.log("[DEBUG] Backing up original files before applying fixes");
        const metadata: Prisma.JsonObject = {
          ...initialMetadata,
          previousFiles: originalFiles,
          fixedAt: new Date().toISOString(),
        };

        await prisma.fragment.update({
          where: { id: event.data.fragmentId },
          data: {
            metadata,
          } as Prisma.FragmentUpdateInput,
        });

        return metadata;
      });

      await step.run("update-fragment-files", async () => {
        const metadataUpdate = supportsMetadata
          ? ({
              ...((backupMetadata ?? initialMetadata) as Prisma.JsonObject),
              previousFiles: originalFiles,
              fixedAt: new Date().toISOString(),
              lastFixSuccess: {
                summary: result.state.data.summary,
                occurredAt: new Date().toISOString(),
              },
            } satisfies Prisma.JsonObject)
          : null;

        return await prisma.fragment.update({
          where: { id: event.data.fragmentId },
          data: {
            files: result.state.data.files,
            ...(metadataUpdate
              ? {
                  metadata: metadataUpdate,
                }
              : {}),
          } as Prisma.FragmentUpdateInput,
        });
      });

      console.log("[DEBUG] Error fix complete");

      return {
        success: true,
        message: remainingErrors ? "Some errors may remain. Please check the sandbox." : "Errors fixed successfully",
        summary: result.state.data.summary,
        remainingErrors: remainingErrors || undefined,
      };
    } catch (error) {
      console.error("[ERROR] Error fix failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const friendlyMessage = errorMessage.toLowerCase().includes("timeout")
        ? "Automatic fix timed out. Please refresh the fragment."
        : "Automatic fix failed. Please review the sandbox and try again.";

      await step.run("record-error-fix-failure", async () => {
        if (!supportsMetadata) {
          console.warn("[WARN] Fragment metadata field not available; skipping failure metadata update");
          return null;
        }

        console.log("[DEBUG] Recording failure details for fragment", event.data.fragmentId);

        let latestMetadata = initialMetadata;
        try {
          const latestFragment = await prisma.fragment.findUnique({
            where: { id: event.data.fragmentId },
          });

          if (latestFragment) {
            const fragmentData = latestFragment as Record<string, unknown>;
            latestMetadata = toJsonObject(fragmentData.metadata);
          }
        } catch (metadataReadError) {
          console.error("[ERROR] Failed to load latest metadata:", metadataReadError);
        }

        const failureMetadata: Prisma.JsonObject = {
          ...latestMetadata,
          lastFixFailure: {
            message: errorMessage,
            occurredAt: new Date().toISOString(),
            friendlyMessage,
          },
        };

        try {
          await prisma.fragment.update({
            where: { id: event.data.fragmentId },
            data: {
              metadata: failureMetadata,
            } as Prisma.FragmentUpdateInput,
          });
        } catch (metadataError) {
          console.error("[ERROR] Failed to persist failure metadata:", metadataError);
        }

        return failureMetadata;
      });

      return {
        success: false,
        message: friendlyMessage,
        error: errorMessage,
      };
    }
  },
);

export const sandboxCleanupFunction = inngest.createFunction(
  { id: "sandbox-cleanup" },
  {
    cron: "0 0 * * *", // Every day at midnight UTC
  },
  async ({ step }) => {
    console.log("[DEBUG] Running sandbox cleanup job");

    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - thirtyDays;
    const killedSandboxIds: string[] = [];

    await step.run("cleanup-paused-sandboxes", async () => {
      const sandboxes = await Sandbox.list();

      for (const sandbox of sandboxes) {
        const startedAt = sandbox.startedAt instanceof Date ? sandbox.startedAt.getTime() : new Date(sandbox.startedAt).getTime();

        if (
          sandbox.state === "paused" &&
          Number.isFinite(startedAt) &&
          startedAt <= cutoff
        ) {
          try {
            await Sandbox.kill(sandbox.sandboxId);
            killedSandboxIds.push(sandbox.sandboxId);
            console.log("[DEBUG] Killed sandbox due to age:", sandbox.sandboxId);
          } catch (error) {
            console.error("[ERROR] Failed to kill sandbox", sandbox.sandboxId, error);
          }
        }
      }
    });

    console.log("[DEBUG] Sandbox cleanup complete. Killed:", killedSandboxIds);

    return {
      killedSandboxIds,
    };
  },
);
