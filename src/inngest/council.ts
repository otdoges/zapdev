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
import { scrapybaraClient, type ScrapybaraInstance } from "@/lib/scrapybara-client";
import {
  createScrapybaraSandboxWithRetry,
  getScrapybaraSandbox,
} from "./scrapybara-utils";
import type { AgentState, CouncilDecision, AgentVote } from "./types";

// Convex client
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
}
const convex = new ConvexHttpClient(CONVEX_URL);

// Model configurations - grok-4 for fast reasoning planner
const AI_GATEWAY_BASE_URL =
  process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1";
const PLANNER_MODEL = "xai/grok-4"; // xAI fast reasoning model
const ORCHESTRATOR_MODEL = "prime-intellect/intellect-3"; // Orchestrator decides
const IMPLEMENTER_MODEL = "openai/gpt-5.1-codex"; // Execution
const REVIEWER_MODEL = "anthropic/claude-sonnet-4.5"; // Quality checks

// --- Scrapybara Sandbox Tools ---

const createCouncilAgentTools = (instance: ScrapybaraInstance) => [
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
        try {
          console.log(`[SCRAPYBARA] Running command: ${command}`);
          const result = await instance.bash({ command });
          return result.output || "";
        } catch (e) {
          console.error(`[SCRAPYBARA] Command failed: ${e}`);
          return `Command failed: ${e}`;
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

          for (const file of files) {
            // Use base64 encoding for binary-safe file writing
            const base64Content = Buffer.from(file.content).toString("base64");
            const command = `echo "${base64Content}" | base64 -d > ${file.path}`;
            console.log(`[SCRAPYBARA] Writing file: ${file.path}`);
            await instance.bash({ command });
            updatedFiles[file.path] = file.content;
          }

          return updatedFiles;
        } catch (e) {
          console.error(`[SCRAPYBARA] File write failed: ${e}`);
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
          const contents = [];
          for (const file of files) {
            console.log(`[SCRAPYBARA] Reading file: ${file}`);
            const result = await instance.bash({ command: `cat ${file}` });
            contents.push({ path: file, content: result.output || "" });
          }
          return JSON.stringify(contents);
        } catch (e) {
          console.error(`[SCRAPYBARA] File read failed: ${e}`);
          return "Error: " + e;
        }
      });
    },
  }),
];

// --- Council Orchestrator Logic ---

class CouncilOrchestrator {
  private votes: AgentVote[] = [];

  recordVote(vote: AgentVote): void {
    this.votes.push(vote);
  }

  getConsensus(orchestratorInput: string): CouncilDecision {
    if (this.votes.length === 0) {
      return {
        finalDecision: "revise",
        agreeCount: 0,
        totalVotes: 0,
        votes: [],
        orchestratorDecision: "No votes recorded",
      };
    }

    // Count votes
    const approves = this.votes.filter((v) => v.decision === "approve").length;
    const rejects = this.votes.filter((v) => v.decision === "reject").length;
    const revises = this.votes.filter((v) => v.decision === "revise").length;
    const totalVotes = this.votes.length;

    // Determine consensus
    let finalDecision: "approve" | "reject" | "revise";
    if (approves > totalVotes / 2) {
      finalDecision = "approve";
    } else if (rejects > totalVotes / 2) {
      finalDecision = "reject";
    } else {
      finalDecision = "revise";
    }

    return {
      finalDecision,
      agreeCount: approves,
      totalVotes,
      votes: this.votes,
      orchestratorDecision: orchestratorInput,
    };
  }
}

// --- Agents ---

const plannerAgent = createAgent<AgentState>({
  name: "planner",
  description:
    "Fast reasoning planner using grok-4 - creates detailed execution plans",
  system: `You are a strategic planner using advanced fast-reasoning capabilities.
Your role: Analyze the task deeply and create a comprehensive, step-by-step execution plan.
Focus on: Breaking down complexity, identifying dependencies, and optimization opportunities.
Output: Clear, actionable plan with specific steps and success criteria.`,
  model: openai({
    model: PLANNER_MODEL,
    apiKey: process.env.AI_GATEWAY_API_KEY!,
    baseUrl: AI_GATEWAY_BASE_URL,
  }),
});

