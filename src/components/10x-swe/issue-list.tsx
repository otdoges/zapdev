"use client";

import { useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type IssueListProps = {
  repoFullName: string | null;
  selectedIssueId: Id<"githubIssues"> | null;
  onSelect: (issueId: Id<"githubIssues">) => void;
};

const priorityVariants: Record<string, string> = {
  CRITICAL: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-amber-500 text-white",
  LOW: "bg-muted text-muted-foreground",
};

export function IssueList({ repoFullName, selectedIssueId, onSelect }: IssueListProps) {
  const issues = useQuery(
    api.issues.list,
    repoFullName ? { repoFullName, limit: 25 } : { limit: 25 }
  );
  const enqueueTask = useMutation(api.tasks.enqueueTask);
  const [isProcessing, startTransition] = useTransition();

  const handleProcessIssue = (issueId: Id<"githubIssues">) => {
    startTransition(async () => {
      try {
        await enqueueTask({
          type: "TRIAGE",
          issueId,
          priority: 60,
        });
        await fetch("/api/10x-swe/task-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 1 }),
        });
      } catch (error) {
        console.error("[IssueList] Failed to process issue", error);
      }
    });
  };

  if (!issues) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading issues…</p>
      </Card>
    );
  }

  if (!issues.length) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        {repoFullName ? "No triaged issues yet for this repository." : "Connect a repository to see triaged issues."}
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <Card
          key={issue._id}
          className={cn(
            "p-4 border cursor-pointer transition-colors",
            selectedIssueId === issue._id ? "border-primary bg-primary/5" : "hover:bg-muted/60"
          )}
          onClick={() => onSelect(issue._id)}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{issue.title}</p>
                {issue.priority && (
                  <Badge className={priorityVariants[issue.priority] ?? ""}>
                    {issue.priority.toLowerCase()}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                #{issue.issueNumber} • {issue.status ?? "UNTRIAGED"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isProcessing}
              onClick={(event) => {
                event.stopPropagation();
                handleProcessIssue(issue._id);
              }}
            >
              {isProcessing ? "Queuing..." : "Re-triage"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
