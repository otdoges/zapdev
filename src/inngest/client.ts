import { Inngest } from "inngest";
import { validateEnv } from "@/lib/env";

validateEnv();

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "zapdev-production",
  eventKey: process.env.INNGEST_EVENT_KEY,
  // Note: Realtime middleware removed - using database polling for streaming instead
});
