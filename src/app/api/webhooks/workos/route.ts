import { headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST(req: Request) {
  // Get WorkOS webhook secret
  const WEBHOOK_SECRET = process.env.WORKOS_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WORKOS_WEBHOOK_SECRET from WorkOS Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const signature = headerPayload.get("workos-signature");

  if (!signature) {
    return new Response("Error occurred -- no WorkOS signature header", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();

  // TODO: Verify webhook signature using WorkOS SDK
  // For now, we'll process the event without verification
  // In production, you should verify the signature:
  // const isValid = await verifyWorkOSWebhook(payload, signature, WEBHOOK_SECRET);
  // if (!isValid) {
  //   return new Response("Invalid signature", { status: 400 });
  // }

  const eventType = payload.event;

  // Initialize Convex client
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  if (eventType === "user.created") {
    const { id, email, first_name, last_name, profile_picture_url } = payload.data;

    console.log(`User created: ${id} (${email})`);

    // Initialize usage for the new user
    try {
      // The usage system will initialize lazily on first generation
      console.log(`User ${id} created. Usage will be initialized lazily on first generation.`);
    } catch (error) {
      console.error("Error initializing user data:", error);
    }
  }

  if (eventType === "user.updated") {
    const { id, email } = payload.data;
    console.log(`User updated: ${id} (${email})`);
    // Handle user updates if needed
  }

  if (eventType === "user.deleted") {
    const { id } = payload.data;
    console.log(`User deleted: ${id}`);
    // Handle user deletion if needed (cleanup projects, messages, etc.)
  }

  return new Response("", { status: 200 });
}
