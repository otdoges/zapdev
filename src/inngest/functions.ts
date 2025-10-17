import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import { openai, createAgent, createTool, createNetwork, type Tool, type Message, createState, type NetworkRun } from "@inngest/agent-kit";
import { Framework as PrismaFramework } from "@/generated/prisma";

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

const AUTO_FIX_MAX_ATTEMPTS = 2;
const AUTO_FIX_ERROR_PATTERNS = [
  // Generic Error indicators - catches most errors
  /\bError:/i,
  /\[ERROR\]/i,
  /ERROR/,
  /\bFailed\b/i,
  /\bfailure\b/i,
  /\bException\b/i,

  // ECMAScript & JavaScript Errors
  /ECMAScript/i,
  /EcmaScript/i,
  /ES\d+.*error/i,
  /ESNext.*error/i,
  /Script error/i,
  /JavaScript error/i,
  /SyntaxError/i,
  /EvalError/i,
  /RangeError/i,
  /URIError/i,
  /AggregateError/i,
  /InternalError/i,

  // TypeScript & Linting Errors
  /ESLint/i,
  /Type error/i,
  /TypeError/i,
  /TS\d+/i,
  /tsc.*error/i,

  // Module & Import Errors
  /Module not found/i,
  /Cannot find module/i,
  /Failed to resolve/i,
  /Import.*not found/i,
  /Cannot resolve/i,
  /require.*is not defined/i,
  /ERR_MODULE_NOT_FOUND/i,

  // Syntax & Parsing Errors
  /Parsing error/i,
  /Syntax error/i,
  /unexpected token/i,
  /Unexpected identifier/i,
  /Unexpected end of input/i,
  /Unexpected string/i,
  /Invalid or unexpected token/i,

  // Runtime Errors
  /ReferenceError/i,
  /undefined is not/i,
  /null is not/i,
  /Cannot read propert/i,
  /Cannot access/i,
  /is not a function/i,
  /is not defined/i,
  /is not iterable/i,
  /Assignment to constant/i,
  /Maximum call stack/i,
  /stack overflow/i,

  // Specific Import/Typo Errors
  /useDate is not defined/i,
  /useState is not defined/i,
  /useEffect is not defined/i,
  /useRef is not defined/i,
  /is not exported/i,
  /Named export.*not found/i,
  /Default export.*not found/i,

  // Build & Compilation Errors
  /Build failed/i,
  /Build error/i,
  /Compilation error/i,
  /Failed to compile/i,
  /Error compiling/i,
  /Minification failed/i,
  /Bundling failed/i,
  /✖/,  // ESLint error indicator

  // Vite/Webpack/Bundler Errors
  /\[vite\].*error/i,
  /webpack.*error/i,
  /rollup.*error/i,
  /esbuild.*error/i,

  // Framework Errors
  /Hydration.*error/i,
  /React.*error/i,
  /Vue.*error/i,
  /Angular.*error/i,
  /Svelte.*error/i,
  /Next\.js.*error/i,

  // Dependency Errors
  /npm.*error/i,
  /pnpm.*error/i,
  /yarn.*error/i,
  /bun.*error/i,
  /dependency.*error/i,
  /Package.*not installed/i,
  /ENOENT/i,
  /EACCES/i,

  // Network & API Errors
  /Network error/i,
  /Fetch.*failed/i,
  /CORS.*error/i,
  /timeout/i,
  /ETIMEDOUT/i,
  /ECONNREFUSED/i,

  // Security Warnings
  /security/i,
  /vulnerable/i,
  /XSS/i,
  /injection/i,
  /CSRF/i,

  // ESLint specific output
  /eslint/i,
  /problems?/i,
  /warnings?/i,
  /errors?/i,
  /issues?/i,
  /line \d+/i,  // ESLint line number format
];

// Additional stricter pattern for lint output that contains error indicators
const LINT_OUTPUT_ERROR_PATTERN = /(?:error|warning|✖|problem)[\s\S]*?(?:line \d+|at |^)/i;

const URL_REGEX = /(https?:\/\/[^\s\]\)"'<>]+)/gi;

const extractUrls = (value: string) => {
  const matches = value.matchAll(URL_REGEX);
  const urls = new Set<string>();

  for (const match of matches) {
    const candidate = match[0];

    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        urls.add(parsed.toString());
      }
    } catch (error) {
      console.warn("[DEBUG] Skipping invalid URL", { candidate, error });
    }
  }

  return Array.from(urls);
};

