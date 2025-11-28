import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { 
  codeAgentFunction, 
  sandboxTransferFunction, 
  errorFixFunction, 
  sandboxCleanupFunction 
} from "@/inngest/functions";
import { backgroundAgentFunction } from "@/inngest/council";
import { autoPauseSandboxes } from "@/inngest/functions/auto-pause";
import { e2bHealthCheck, cleanupRateLimits } from "@/inngest/functions/health-check";
import { processQueuedJobs, cleanupCompletedJobs } from "@/inngest/functions/job-processor";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    codeAgentFunction,
    sandboxTransferFunction,
    errorFixFunction,
    sandboxCleanupFunction,
    autoPauseSandboxes,
    e2bHealthCheck,
    cleanupRateLimits,
    processQueuedJobs,
    cleanupCompletedJobs,
    backgroundAgentFunction,
  ],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
