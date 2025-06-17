import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { stripeWebhook } from "./stripe";
import { clerkWebhook } from "./clerk";

const http = httpRouter();

// Stripe webhook
http.route({
  path: "/stripe",
  method: "POST",
  handler: stripeWebhook,
});

// Clerk webhooks
http.route({
  path: "/clerk",
  method: "POST",
  handler: clerkWebhook,
});

// Add HTTP routes here as needed
// Example: health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Convex's http router is stateless, so we need to export it.
// We also need to export a `POST` method for the Stripe webhook.
// The `http` object is what Convex will use to route requests.
export default http; 