const shouldTriggerAutoFix = (message?: string) => {
  if (!message) {
    return false;
  }

  // Check if any of the standard error patterns match
  const standardPatternMatch = AUTO_FIX_ERROR_PATTERNS.some((pattern) => pattern.test(message));

  // Also check for lint-specific output patterns
  const lintPatternMatch = LINT_OUTPUT_ERROR_PATTERN.test(message);

  return standardPatternMatch || lintPatternMatch;
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
          });
        } catch {
          // Fallback to default zapdev template if framework-specific doesn't exist
          console.log("[DEBUG] Framework template not found, using default 'zapdev' template");
          sandbox = await Sandbox.create("zapdev", {
            apiKey: process.env.E2B_API_KEY,
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
          take: 5,
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

    const crawledContexts = await step.run("crawl-url-context", async () => {
      try {
        const urls = extractUrls(event.data.value ?? "").slice(0, 2);

        if (urls.length === 0) {
          return [] as CrawledContent[];
        }

        console.log("[DEBUG] Found URLs in input:", urls);

        const results: CrawledContent[] = [];

        for (const url of urls) {
          const crawled = await crawlUrl(url);

          if (crawled) {
            results.push(crawled);
          }
        }

        return results;
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
        model: "moonshotai/kimi-k2-0905",
        apiKey: process.env.AI_GATEWAY_API_KEY!,
        baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
        defaultParameters: {
          temperature: 0.9,
        },
      }),
      tools: createCodeAgentTools(sandboxId),
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return codeAgent;
      },
    });

    console.log("[DEBUG] Running network with input:", event.data.value);
    let result = await network.run(event.data.value, { state });

    // Post-completion validation: Run lint check to catch any errors the agent missed
    console.log("[DEBUG] Running post-completion lint check...");
    const lintErrors = await step.run("post-completion-lint-check", async () => {
      return await runLintCheck(sandboxId);
    });

    let autoFixAttempts = 0;
    let lastAssistantMessage = getLastAssistantMessage(result);

    // If lint check found errors, inject them into the auto-fix loop
    if (lintErrors && !shouldTriggerAutoFix(lastAssistantMessage)) {
      console.log("[DEBUG] Lint errors detected, triggering auto-fix...");
      lastAssistantMessage = `Lint Check Errors:\n${lintErrors}`;
    }

    while (
      autoFixAttempts < AUTO_FIX_MAX_ATTEMPTS &&
      shouldTriggerAutoFix(lastAssistantMessage)
    ) {
      autoFixAttempts += 1;
      const errorDetails = lastAssistantMessage ?? "No error details provided.";

      console.log(
        `\n[DEBUG] Auto-fix triggered (attempt ${autoFixAttempts}). Last assistant message indicated an error.\n${errorDetails}\n`
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
    }

    console.log("[DEBUG] Network run complete. Summary:", result.state.data.summary ? "Present" : "Missing");
    console.log("[DEBUG] Files generated:", Object.keys(result.state.data.files || {}).length);

    // Generate title and response inline with the fast model
    const titleModel = openai({
      model: "google/gemini-2.5-flash-lite",
      apiKey: process.env.AI_GATEWAY_API_KEY!,
      baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
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

    const fragmentTitlePromise = fragmentTitleGenerator.run(result.state.data.summary);
    const responsePromise = responseGenerator.run(result.state.data.summary);

    const [{ output: fragmentTitleOutput }, { output: responseOutput }] = await Promise.all([
      fragmentTitlePromise,
      responsePromise,
    ]);

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const port = getFrameworkPort(selectedFramework);
      const host = sandbox.getHost(port);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: parseAgentOutput(responseOutput),
          role: "ASSISTANT",
          type: "RESULT",
          Fragment: {
            create: {
              sandboxId: sandboxId,
              sandboxUrl: sandboxUrl,
              title: parseAgentOutput(fragmentTitleOutput),
              files: result.state.data.files,
              framework: toPrismaFramework(selectedFramework),
            },
          },
        },
      })
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);

export const sandboxTransferFunction = inngest.createFunction(
  { id: "sandbox-transfer" },
  { event: "sandbox-transfer/run" },
  async ({ event, step }) => {
    console.log("[DEBUG] Starting sandbox transfer function");
    console.log("[DEBUG] Event data:", JSON.stringify(event.data));

    const fragment = await step.run("get-fragment", async () => {
      return await prisma.fragment.findUnique({
        where: { id: event.data.fragmentId },
      });
    });

    if (!fragment) {
      throw new Error("Fragment not found");
    }

    const fragmentFramework = (fragment.framework?.toLowerCase() || 'nextjs') as Framework;
    const template = getE2BTemplate(fragmentFramework);

    const newSandboxId = await step.run("create-new-sandbox", async () => {
      console.log("[DEBUG] Creating new E2B sandbox for transfer with framework:", fragmentFramework);

      try {
        let sandbox;
        try {
          console.log("[DEBUG] Attempting to create sandbox with template:", template);
          sandbox = await Sandbox.create(template, {
            apiKey: process.env.E2B_API_KEY,
          });
        } catch {
          console.log("[DEBUG] Template not found, using default 'zapdev' template");
          sandbox = await Sandbox.create("zapdev", {
            apiKey: process.env.E2B_API_KEY,
          });
        }

        console.log("[DEBUG] New sandbox created successfully:", sandbox.sandboxId);
        await sandbox.setTimeout(SANDBOX_TIMEOUT);
        return sandbox.sandboxId;
      } catch (error) {
        console.error("[ERROR] Failed to create new E2B sandbox:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`E2B sandbox creation failed: ${errorMessage}`);
      }
    });

    await step.run("transfer-files", async () => {
      console.log("[DEBUG] Transferring files to new sandbox...");

      try {
        const sandbox = await getSandbox(newSandboxId);
        const files = fragment.files as { [path: string]: string };

        for (const [path, content] of Object.entries(files)) {
          await sandbox.files.write(path, content);
        }

        console.log("[DEBUG] Successfully transferred", Object.keys(files).length, "files");
      } catch (error) {
        console.error("[ERROR] Failed to transfer files:", error);
        throw error;
      }
    });

    const newSandboxUrl = await step.run("get-new-sandbox-url", async () => {
      const sandbox = await getSandbox(newSandboxId);
      const port = getFrameworkPort(fragmentFramework);
      const host = sandbox.getHost(port);
      return `https://${host}`;
    });

    await step.run("update-fragment", async () => {
      return await prisma.fragment.update({
        where: { id: event.data.fragmentId },
        data: {
          sandboxId: newSandboxId,
          sandboxUrl: newSandboxUrl,
        },
      });
    });

    console.log("[DEBUG] Sandbox transfer complete. New URL:", newSandboxUrl);

    return {
      sandboxId: newSandboxId,
      sandboxUrl: newSandboxUrl,
    };
  },
);
