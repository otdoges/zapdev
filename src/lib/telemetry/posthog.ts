import { PostHog } from "posthog-node";

type TelemetryProps = Record<string, unknown> & {
  userId?: string;
};

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;

  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) return null;

  const host =
    process.env.POSTHOG_HOST ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST ||
    "https://us.i.posthog.com";

  client = new PostHog(apiKey, {
    host,
  });

  return client;
}

export async function captureTelemetry(
  event: string,
  properties: TelemetryProps = {},
): Promise<void> {
  const ph = getClient();
  if (!ph) return;

  try {
    const distinctId =
      (properties.userId as string | undefined) ||
      (properties.projectId as string | undefined) ||
      "anonymous";

    await ph.capture({
      distinctId,
      event,
      properties,
    });
  } catch (error) {
    console.error("[Telemetry] Failed to capture event", event, error);
  }
}

export async function flushTelemetry(): Promise<void> {
  const ph = getClient();
  if (!ph) return;

  try {
    await ph.shutdownAsync();
  } catch (error) {
    console.error("[Telemetry] Failed to flush", error);
  }
}
