"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";

import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type IssueDetailProps = {
  issueId: Id<"githubIssues"> | null;
  repoFullName: string | null;
};

const badgeStyles: Record<string, string> = {
  CRITICAL: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-amber-500 text-white",
  LOW: "bg-muted text-muted-foreground",
};

const statusStyles: Record<string, string> = {
  UNTRIAGED: "bg-muted text-muted-foreground",
  TRIAGED: "bg-blue-500/20 text-blue-600 dark:text-blue-300",
  ASSIGNED: "bg-purple-500/20 text-purple-600 dark:text-purple-300",
  IN_PROGRESS: "bg-amber-500/20 text-amber-600 dark:text-amber-300",
  COMPLETED: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300",
};

export function IssueDetail({ issueId, repoFullName }: IssueDetailProps) {
  const issue = useQuery(api.issues.get, issueId ? { issueId } : "skip");
  const enqueueTask = useMutation(api.tasks.enqueueTask);
  const [isAssigning, startTransition] = useTransition();

  const handleAssign = () => {
    if (!issueId || !repoFullName) {
      return;
    }

    startTransition(async () => {
      try {
        await enqueueTask({
          type: "CODEGEN",
          issueId,
          payload: {
            repoFullName,
          },
          priority: issue?.priority === "CRITICAL" ? 90 : 60,
        });

        await fetch("/api/10x-swe/task-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 1 }),
        });
      } catch (error) {
        console.error("[issue-detail] failed to queue agent", error);
      }
    });
  };

  if (!issueId) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Select a triaged issue to inspect prioritization details.
      </Card>
    );
  }

  if (!issue) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Loading issue details…
      </Card>
    );
  }

  const workItems: string[] = issue.triageMetadata?.workItems ?? [];

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{issue.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            #{issue.issueNumber} • {issue.repoFullName}
          </p>
        </div>
        <Badge className={cn(statusStyles[issue.status ?? "UNTRIAGED"] ?? "", "uppercase")}>
          {(issue.status ?? "UNTRIAGED").toLowerCase()}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {issue.priority && (
          <Badge className={badgeStyles[issue.priority] ?? ""}>
            Priority: {issue.priority.toLowerCase()}
          </Badge>
        )}
        {issue.category && (
          <Badge variant="secondary">Category: {issue.category.toLowerCase()}</Badge>
        )}
        {issue.complexity && (
          <Badge variant="outline">Complexity: {issue.complexity}</Badge>
        )}
        {typeof issue.estimateHours === "number" && (
          <Badge variant="outline">Estimate: {issue.estimateHours}h</Badge>
        )}
      </div>

      {issue.triageSummary && (
        <div className="bg-muted/40 rounded-lg p-3 text-sm">
          <p className="font-medium mb-1">Triage Summary</p>
          <p className="text-muted-foreground whitespace-pre-line">{issue.triageSummary}</p>
        </div>
      )}

      {workItems.length > 0 && (
        <div>
          <p className="font-medium text-sm mb-2">Work Items</p>
          <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1">
            {workItems.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {issue.body && (
        <div>
          <p className="font-medium text-sm mb-2">Issue Body</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap border rounded-lg p-3 bg-background/80">
            {issue.body}
          </p>
        </div>
      )}

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleAssign} disabled={!repoFullName || isAssigning}>
          {isAssigning ? "Queueing Agent…" : "Assign to 10x SWE Agent"}
        </Button>
        {issue.issueUrl && (
          <Button asChild variant="outline">
            <Link href={issue.issueUrl} target="_blank" rel="noreferrer">
              View on GitHub
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
