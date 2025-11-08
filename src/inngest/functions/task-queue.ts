import { inngest } from "@/inngest/client";
import { convex } from "@/inngest/convex-client";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type TaskQueueEvent = {
  limit?: number;
};

const TASK_EVENT_MAP: Record<string, string> = {
  TRIAGE: "10x-swe/triage-issue",
  CODEGEN: "10x-swe/autonomous-agent",
  PR_CREATION: "10x-swe/create-pr",
};

export const taskQueueFunction = inngest.createFunction(
  { id: "task-queue-manager" },
  { event: "10x-swe/task-queue" },
  async ({ event, step }) => {
    const payload = (event.data as TaskQueueEvent) || {};
    const limit = payload.limit ?? 3;

    const tasks = await step.run("fetch-pending", async () => {
      return await convex.query(api.tasks.listPending, { limit });
    });

    const dispatched = [];
    for (const task of tasks) {
      const taskId = task._id as Id<"tasks">;
      const startResult = await step.run(`start-${taskId}`, async () => {
        return await convex.mutation(api.tasks.startTask, { taskId });
      }).catch((error) => {
        console.error("[task-queue] Failed to start task", taskId, error);
        return null;
      });

      if (!startResult) {
        continue;
      }

      const eventName = TASK_EVENT_MAP[task.type];
      if (!eventName) {
        await convex.mutation(api.tasks.failTask, {
          taskId,
          error: `No handler for task type ${task.type}`,
          requeue: false,
        });
        continue;
      }

      await inngest.send({
        name: eventName,
        data: {
          taskId,
          issueId: task.issueId,
          ...((task.payload as Record<string, unknown>) || {}),
        },
      });

      dispatched.push(taskId);
    }

    return {
      dispatched: dispatched.length,
    };
  }
);
