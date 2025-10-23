import { z } from "zod";
import { 
  openai, 
  createAgent, 
  createTool,
  type Tool,
  type Agent
} from "@inngest/agent-kit";
import {
  PLANNER_AGENT_PROMPT,
  CODER_AGENT_PROMPT,
  TESTER_AGENT_PROMPT,
  REVIEWER_AGENT_PROMPT,
} from "@/prompt";
import { getSandbox } from "./utils";
import type { AgentState } from "./types";

export const createPlannerAgent = () => {
  return createAgent({
    name: "planner",
    description: "Expert software architect that creates implementation plans",
    system: PLANNER_AGENT_PROMPT,
    model: openai({
      model: "google/gemini-2.5-flash-lite",
      apiKey: process.env.AI_GATEWAY_API_KEY!,
      baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
      defaultParameters: {
        temperature: 0.4,
      },
    }),
    lifecycle: {
      onResponse: async ({ result, network }) => {
        const lastMessage = result.output[result.output.length - 1];
        if (lastMessage && lastMessage.type === "text") {
          const content = typeof lastMessage.content === "string" 
            ? lastMessage.content 
            : lastMessage.content.map((c) => c.text).join("");
          
          if (content.includes("<plan>") && network) {
            network.state.data.plan = content;
            network.state.data.currentPhase = "coding";
            
            if (!network.state.data.agentDecisions) {
              network.state.data.agentDecisions = [];
            }
            network.state.data.agentDecisions.push({
              agent: "planner",
              decision: "Plan created",
              reasoning: "Generated implementation plan based on requirements",
              timestamp: Date.now(),
            });
          }
        }
        return result;
      },
    },
  });
};

