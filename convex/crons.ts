import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired webhook events every 5 minutes
// Note: If types are not regenerated yet, this may show a TypeScript error
// Run `bunx convex dev` to regenerate types
crons.interval(
    "cleanup expired webhook events",
    { minutes: 5 },
    internal.webhookEvents.cleanupExpiredEvents as any // Remove 'as any' after running bunx convex dev
);

export default crons;
