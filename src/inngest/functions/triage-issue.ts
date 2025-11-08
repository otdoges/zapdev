import { createAgent, openai } from "@inngest/agent-kit";
import { inngest } from "@/inngest/client";
import { convex } from "@/inngest/convex-client";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { ISSUE_TRIAGE_PROMPT } from "@/prompt";
import { sanitizeTextForDatabase } from "@/lib/utils";
import { lastAssistantTextMessageContent } from "@/inngest/utils";

type IssueTriageEvent = {
  issueId: Id<"githubIssues">;
  taskId?: Id<"tasks">;
};

const PRIORITY_MAP = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
} as const;

const CATEGORY_MAP = {
  bug: "BUG",
  feature: "FEATURE",
  enhancement: "ENHANCEMENT",
  chore: "CHORE",
  documentation: "DOCUMENTATION",
} as const;

const COMPLEXITY_MAP = {
  xs: "XS",
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
} as const;

const priorityToScore = (priority: keyof typeof PRIORITY_MAP | "medium") => {
  switch (priority) {
    case "critical":
      return 100;
    case "high":
      return 75;
    case "medium":
      return 50;
    case "low":
    default:
      return 25;
  }
};

const parseJson = (value: string) => {
  try {
    const jsonMatch = value.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const triageIssueFunction = inngest.createFunction(
  { id: "triage-issue" },
  { event: "10x-swe/triage-issue" },
  async ({ event, step }) => {
    const payload = event.data as IssueTriageEvent;

    try {
      const issue = await step.run("load-issue", async () => {
        return await convex.query(api.issues.get, { issueId: payload.issueId });
      });

      if (!issue) {
        if (payload.taskId) {
          await convex.mutation(api.tasks.failTask, {
            taskId: payload.taskId,
            error: "Issue not found",
          });
        }
        throw new Error("Issue not found");
      }

      const issueContent = [
        `Title: ${issue.title}`,
        issue.body ? `Body:\n${issue.body}` : "",
        issue.labels?.length ? `Labels: ${issue.labels.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const agent = createAgent({
        name: "issue-triage",
        description: "Analyzes GitHub issues and produces triage metadata",
        system: ISSUE_TRIAGE_PROMPT,
        model: openai({
          model: "anthropic/claude-haiku-4.5",
          apiKey: process.env.AI_GATEWAY_API_KEY!,
          baseUrl: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
          defaultParameters: {
            temperature: 0.2,
          },
        }),
      });

      const agentResult = await agent.run(issueContent);
      const agentOutput = lastAssistantTextMessageContent(agentResult);
      if (!agentOutput) {
        throw new Error("Model returned empty response");
      }

      const parsed = parseJson(agentOutput);
      if (!parsed) {
        throw new Error("Failed to parse triage output");
      }

      const priorityKey = typeof parsed.priority === "string"
        ? (parsed.priority.toLowerCase() as keyof typeof PRIORITY_MAP)
        : "medium";

      const categoryKey = typeof parsed.category === "string"
        ? (parsed.category.toLowerCase() as keyof typeof CATEGORY_MAP)
        : undefined;

      const complexityKey = typeof parsed.complexity === "string"
        ? (parsed.complexity.toLowerCase() as keyof typeof COMPLEXITY_MAP)
        : undefined;

      const estimateHoursRaw =
        typeof parsed.estimate_hours === "number"
          ? parsed.estimate_hours
          : Number(parsed.estimate_hours);
      const estimateHours = Number.isFinite(estimateHoursRaw)
        ? Math.max(1, Math.round(estimateHoursRaw))
        : undefined;

      const summary = typeof parsed.summary === "string" ? parsed.summary : undefined;
      const workItems = Array.isArray(parsed.work_items)
        ? parsed.work_items.filter((item): item is string => typeof item === "string" && item.length > 0)
        : [];

      const triageResult = await step.run("update-issue", async () => {
        return await convex.mutation(api.issues.updateTriage, {
          issueId: payload.issueId,
          priority: PRIORITY_MAP[priorityKey] ?? "MEDIUM",
          category: categoryKey ? CATEGORY_MAP[categoryKey] : issue.category,
          complexity: complexityKey ? COMPLEXITY_MAP[complexityKey] : issue.complexity,
          estimateHours,
          triageSummary: summary ? sanitizeTextForDatabase(summary) : issue.triageSummary,
          triageMetadata: {
            workItems,
            raw: parsed,
          },
          status: "TRIAGED",
        });
      });

      if (payload.taskId) {
        await convex.mutation(api.tasks.completeTask, {
          taskId: payload.taskId,
          result: {
            priority: triageResult.priority,
            estimateHours: triageResult.estimateHours,
          },
        });
      }

      if (workItems.length) {
        await convex.mutation(api.tasks.enqueueTask, {
          type: "CODEGEN",
          issueId: payload.issueId,
          payload: {
            repoFullName: issue.repoFullName,
            workItems,
            summary: triageResult.triageSummary,
          },
          priority: priorityToScore(priorityKey),
        });

        await inngest.send({
          name: "10x-swe/task-queue",
          data: { limit: 1 },
        });
      }

      return {
        issueId: payload.issueId,
        priority: triageResult.priority,
      };
    } catch (error) {
      if (payload.taskId) {
        await convex.mutation(api.tasks.failTask, {
          taskId: payload.taskId,
          error: error instanceof Error ? error.message : "Unknown triage error",
          requeue: true,
        });
      }
      throw error;
    }
  }
);