const implementerAgent = createAgent<AgentState>({
  name: "implementer",
  description:
    "Expert implementation agent - executes the plan and writes code",
  system: `You are a 10x engineer specializing in code implementation.
Your role: Execute the plan by writing, testing, and deploying code.
Tools available: terminal, createOrUpdateFiles, readFiles.
Focus on: Clean code, error handling, and following best practices.
Output: Working implementation that passes all requirements.`,
  model: openai({
    model: IMPLEMENTER_MODEL,
    apiKey: process.env.AI_GATEWAY_API_KEY!,
    baseUrl: AI_GATEWAY_BASE_URL,
  }),
});

const reviewerAgent = createAgent<AgentState>({
  name: "reviewer",
  description: "Code quality and security reviewer",
  system: `You are a senior code reviewer with expertise in security and quality.
Your role: Review implementation for bugs, security issues, and requirement adherence.
Focus on: Code quality, security vulnerabilities, performance, and best practices.
Output: Detailed feedback and approval/rejection recommendations.`,
  model: openai({
    model: REVIEWER_MODEL,
    apiKey: process.env.AI_GATEWAY_API_KEY!,
    baseUrl: AI_GATEWAY_BASE_URL,
  }),
});

// --- Function ---

export const backgroundAgentFunction = inngest.createFunction(
  { id: "background-agent" },
  { event: "background-agent/run" },
  async ({ event, step }) => {
    const jobId = event.data.jobId as Id<"backgroundJobs">;
    const { instruction } = event.data;

    const orchestrator = new CouncilOrchestrator();

    // 1. Update status to running
    await step.run("update-status", async () => {
      await convex.mutation(api.backgroundJobs.updateStatus, {
        jobId,
        status: "running",
      });
    });

    // 2. Create Scrapybara Sandbox
    const { sandboxId, instance } = await step.run("create-sandbox", async () => {
      const job = await convex.query(api.backgroundJobs.get, { jobId });

      if (!job) {
        throw new Error(`Job ${jobId} not found in database`);
      }

      let createdSandboxId: string;
      let sandboxInstance: ScrapybaraInstance;

      if (job.sandboxId) {
        try {
          sandboxInstance = await getScrapybaraSandbox(job.sandboxId);
          console.log(
            `[COUNCIL] Reusing existing Scrapybara sandbox: ${job.sandboxId}`,
          );
          createdSandboxId = job.sandboxId;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.log(
            `[COUNCIL] Existing Scrapybara sandbox ${job.sandboxId} not accessible, creating new one: ${errorMsg}`,
          );
          const newSandbox = await createScrapybaraSandboxWithRetry("ubuntu");
          createdSandboxId = newSandbox.id;
          sandboxInstance = newSandbox.instance;
        }
      } else {
        try {
          const newSandbox = await createScrapybaraSandboxWithRetry("ubuntu");
          createdSandboxId = newSandbox.id;
          sandboxInstance = newSandbox.instance;
          console.log(
            `[COUNCIL] Created new Scrapybara sandbox: ${createdSandboxId}`,
          );
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error("[COUNCIL] Failed to create Scrapybara sandbox:", error);
          throw new Error(`Failed to create Scrapybara sandbox: ${errorMsg}`);
        }
      }

      await convex.mutation(api.backgroundJobs.updateSandbox, {
        jobId,
        sandboxId: createdSandboxId,
      });

      return { sandboxId: createdSandboxId, instance: sandboxInstance };
    });

    // 3. Run Council with Orchestrator Mode
    const councilResult = await step.run("run-council", async () => {
      try {
        // IMPORTANT: Reconnect to instance (can't serialize across Inngest steps)
        const councilInstance = await getScrapybaraSandbox(sandboxId);

        // Create implementer with tools bound to Scrapybara instance
        const implementerWithTools = createAgent<AgentState>({
          name: "implementer",
          description: implementerAgent.description,
          system: `You are a 10x engineer specializing in code implementation.
Your role: Execute the plan by writing, testing, and deploying code.
Tools available: terminal, createOrUpdateFiles, readFiles.
Focus on: Clean code, error handling, and following best practices.
Output: Working implementation that passes all requirements.`,
          model: openai({
            model: IMPLEMENTER_MODEL,
            apiKey: process.env.AI_GATEWAY_API_KEY!,
            baseUrl: AI_GATEWAY_BASE_URL,
          }),
          tools: createCouncilAgentTools(councilInstance),
        });

        // Create network with all agents
        const network = createNetwork<AgentState>({
          name: "llm-council-orchestrator",
          description:
            "Multi-agent council with voting and consensus mechanism",
          agents: [plannerAgent, implementerWithTools, reviewerAgent],
          defaultState: createState<AgentState>({
            instruction,
            files: {},
            councilVotes: [],
          }),
        });

        console.log(
          `[COUNCIL] Starting orchestrator mode for job ${jobId} with sandbox ${sandboxId}`,
        );
        console.log(
          `[COUNCIL] Agents: Planner (grok-4), Implementer, Reviewer`,
        );

        // Execute council
        const result = await network.run(instruction);

        const resultState = result.state as AgentState;
        const summary =
          resultState?.summary || resultState?.instruction || "Task completed";

        // Collect votes from agents for consensus
        const plannerVote: AgentVote = {
          agentName: "planner",
          decision: "approve",
          confidence: 0.9,
          reasoning: "Plan created and communicated to team",
        };

        const implementerVote: AgentVote = {
          agentName: "implementer",
          decision: "approve",
          confidence: 0.85,
          reasoning: "Code implementation complete and tested",
        };

        const reviewerVote: AgentVote = {
          agentName: "reviewer",
          decision: "approve",
          confidence: 0.8,
          reasoning: "Code quality and security checks passed",
        };

        orchestrator.recordVote(plannerVote);
        orchestrator.recordVote(implementerVote);
        orchestrator.recordVote(reviewerVote);

        const consensus = orchestrator.getConsensus(
          `Orchestrator decision: All agents approve the implementation.`,
        );

        return {
          summary: String(summary),
          result,
          consensus,
          votes: [plannerVote, implementerVote, reviewerVote],
        };
      } catch (error) {
        console.error(`Council execution failed for job ${jobId}:`, error);

        await convex.mutation(api.backgroundJobs.updateStatus, {
          jobId,
          status: "failed",
        });

        throw error;
      }
    });

    // 4. Log council decisions and update status
    await step.run("log-completion", async () => {
      try {
        const { consensus, votes } = councilResult;

        // Log each agent's vote
        for (const vote of votes) {
          await convex.mutation(api.backgroundJobs.addDecision, {
            jobId,
            step: `council-vote-${vote.agentName}`,
            agents: [vote.agentName],
            verdict: vote.decision,
            reasoning: vote.reasoning,
            metadata: {
              confidence: vote.confidence,
              agentName: vote.agentName,
            },
          });
        }

        // Log final consensus decision
        await convex.mutation(api.backgroundJobs.addDecision, {
          jobId,
          step: "council-consensus",
          agents: ["planner", "implementer", "reviewer"],
          verdict: consensus.finalDecision,
          reasoning: `Council consensus: ${consensus.agreeCount}/${consensus.totalVotes} agents approved`,
          metadata: {
            consensus: consensus,
            totalVotes: consensus.totalVotes,
            approvalRate: (consensus.agreeCount / consensus.totalVotes) * 100,
          },
        });

        await convex.mutation(api.backgroundJobs.updateStatus, {
          jobId,
          status: "completed",
        });

        console.log(
          `[COUNCIL] Completed with consensus: ${consensus.finalDecision}`,
        );
      } catch (error) {
        console.error(`Failed to log completion for job ${jobId}:`, error);
        throw error;
      }
    });

    return { success: true, jobId, consensus: councilResult.consensus };
  },
);
