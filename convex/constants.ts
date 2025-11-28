import { v } from "convex/values";

export const backgroundJobStatuses = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export type BackgroundJobStatus = (typeof backgroundJobStatuses)[number];

export const backgroundJobStatusSchema = v.union(
  ...backgroundJobStatuses.map((status) => v.literal(status))
);
