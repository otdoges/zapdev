import { Inngest } from "inngest";
import { realtime } from "@inngest/realtime";

// Create a client to send and receive events with realtime middleware
export const inngest = new Inngest({
  id: "zapdev-production",
  eventKey: process.env.INNGEST_EVENT_KEY,
  middleware: [
    realtime({
      apiKey: process.env.INNGEST_REALTIME_KEY || process.env.INNGEST_EVENT_KEY,
    }),
  ],
});
