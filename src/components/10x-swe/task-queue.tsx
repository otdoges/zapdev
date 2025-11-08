"use client";

import { useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  PROCESSING: "bg-blue-500/20 text-blue-600 dark:text-blue-300",
  COMPLETED: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300",
  FAILED: "bg-red-500/20 text-red-600 dark:text-red-300",
};

const typeLabels: Record<string, string> = {
  TRIAGE: "Issue Triage",
  CODEGEN: "Code Generation",
  PR_CREATION: "Pull Request",
};

const formatTimestamp = (value?: number | null) => {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
};

export function TaskQueueView() {
  const tasks = useQuery(api.tasks.listActive, { limit: 15 });
  const [isRunning, setIsRunning] = useState(false);

  const runQueue = async () => {
    setIsRunning(true);
    try {
      await fetch("/api/10x-swe/task-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 3 }),
      });
    } catch (error) {
      console.error("[task-queue] failed to trigger queue", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Parallel Task Queue</h3>
          <p className="text-sm text-muted-foreground">
            Active autonomous jobs with retry + concurrency control
          </p>
        </div>
        <Button size="sm" onClick={runQueue} disabled={isRunning}>
          {isRunning ? "Triggering…" : "Run Queue"}
        </Button>
      </div>

      <Separator />

      {!tasks?.length && (
        <p className="text-sm text-muted-foreground">
          No active tasks. Queue an issue to see live progress.
        </p>
      )}

      <div className="space-y-3">
        {tasks?.map((task) => (
          <div key={task._id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  {typeLabels[task.type] ?? task.type} #{task._id.slice(-6)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Issue: {task.issueId ?? "n/a"} · Attempts {task.attempts}/{task.maxAttempts ?? 3}
                </p>
              </div>
              <Badge className={cn(statusStyles[task.status] ?? "", "capitalize")}>
                {task.status.toLowerCase()}
              </Badge>
            </div>
            {task.payload?.summary && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {task.payload.summary}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
              <div>
                <p className="font-medium text-[11px] uppercase tracking-wide">Scheduled</p>
                <p>{formatTimestamp(task.scheduledAt)}</p>
              </div>
              <div>
                <p className="font-medium text-[11px] uppercase tracking-wide">Started</p>
                <p>{formatTimestamp(task.startedAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