export const createCoderAgent = (sandboxId: string, frameworkPrompt: string) => {
  const coderTools = [
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

  return createAgent<AgentState>({
    name: "coder",
    description: "Expert developer that implements code based on plans",
    system: `${CODER_AGENT_PROMPT}\n\n${frameworkPrompt}`,
    model: openai({
      model: "moonshotai/kimi-k2-0905",
      apiKey: process.env.AI_GATEWAY_API_KEY!,
      baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
      defaultParameters: {
        temperature: 0.7,
        frequency_penalty: 0.5,
      },
    }),
    tools: coderTools,
    lifecycle: {
      onResponse: async ({ result, network }) => {
        const lastMessage = result.output[result.output.length - 1];
        if (lastMessage && lastMessage.type === "text" && network) {
          const content = typeof lastMessage.content === "string" 
            ? lastMessage.content 
            : lastMessage.content.map((c) => c.text).join("");
          
          if (content.includes("<task_summary>")) {
            network.state.data.summary = content;
            network.state.data.currentPhase = "testing";
            
            if (!network.state.data.agentDecisions) {
              network.state.data.agentDecisions = [];
            }
            network.state.data.agentDecisions.push({
              agent: "coder",
              decision: "Implementation complete",
              reasoning: "All features from plan have been implemented",
              timestamp: Date.now(),
            });
          }
        }
        return result;
      },
    },
  });
};

export const createTesterAgent = (sandboxId: string) => {
  const testerTools = [
    createTool({
      name: "terminal",
      description: "Run lint, build, and test commands",
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
              },
              timeoutMs: command.includes("build") ? 60000 : 30000,
            });
            
            return `Exit code: ${result.exitCode}\nStdout: ${buffers.stdout}\nStderr: ${buffers.stderr}`;
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
      name: "readFiles",
      description: "Read files to analyze implementation",
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

  return createAgent<AgentState>({
    name: "tester",
    description: "Expert QA engineer that tests code and identifies issues",
    system: TESTER_AGENT_PROMPT,
    model: openai({
      model: "google/gemini-2.5-flash-lite",
      apiKey: process.env.AI_GATEWAY_API_KEY!,
      baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
      defaultParameters: {
        temperature: 0.3,
      },
    }),
    tools: testerTools,
    lifecycle: {
      onResponse: async ({ result, network }) => {
        const lastMessage = result.output[result.output.length - 1];
        if (lastMessage && lastMessage.type === "text" && network) {
          const content = typeof lastMessage.content === "string" 
            ? lastMessage.content 
            : lastMessage.content.map((c) => c.text).join("");
          
          if (content.includes("<test_results>")) {
            const passed = content.toLowerCase().includes("pass") && 
                          !content.toLowerCase().includes("needs_fix");
            
            const errors: string[] = [];
            const warnings: string[] = [];
            
            const criticalMatch = content.match(/### Critical([\s\S]*?)(?:###|<\/test_results>)/);
            if (criticalMatch) {
              const criticalSection = criticalMatch[1];
              const errorMatches = criticalSection.match(/- (.+)/g);
              if (errorMatches) {
                errors.push(...errorMatches.map(e => e.replace(/^- /, "")));
              }
            }
            
            const warningsMatch = content.match(/### Warnings([\s\S]*?)(?:###|<\/test_results>)/);
            if (warningsMatch) {
              const warningsSection = warningsMatch[1];
              const warningMatches = warningsSection.match(/- (.+)/g);
              if (warningMatches) {
                warnings.push(...warningMatches.map(w => w.replace(/^- /, "")));
              }
            }
            
            network.state.data.testResults = {
              passed,
              errors,
              warnings,
            };
            
            network.state.data.currentPhase = passed ? "reviewing" : "coding";
            
            if (!network.state.data.agentDecisions) {
              network.state.data.agentDecisions = [];
            }
            network.state.data.agentDecisions.push({
              agent: "tester",
              decision: passed ? "Tests passed" : "Tests failed - needs fixes",
              reasoning: `Found ${errors.length} errors and ${warnings.length} warnings`,
              timestamp: Date.now(),
            });
          }
        }
        return result;
      },
    },
  });
};

export const createReviewerAgent = (sandboxId: string) => {
  const reviewerTools = [
    createTool({
      name: "readFiles",
      description: "Read files to review implementation",
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

  return createAgent<AgentState>({
    name: "reviewer",
    description: "Senior code reviewer that evaluates code quality",
    system: REVIEWER_AGENT_PROMPT,
    model: openai({
      model: "google/gemini-2.5-flash-lite",
      apiKey: process.env.AI_GATEWAY_API_KEY!,
      baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
      defaultParameters: {
        temperature: 0.3,
      },
    }),
    tools: reviewerTools,
    lifecycle: {
      onResponse: async ({ result, network }) => {
        const lastMessage = result.output[result.output.length - 1];
        if (lastMessage && lastMessage.type === "text" && network) {
          const content = typeof lastMessage.content === "string" 
            ? lastMessage.content 
            : lastMessage.content.map((c) => c.text).join("");
          
          if (content.includes("<code_review>")) {
            let quality: "excellent" | "good" | "needs_improvement" = "good";
            if (content.toLowerCase().includes("excellent")) quality = "excellent";
            if (content.toLowerCase().includes("needs_improvement")) quality = "needs_improvement";
            
            const suggestions: string[] = [];
            const criticalIssues: string[] = [];
            
            const suggestionMatch = content.match(/### Suggestions([\s\S]*?)(?:###|##|<\/code_review>)/);
            if (suggestionMatch) {
              const suggestionSection = suggestionMatch[1];
              const suggestionMatches = suggestionSection.match(/- (.+)/g);
              if (suggestionMatches) {
                suggestions.push(...suggestionMatches.map(s => s.replace(/^- /, "")));
              }
            }
            
            const criticalMatch = content.match(/### Critical Issues([\s\S]*?)(?:###|##|<\/code_review>)/);
            if (criticalMatch) {
              const criticalSection = criticalMatch[1];
              const issueMatches = criticalSection.match(/- (.+)/g);
              if (issueMatches) {
                criticalIssues.push(...issueMatches.map(i => i.replace(/^- /, "")));
              }
            }
            
            network.state.data.codeReview = {
              quality,
              suggestions,
              criticalIssues,
            };
            
            const approved = content.toLowerCase().includes("approve") || 
                           (criticalIssues.length === 0 && quality !== "needs_improvement");
            
            network.state.data.currentPhase = approved ? "complete" : "coding";
            
            if (!network.state.data.agentDecisions) {
              network.state.data.agentDecisions = [];
            }
            network.state.data.agentDecisions.push({
              agent: "reviewer",
              decision: approved ? "Code approved" : "Changes requested",
              reasoning: `Quality: ${quality}, Critical issues: ${criticalIssues.length}`,
              timestamp: Date.now(),
            });
          }
        }
        return result;
      },
    },
  });
};

export const createMultiAgentRouter = (
  plannerAgent: Agent<AgentState>,
  coderAgent: Agent<AgentState>,
  testerAgent: Agent<AgentState>,
  reviewerAgent: Agent<AgentState>
) => {
  return async ({ network }: { network: { state: { data: AgentState } } }) => {
    const state = network.state.data;
    const phase = state.currentPhase || "planning";
    const iterations = state.iterations || 0;

    console.log(`[MULTI-AGENT] Current phase: ${phase}, iterations: ${iterations}`);

    if (iterations >= 15) {
      console.log("[MULTI-AGENT] Max iterations reached, completing");
      network.state.data.currentPhase = "complete";
      return;
    }

    network.state.data.iterations = iterations + 1;

    switch (phase) {
      case "planning":
        if (!state.plan) {
          console.log("[MULTI-AGENT] Routing to planner agent");
          return plannerAgent;
        }
        network.state.data.currentPhase = "coding";
        return coderAgent;

      case "coding":
        if (!state.summary && state.testResults?.passed === false) {
          console.log("[MULTI-AGENT] Routing to coder agent for fixes");
          return coderAgent;
        }
        if (state.codeReview?.criticalIssues && state.codeReview.criticalIssues.length > 0) {
          console.log("[MULTI-AGENT] Routing to coder agent to address critical issues");
          return coderAgent;
        }
        console.log("[MULTI-AGENT] Routing to coder agent for implementation");
        return coderAgent;

      case "testing":
        if (!state.testResults) {
          console.log("[MULTI-AGENT] Routing to tester agent");
          return testerAgent;
        }
        if (state.testResults.passed === false) {
          console.log("[MULTI-AGENT] Tests failed, routing back to coder");
          network.state.data.currentPhase = "coding";
          return coderAgent;
        }
        network.state.data.currentPhase = "reviewing";
        return reviewerAgent;

      case "reviewing":
        if (!state.codeReview) {
          console.log("[MULTI-AGENT] Routing to reviewer agent");
          return reviewerAgent;
        }
        if (state.codeReview.criticalIssues.length > 0) {
          console.log("[MULTI-AGENT] Critical issues found, routing back to coder");
          network.state.data.currentPhase = "coding";
          return coderAgent;
        }
        console.log("[MULTI-AGENT] Review complete, finishing");
        network.state.data.currentPhase = "complete";
        return;

      case "complete":
        console.log("[MULTI-AGENT] Process complete");
        return;

      default:
        console.log("[MULTI-AGENT] Unknown phase, routing to planner");
        return plannerAgent;
    }
  };
};
