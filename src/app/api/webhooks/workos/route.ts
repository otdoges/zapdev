import { WorkOS } from "@workos-inc/node";
import { headers } from "next/headers";

let workos: WorkOS | null = null;

const getWorkOSClient = () => {
  if (!workos) {
    const WORKOS_API_KEY = process.env.WORKOS_API_KEY;

    if (!WORKOS_API_KEY) {
      throw new Error(
        "Please add WORKOS_API_KEY from WorkOS Dashboard to .env or .env.local"
      );
    }

    workos = new WorkOS(WORKOS_API_KEY);
  }

  return workos;
};

export async function POST(req: Request) {
  // Get WorkOS webhook secret
  const WEBHOOK_SECRET = process.env.WORKOS_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WORKOS_WEBHOOK_SECRET from WorkOS Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = headers();
  const signature = headerPayload.get("workos-signature");

  if (!signature) {
    return new Response("Error occurred -- no WorkOS signature header", {
      status: 400,
    });
  }

  const rawBody = await req.text();

  let event;

  try {
    const payload = JSON.parse(rawBody);

    event = await getWorkOSClient().webhooks.constructEvent({
      payload,
      sigHeader: signature,
      secret: WEBHOOK_SECRET,
    });
  } catch (error) {
    console.error("Error verifying WorkOS webhook:", error);

    return new Response("Invalid signature", { status: 400 });
  }

  const { event: eventType, data } = event;

  if (eventType === "user.created") {
    const { id, email, firstName, lastName, profilePictureUrl } = data;

    console.log(`User created: ${id} (${email})`, {
      firstName,
      lastName,
      profilePictureUrl,
    });

    // Initialize usage for the new user
    try {
      // The usage system will initialize lazily on first generation
      console.log(`User ${id} created. Usage will be initialized lazily on first generation.`);
    } catch (error) {
      console.error("Error initializing user data:", error);
    }
  }

  if (eventType === "user.updated") {
    const { id, email } = data;
    console.log(`User updated: ${id} (${email})`);
    // Handle user updates if needed
  }

  if (eventType === "user.deleted") {
    const { id } = data;
    console.log(`User deleted: ${id}`);
    // Handle user deletion if needed (cleanup projects, messages, etc.)
  }

  return new Response("", { status: 200 });
}
