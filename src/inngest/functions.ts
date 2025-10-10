import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import { openai, createAgent, createTool, createNetwork, type Tool, type Message, createState, type NetworkRun } from "@inngest/agent-kit";

import { prisma } from "@/lib/db";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";

import { inngest } from "./client";
import { SANDBOX_TIMEOUT } from "./types";
import { getSandbox, lastAssistantTextMessageContent, parseAgentOutput } from "./utils";

const AUTO_FIX_MAX_ATTEMPTS = 1;
const AUTO_FIX_ERROR_PATTERNS = [
  /ESLint/i,
  /Type error/i,
  /Module not found/i,
  /Cannot find module/i,
  /Parsing error/i,
  /unexpected token/i,
];

const shouldTriggerAutoFix = (message?: string) => {
  if (!message) {
    return false;
  }

  return AUTO_FIX_ERROR_PATTERNS.some((pattern) => pattern.test(message));
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

interface AgentState {
  summary: string;
  files: { [path: string]: string };
};

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    console.log("[DEBUG] Starting code-agent function");
    console.log("[DEBUG] Event data:", JSON.stringify(event.data));
    console.log("[DEBUG] E2B_API_KEY present:", !!process.env.E2B_API_KEY);
    console.log("[DEBUG] AI_GATEWAY_API_KEY present:", !!process.env.AI_GATEWAY_API_KEY);
    
    const sandboxId = await step.run("get-sandbox-id", async () => {
      console.log("[DEBUG] Creating E2B sandbox...");
      
      try {
        let sandbox;
        try {
          // Try with zapdev template first
          console.log("[DEBUG] Attempting to create sandbox with 'zapdev' template");
          sandbox = await Sandbox.create("zapdev", {
            apiKey: process.env.E2B_API_KEY,
          });
        } catch {
          // Fallback to default template if zapdev doesn't exist
          console.log("[DEBUG] 'zapdev' template not found, using default template");
          sandbox = await Sandbox.create({
            apiKey: process.env.E2B_API_KEY,
          });
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

    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },
      {
        messages: previousMessages,
      },
    );

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({
        model: "zai/glm-4.6",
        apiKey: process.env.AI_GATEWAY_API_KEY!,
        baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
        defaultParameters: {
          temperature: 0.1,
        },
      }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

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
      ],
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

    let autoFixAttempts = 0;
    let lastAssistantMessage = getLastAssistantMessage(result);

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
        `The previous attempt encountered an error and must be corrected immediately.\n\nError details:\n${errorDetails}\n\nIdentify the root cause, apply the fix, rerun any required steps, and provide an updated summary and file list.`,
        { state: result.state }
      );

      lastAssistantMessage = getLastAssistantMessage(result);
    }

    console.log("[DEBUG] Network run complete. Summary:", result.state.data.summary ? "Present" : "Missing");
    console.log("[DEBUG] Files generated:", Object.keys(result.state.data.files || {}).length);

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "A fragment title generator",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({
        model: "google/gemini-2.5-flash-lite",
        apiKey: process.env.AI_GATEWAY_API_KEY!,
        baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
      }),
    })

    const responseGenerator = createAgent({
      name: "response-generator",
      description: "A response generator",
      system: RESPONSE_PROMPT,
      model: openai({
        model: "google/gemini-2.5-flash-lite",
        apiKey: process.env.AI_GATEWAY_API_KEY!,
        baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
      }),
    });

    const { 
      output: fragmentTitleOuput
    } = await fragmentTitleGenerator.run(result.state.data.summary);
    const { 
      output: responseOutput
    } = await responseGenerator.run(result.state.data.summary);

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
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
          fragment: {
            create: {
              sandboxId: sandboxId,
              sandboxUrl: sandboxUrl,
              title: parseAgentOutput(fragmentTitleOuput),
              files: result.state.data.files,
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

    const newSandboxId = await step.run("create-new-sandbox", async () => {
      console.log("[DEBUG] Creating new E2B sandbox for transfer...");

      try {
        let sandbox;
        try {
          console.log("[DEBUG] Attempting to create sandbox with 'zapdev' template");
          sandbox = await Sandbox.create("zapdev", {
            apiKey: process.env.E2B_API_KEY,
          });
        } catch {
          console.log("[DEBUG] 'zapdev' template not found, using default template");
          sandbox = await Sandbox.create({
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
      const host = sandbox.getHost(3000);
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
