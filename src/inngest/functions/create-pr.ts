import { inngest } from "@/inngest/client";
import { convex } from "@/inngest/convex-client";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { GitHubClient } from "@/lib/github-client";
import { buildPullRequestDescription } from "@/lib/github-pr";

type CreatePullRequestEvent = {
  issueId: Id<"githubIssues">;
  taskId?: Id<"tasks">;
  repoFullName: string;
  branchName: string;
  baseBranch?: string;
  accessToken: string;
  title?: string;
  summary?: string;
  testing?: string[];
  draft?: boolean;
};

export const createPullRequestFunction = inngest.createFunction(
  { id: "create-pr" },
  { event: "10x-swe/create-pr" },
  async ({ event }) => {
    const payload = event.data as CreatePullRequestEvent;

    try {
      const issue = await convex.query(api.issues.get, { issueId: payload.issueId });
      if (!issue) {
        if (payload.taskId) {
          await convex.mutation(api.tasks.failTask, {
            taskId: payload.taskId,
            error: "Issue not found",
          });
        }
        throw new Error("Issue not found");
      }

      const client = new GitHubClient(payload.accessToken);
      const prTitle =
        payload.title ??
        `[zapdev] ${issue.title}${issue.issueNumber ? ` (#${issue.issueNumber})` : ""}`;

      const body = buildPullRequestDescription({
        issueUrl: issue.issueUrl ?? undefined,
        summary: payload.summary ?? issue.triageSummary ?? undefined,
        triageSummary: issue.triageSummary ?? undefined,
        workItems: issue.triageMetadata?.workItems,
        testing: payload.testing,
      });

      const pr = await client.createPullRequest({
        repoFullName: payload.repoFullName,
        title: prTitle,
        head: payload.branchName,
        base: payload.baseBranch ?? "main",
        body,
        draft: payload.draft ?? false,
      });

      await convex.mutation(api.github.savePullRequestRecord, {
        issueId: payload.issueId,
        repoFullName: payload.repoFullName,
        branchName: payload.branchName,
        title: pr.title ?? prTitle,
        description: body,
        prNumber: pr.number,
        prUrl: pr.html_url,
        status: pr.draft ? "DRAFT" : "OPEN",
        metadata: pr,
      });

      if (payload.taskId) {
        await convex.mutation(api.tasks.completeTask, {
          taskId: payload.taskId,
          result: {
            prNumber: pr.number,
            url: pr.html_url,
          },
        });
      }

      await convex.mutation(api.issues.updateStatus, {
        issueId: payload.issueId,
        status: "COMPLETED",
      });

      return { pullRequestUrl: pr.html_url };
    } catch (error) {
      if (payload.taskId) {
        await convex.mutation(api.tasks.failTask, {
          taskId: payload.taskId,
          error: error instanceof Error ? error.message : "Failed to create PR",
          requeue: false,
        });
      }
      throw error;
    }
  }
);
