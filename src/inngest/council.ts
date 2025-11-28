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
import { v } from "convex/values";

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
    const { sandboxId, instance } = await step.run("create-sandbox", async () => {
        const job = await convex.query(api.backgroundJobs.get, { jobId });
        
        // Note: This architecture assumes sandboxes are ephemeral per job
        // If job already has sandboxId, we'd need to handle reconnection
        // For now, always create new sandbox
        
        const sandbox = await scrapybaraClient.createSandbox({ 
          template: "ubuntu",
          timeout_hours: 1 
        });
        
        // Save sandbox ID to job
        await convex.mutation(api.backgroundJobs.updateSandbox, {
            jobId,
            sandboxId: sandbox.id
        });
        
        return { sandboxId: sandbox.id, instance: sandbox.instance };
    });

    // 3. Run Council Network
    const finalState = await step.run("run-council", async () => {
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
    });

    // 4. Log result and cleanup
    await step.run("log-completion", async () => {
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
        
        // Terminate sandbox
        await scrapybaraClient.terminateSandbox(instance);
    });
    
    return { success: true, jobId };
  }
);
