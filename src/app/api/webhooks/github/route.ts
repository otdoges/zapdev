import { NextRequest, NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/inngest/convex-client";
import { inngest } from "@/inngest/client";
import { verifyGitHubSignature } from "@/lib/github-client";

export const runtime = "nodejs";

const issueActionsToProcess = new Set(["opened", "reopened", "edited"]);

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status });

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return jsonResponse({ error: "Missing GITHUB_WEBHOOK_SECRET" }, 500);
  }

  const signature = request.headers.get("x-hub-signature-256");
  const eventName = request.headers.get("x-github-event");
  const delivery = request.headers.get("x-github-delivery");
  const rawBody = await request.text();

  if (!verifyGitHubSignature(rawBody, signature, secret)) {
    return jsonResponse({ error: "Invalid signature" }, 401);
  }

  if (!eventName) {
    return jsonResponse({ error: "Missing event name" }, 400);
  }

  if (eventName === "ping") {
    return jsonResponse({ ok: true, ping: true });
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  try {
    switch (eventName) {
      case "issues": {
        const issue = payload.issue;
        const repo = payload.repository;
        if (!issue || !repo) {
          return jsonResponse({ error: "Invalid issue payload" }, 400);
        }

        const issueId = (await convex.mutation(api.github.upsertIssueFromWebhook, {
          repoFullName: repo.full_name,
          issueNumber: issue.number,
          githubIssueId: issue.id?.toString(),
          issueUrl: issue.html_url,
          title: issue.title ?? "Untitled issue",
          body: issue.body ?? undefined,
          labels: issue.labels?.map((label: any) => label.name).filter(Boolean),
          status: issue.state === "closed" ? "COMPLETED" : "UNTRIAGED",
          syncedAt: Date.now(),
        })) as Id<"githubIssues">;

        if (issue.state === "closed") {
          await convex.mutation(api.issues.updateStatus, {
            issueId,
            status: "COMPLETED",
          });
        } else if (issueActionsToProcess.has(payload.action)) {
          await convex.mutation(api.tasks.enqueueTask, {
            type: "TRIAGE",
            issueId,
            payload: {
              repoFullName: repo.full_name,
            },
            priority: 50,
          });

          await inngest.send({
            name: "10x-swe/task-queue",
            data: { limit: 1 },
          });
        }

        return jsonResponse({ ok: true });
      }
      case "pull_request": {
        const pr = payload.pull_request;
        const repo = payload.repository;
        if (!pr || !repo) {
          return jsonResponse({ error: "Invalid pull_request payload" }, 400);
        }

        await convex.mutation(api.github.savePullRequestRecord, {
          issueId: undefined,
          repoFullName: repo.full_name,
          branchName: pr.head?.ref ?? "unknown",
          title: pr.title ?? "Pull Request",
          description: pr.body ?? undefined,
          prNumber: pr.number,
          prUrl: pr.html_url,
          status: pr.merged
            ? "MERGED"
            : pr.state === "closed"
            ? "CLOSED"
            : pr.draft
            ? "DRAFT"
            : "OPEN",
          metadata: {
            action: payload.action,
            delivery,
          },
        });

        return jsonResponse({ ok: true });
      }
      default:
        return jsonResponse({ ok: true, ignored: eventName });
    }
  } catch (error) {
    console.error("[github-webhook] handler failed", error);
    return jsonResponse({ error: "Internal error" }, 500);
  }
}
