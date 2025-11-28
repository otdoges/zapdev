import {
  createAgent,
  createNetwork,
  openai,
  createState,
  type AgentState,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import { cuaClient } from "@/lib/cua-client";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { Id } from "@/convex/_generated/dataModel";

// Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const MODEL = "openai/gpt-5.1-codex"; // Use powerful model for council

// --- Agents ---

const plannerAgent = createAgent({
  name: "planner",
  description: "Analyzes the task and creates a step-by-step plan",
  system: "You are a senior architect. Break down the user request into actionable steps.",
  model: openai({ model: MODEL }),
});

const implementerAgent = createAgent({
  name: "implementer",
  description: "Writes code and executes commands",
  system: "You are a 10x engineer. Implement the plan. Use the available tools to interact with the sandbox.",
  model: openai({ model: MODEL }),
  // Tools will be added dynamically in the function
});

const reviewerAgent = createAgent({
  name: "reviewer",
  description: "Reviews the implementation and ensures quality",
  system: "You are a strict code reviewer. Check for bugs, security issues, and adherence to requirements.",
  model: openai({ model: MODEL }),
});

// --- Function ---

export const backgroundAgentFunction = inngest.createFunction(
  { id: "background-agent" },
  { event: "background-agent/run" },
  async ({ event, step }) => {
    const { jobId, instruction } = event.data;
    
    // 1. Update status to running
    await step.run("update-status", async () => {
        await convex.mutation(api.backgroundJobs.updateStatus, { 
            jobId: jobId as Id<"backgroundJobs">, 
            status: "running" 
        });
    });

    // 2. Create Sandbox (if not exists)
    const sandboxId = await step.run("create-sandbox", async () => {
        const job = await convex.query(api.backgroundJobs.get, { jobId: jobId as Id<"backgroundJobs"> });
        if (job?.sandboxId) return job.sandboxId;
        
        const sandbox = await cuaClient.createSandbox({ template: "standard" });
        // Save sandbox ID to job
        await convex.mutation(api.backgroundJobs.updateSandbox, {
            jobId: jobId as Id<"backgroundJobs">,
            sandboxId: sandbox.id
        });
        return sandbox.id;
    });

    // 3. Run Council Network
    const finalState = await step.run("run-council", async () => {
        // Dynamic tools closing over sandboxId
        // In real implementation we would bind tools here
        
        const network = createNetwork({
            agents: [plannerAgent, implementerAgent, reviewerAgent],
            defaultState: createState({
                messages: [{ role: "user", content: instruction }]
            }),
        });

        // Mocking activity since we don't have real execution environment connected yet
        console.log(`Running council for job ${jobId} with sandbox ${sandboxId}`);
        
        // Simulate agents thinking
        await cuaClient.runCommand(sandboxId, "echo 'Analyzing request...'");
        await new Promise(resolve => setTimeout(resolve, 1000));
        await cuaClient.runCommand(sandboxId, "echo 'Implementing changes...'");
        
        return {
            summary: "Task processed successfully by council (mock).",
        };
    });

    // 4. Log result
    await step.run("log-completion", async () => {
        await convex.mutation(api.backgroundJobs.addDecision, {
            jobId: jobId as Id<"backgroundJobs">,
            decision: finalState.summary || "Completed"
        });
        
         await convex.mutation(api.backgroundJobs.updateStatus, { 
            jobId: jobId as Id<"backgroundJobs">, 
            status: "completed" 
        });
    });
    
    return { success: true, jobId };
  }
);
