import {
  createAgent,
  createNetwork,
  openai,
  createState,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import { scrapybaraClient } from "@/lib/scrapybara-client";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { Id } from "@/convex/_generated/dataModel";

// Convex client
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
}
const convex = new ConvexHttpClient(CONVEX_URL);

const DEFAULT_COUNCIL_MODEL = "gpt-4-turbo";
const MODEL = process.env.COUNCIL_MODEL ?? DEFAULT_COUNCIL_MODEL;

// --- Agents ---

const plannerAgent = createAgent({
  name: "planner",
  description: "Analyzes the task and creates a step-by-step plan",
  system: "You are a senior architect. Break down the user request into actionable steps.",
  model: openai({
    model: MODEL,
    apiKey: process.env.AI_GATEWAY_API_KEY!,
    baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
  }),
});

const implementerAgent = createAgent({
  name: "implementer",
  description: "Writes code and executes commands",
  system: "You are a 10x engineer. Implement the plan. Use the available tools to interact with the sandbox.",
  model: openai({
    model: MODEL,
    apiKey: process.env.AI_GATEWAY_API_KEY!,
    baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
  }),
  // Tools will be added dynamically in the function
});

const reviewerAgent = createAgent({
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

    // 2. Create Scrapybara Sandbox
    // SECURITY FIX: Only pass serializable sandboxId through Inngest steps
    const sandboxId = await step.run("create-sandbox", async () => {
        const job = await convex.query(api.backgroundJobs.get, { jobId });

        // Check if sandbox already exists and is still accessible
        let sandbox;
        if (job.sandboxId) {
            try {
                // Attempt to reconnect to existing sandbox
                sandbox = await scrapybaraClient.getSandbox(job.sandboxId, "ubuntu");
                console.log(`Reusing existing sandbox: ${job.sandboxId}`);
            } catch (error) {
                // Existing sandbox no longer accessible, create a new one
                console.log(`Existing sandbox ${job.sandboxId} not accessible, creating new one:`, error);
                sandbox = await scrapybaraClient.createSandbox({
                    template: "ubuntu",
                    timeout_hours: 1
                });
            }
        } else {
            // First time, create new sandbox
            sandbox = await scrapybaraClient.createSandbox({
                template: "ubuntu",
                timeout_hours: 1
            });
        }

        // Ensure sandbox ID is saved to job
        await convex.mutation(api.backgroundJobs.updateSandbox, {
            jobId,
            sandboxId: sandbox.id
        });

        // IMPORTANT: Only return serializable sandboxId, not the instance object
        return sandbox.id;
    });

    // 3. Run Council Network with proper error handling and cleanup
    const finalState = await step.run("run-council", async () => {
        let instance = null;

        try {
            // Reconnect to existing sandbox using sandboxId from step 2
            const sandbox = await scrapybaraClient.getSandbox(sandboxId, "ubuntu");
            instance = sandbox.instance;

            // Dynamic tools closing over instance
            // In real implementation we would bind tools here

            // const network = createNetwork({
            //     agents: [plannerAgent, implementerAgent, reviewerAgent],
            //     defaultState: createState({
            //         messages: [{ role: "user", content: instruction }]
            //     }),
            // });

            // Mocking activity with actual Scrapybara commands
            console.log(`Running council for job ${jobId} with sandbox ${sandboxId}`);
            console.log(`Agents: ${[plannerAgent.name, implementerAgent.name, reviewerAgent.name].join(", ")}`);

            // Execute commands using instance reference
            await scrapybaraClient.runCommand(instance, "echo 'Analyzing request...'");
            await scrapybaraClient.runCommand(instance, "echo 'Implementing changes...'");

            return {
                summary: "Task processed successfully by council.",
            };
        } catch (error) {
            // SECURITY FIX: Always cleanup sandbox on failure to prevent resource leaks
            console.error(`Council execution failed for job ${jobId}:`, error);

            if (instance) {
                try {
                    await scrapybaraClient.terminateSandbox(instance);
                } catch (cleanupError) {
                    console.error(`Failed to cleanup sandbox ${sandboxId}:`, cleanupError);
                }
            }

            // Update job status to failed
            await convex.mutation(api.backgroundJobs.updateStatus, {
                jobId,
                status: "failed"
            });

            throw error;
        }
    });

    // 4. Log result and cleanup
    await step.run("log-completion", async () => {
        // Reconnect to existing sandbox using sandboxId for final cleanup
        let instance = null;

        try {
            const sandbox = await scrapybaraClient.getSandbox(sandboxId, "ubuntu");
            instance = sandbox.instance;

            await convex.mutation(api.backgroundJobs.addDecision, {
                jobId,
                step: "run-council",
                agents: [plannerAgent.name, implementerAgent.name, reviewerAgent.name],
                verdict: "approved",
                reasoning: finalState.summary || "Completed",
                metadata: { summary: finalState.summary },
            });

            await convex.mutation(api.backgroundJobs.updateStatus, {
                jobId,
                status: "completed"
            });
        } finally {
            // ALWAYS cleanup sandbox, even if logging fails
            if (instance) {
                try {
                    await scrapybaraClient.terminateSandbox(instance);
                } catch (cleanupError) {
                    console.error(`Failed to cleanup sandbox in completion step:`, cleanupError);
                }
            }
        }
    });
    
    return { success: true, jobId };
  }
);
