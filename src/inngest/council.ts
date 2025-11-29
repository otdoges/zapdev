import {
  createAgent,
  createNetwork,
  openai,
  createState,
  createTool,
  type Tool,
} from "@inngest/agent-kit";
import { z } from "zod";
import { inngest } from "./client";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { Id } from "@/convex/_generated/dataModel";
import { getSandbox, createSandboxWithRetry } from "./utils";
import type { AgentState } from "./types";

// Convex client
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
}
const convex = new ConvexHttpClient(CONVEX_URL);

const DEFAULT_COUNCIL_MODEL = "gpt-4-turbo";
const MODEL = process.env.COUNCIL_MODEL ?? DEFAULT_COUNCIL_MODEL;

// --- E2B Sandbox Tools ---

const createCouncilAgentTools = (sandboxId: string) => [
  createTool({
    name: "terminal",
    description: "Use the terminal to run commands in the sandbox",
    parameters: z.object({
      command: z.string().describe("The shell command to execute"),
    }),
    handler: async (
      { command }: { command: string },
      opts: Tool.Options<AgentState>,
    ) => {
      return await opts.step?.run("terminal", async () => {
        const buffers: { stdout: string; stderr: string } = {
          stdout: "",
          stderr: "",
        };

        try {
          const sandbox = await getSandbox(sandboxId);
          const result = await sandbox.commands.run(command, {
            onStdout: (data: string) => {
              buffers.stdout += data;
            },
            onStderr: (data: string) => {
              buffers.stderr += data;
            },
          });
          return result.stdout;
        } catch (e) {
          console.error(
            `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`,
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
          path: z.string().describe("File path relative to sandbox root"),
          content: z.string().describe("File content"),
        }),
      ),
    }),
    handler: async ({ files }, { step, network }: Tool.Options<AgentState>) => {
      const newFiles = await step?.run("createOrUpdateFiles", async () => {
        try {
          const state = network.state as AgentState;
          const updatedFiles = state.files || {};
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
        const state = network.state as AgentState;
        state.files = newFiles;
      }
    },
  }),
  createTool({
    name: "readFiles",
    description: "Read files from the sandbox",
    parameters: z.object({
      files: z.array(z.string()).describe("Array of file paths to read"),
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
      });
    },
  }),
];

// --- Agents ---

const plannerAgent = createAgent<AgentState>({
  name: "planner",
  description: "Analyzes the task and creates a step-by-step plan",
  system: "You are a senior architect. Break down the user request into actionable steps.",
  model: openai({
    model: MODEL,
    apiKey: process.env.AI_GATEWAY_API_KEY!,
    baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
  }),
});

const reviewerAgent = createAgent<AgentState>({
  name: "reviewer",
  description: "Reviews the implementation and ensures quality",
  system: "You are a strict code reviewer. Check for bugs, security issues, and adherence to requirements.",
  model: openai({
    model: MODEL,
    apiKey: process.env.AI_GATEWAY_API_KEY!,
    baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
  }),
});

// --- Function ---

export const backgroundAgentFunction = inngest.createFunction(
  { id: "background-agent" },
  { event: "background-agent/run" },
  async ({ event, step }) => {
    const jobId = event.data.jobId as Id<"backgroundJobs">;
    const { instruction } = event.data;
    
    // 1. Update status to running
    await step.run("update-status", async () => {
        await convex.mutation(api.backgroundJobs.updateStatus, { 
            jobId, 
            status: "running" 
        });
    });

    // 2. Create E2B Sandbox
    // SECURITY FIX: Only pass serializable sandboxId through Inngest steps
    const sandboxId = await step.run("create-sandbox", async () => {
        const job = await convex.query(api.backgroundJobs.get, { jobId });

        // Explicit null check - job must exist before proceeding
        if (!job) {
            throw new Error(`Job ${jobId} not found in database`);
        }

        let createdSandboxId: string;

        // Check if sandbox already exists and is still accessible
        if (job.sandboxId) {
            try {
                // Attempt to connect to existing E2B sandbox
                const _sandbox = await getSandbox(job.sandboxId);
                console.log(`Reusing existing E2B sandbox: ${job.sandboxId}`);
                createdSandboxId = job.sandboxId;
            } catch (error) {
                // Existing sandbox no longer accessible, create a new one
                console.log(`Existing E2B sandbox ${job.sandboxId} not accessible, creating new one:`, error);
                const newSandbox = await createSandboxWithRetry("starter");
                createdSandboxId = newSandbox.sandboxId;
            }
        } else {
            // First time, create new E2B sandbox
            try {
                const newSandbox = await createSandboxWithRetry("starter");
                createdSandboxId = newSandbox.sandboxId;
                console.log(`Created new E2B sandbox: ${createdSandboxId}`);
            } catch (error) {
                console.error("Failed to create E2B sandbox:", error);
                throw new Error(`Failed to create E2B sandbox: ${error}`);
            }
        }

        // Ensure sandbox ID is saved to job
        await convex.mutation(api.backgroundJobs.updateSandbox, {
            jobId,
            sandboxId: createdSandboxId
        });

        // IMPORTANT: Only return serializable sandboxId, not the instance object
        return createdSandboxId;
    });

    // 3. Run Council Network with proper error handling and cleanup
    const finalState = await step.run("run-council", async () => {
        try {
            // Create the implementer agent with E2B tools bound to this sandboxId
            const implementerWithTools = createAgent<AgentState>({
                name: "implementer",
                description: "Writes code and executes commands",
                system: "You are a 10x engineer. Implement the plan. Use the available tools to interact with the sandbox.",
                model: openai({
                    model: MODEL,
                    apiKey: process.env.AI_GATEWAY_API_KEY!,
                    baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
                }),
                tools: createCouncilAgentTools(sandboxId),
            });

            // Create the network with agents and initial state
            const network = createNetwork<AgentState>({
                name: "background-agent-network",
                description: "Multi-agent network for background task execution",
                agents: [plannerAgent, implementerWithTools, reviewerAgent],
                defaultState: createState<AgentState>({
                    instruction,
                    files: {},
                }),
            });

            console.log(`Running council for job ${jobId} with sandbox ${sandboxId}`);
            console.log(`Agents: ${[plannerAgent.name, implementerWithTools.name, reviewerAgent.name].join(", ")}`);

            // Execute the network and get the result
            const result = await network.run(instruction);

            // Extract summary from result
            const resultState = result.state as AgentState;
            const summary = resultState?.summary || resultState?.instruction || "Task completed by council";

            return {
                summary: String(summary),
                result
            };
        } catch (error) {
            // SECURITY FIX: Log error and update job status
            console.error(`Council execution failed for job ${jobId}:`, error);

            // Update job status to failed
            await convex.mutation(api.backgroundJobs.updateStatus, {
                jobId,
                status: "failed"
            });

            throw error;
        }
    });

    // 4. Log result and update status
    await step.run("log-completion", async () => {
        try {
            await convex.mutation(api.backgroundJobs.addDecision, {
                jobId,
                step: "run-council",
                agents: [plannerAgent.name, "implementer", reviewerAgent.name],
                verdict: "approved",
                reasoning: finalState.summary || "Completed",
                metadata: { summary: finalState.summary },
            });

            await convex.mutation(api.backgroundJobs.updateStatus, {
                jobId,
                status: "completed"
            });
        } catch (error) {
            console.error(`Failed to log completion for job ${jobId}:`, error);
            throw error;
        }
    });
    
    return { success: true, jobId };
  }
);
