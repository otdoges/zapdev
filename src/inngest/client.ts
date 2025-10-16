import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "zapdev-production",
  eventKey: process.env.INNGEST_EVENT_KEY,
  // remove realtime middleware for now; add when available
});
