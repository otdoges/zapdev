import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { 
  codeAgentFunction, 
  sandboxTransferFunction, 
  errorFixFunction, 
  sandboxCleanupFunction,
  triageIssueFunction,
  autonomousAgentFunction,
  createPullRequestFunction,
  taskQueueFunction,
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    codeAgentFunction,
    sandboxTransferFunction,
    errorFixFunction,
    sandboxCleanupFunction,
    triageIssueFunction,
    autonomousAgentFunction,
    createPullRequestFunction,
    taskQueueFunction,
  ],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
