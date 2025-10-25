import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { 
  codeAgentFunction, 
  multiAgentFunction,
  sandboxTransferFunction, 
  errorFixFunction, 
  sandboxCleanupFunction 
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    codeAgentFunction,
    multiAgentFunction,
    sandboxTransferFunction,
    errorFixFunction,
    sandboxCleanupFunction,
  ],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
