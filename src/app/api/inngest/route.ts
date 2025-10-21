import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { codeAgentFunction, sandboxTransferFunction, errorFixFunction, sandboxCleanupFunction } from "@/inngest/functions";

// Create an API that serves the Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    codeAgentFunction,
    sandboxTransferFunction,
    errorFixFunction,
    sandboxCleanupFunction,
  ],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
