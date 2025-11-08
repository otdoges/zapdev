import { Sandbox } from "@e2b/code-interpreter";
import { inngest } from "@/inngest/client";
import { convex } from "@/inngest/convex-client";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { SANDBOX_TIMEOUT } from "@/inngest/types";
import { buildAuthenticatedGitUrl } from "@/lib/github-client";
import { generateBranchName } from "@/lib/github-pr";

type AutonomousAgentEvent = {
  issueId: Id<"githubIssues">;
  taskId: Id<"tasks">;
  repoFullName: string;
  accessToken?: string;
  baseBranch?: string;
  branchName?: string;
  instructions?: string;
};

const runCommand = async (sandbox: Sandbox, command: string) => {
  const buffers = { stdout: "", stderr: "" };
  const result = await sandbox.commands.run(command, {
    onStdout: (data: string) => (buffers.stdout += data),
    onStderr: (data: string) => (buffers.stderr += data),
  });

  return {
    ...result,
    stdout: buffers.stdout.trim(),
    stderr: buffers.stderr.trim(),
  };
};

export const autonomousAgentFunction = inngest.createFunction(
  { id: "autonomous-agent" },
  { event: "10x-swe/autonomous-agent" },
  async ({ event, step }) => {
    const payload = event.data as AutonomousAgentEvent;

    try {
      const [issue] = await Promise.all([
        step.run("load-issue", async () => {
          return await convex.query(api.issues.get, { issueId: payload.issueId });
        }),
        step.run("mark-issue-in-progress", async () => {
          return await convex.mutation(api.issues.updateStatus, {
            issueId: payload.issueId,
            status: "IN_PROGRESS",
          });
        }).catch(() => null),
      ]);

      if (!issue) {
        await convex.mutation(api.tasks.failTask, {
          taskId: payload.taskId,
          error: "Issue not found",
        });
        throw new Error("Issue not found");
      }

      const sandbox = await step.run("create-sandbox", async () => {
        const instance = await Sandbox.create("zapdev", {
          apiKey: process.env.E2B_API_KEY,
          timeoutMs: SANDBOX_TIMEOUT,
        });
        await instance.setTimeout(SANDBOX_TIMEOUT);
        return instance;
      });

      let sandboxKilled = false;
      try {
        const branchName =
          payload.branchName ?? generateBranchName(issue.issueNumber ?? Date.now(), issue.title);
        const resolvedToken = payload.accessToken ?? process.env.GITHUB_AUTOMATION_TOKEN;
        const cloneUrl = resolvedToken
          ? buildAuthenticatedGitUrl(payload.repoFullName, resolvedToken)
          : `https://github.com/${payload.repoFullName}.git`;

        await step.run("clone-repository", async () => {
          const result = await runCommand(
            sandbox,
            `GIT_TERMINAL_PROMPT=0 git clone --depth=1 ${cloneUrl} workspace`
          );

          if (result.exitCode !== 0) {
            throw new Error(`Clone failed: ${result.stderr || result.stdout}`);
          }
          return result.stdout;
        });

        await step.run("checkout-branch", async () => {
          const result = await runCommand(
            sandbox,
            `cd workspace && git checkout -b ${branchName}`
          );
          if (result.exitCode !== 0) {
            throw new Error(`Branch creation failed: ${result.stderr || result.stdout}`);
          }
          return result.stdout;
        });

        await step.run("install-dependencies", async () => {
          const result = await runCommand(
            sandbox,
            `cd workspace && if [ -f bun.lock ] || [ -f package.json ]; then bun install; fi`
          );
          return result.stdout || "Dependencies installed (if any)";
        });

        const repoStatus = await step.run("git-status", async () => {
          return await runCommand(sandbox, `cd workspace && git status -sb`);
        });

        await convex.mutation(api.tasks.completeTask, {
          taskId: payload.taskId,
          result: {
            branchName,
            status: repoStatus.stdout,
          },
        });

        if (resolvedToken) {
          await convex.mutation(api.tasks.enqueueTask, {
            type: "PR_CREATION",
            issueId: payload.issueId,
            payload: {
              repoFullName: payload.repoFullName,
              branchName,
              baseBranch: payload.baseBranch ?? "main",
              accessToken: resolvedToken,
            },
            priority: 40,
          });

          await inngest.send({
            name: "10x-swe/task-queue",
            data: { limit: 1 },
          });
        }

        return { branchName };
      } finally {
        if (!sandboxKilled) {
          try {
            await Sandbox.kill(sandbox.sandboxId);
            sandboxKilled = true;
          } catch (killError) {
            console.warn("[autonomous-agent] Failed to kill sandbox", killError);
          }
        }
      }
    } catch (error) {
      await convex.mutation(api.tasks.failTask, {
        taskId: event.data.taskId,
        error: error instanceof Error ? error.message : "Autonomous agent failure",
        requeue: true,
      });
      throw error;
    }
  }
);
