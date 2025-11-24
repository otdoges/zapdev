import { PostHog } from "posthog-node";

type TelemetryProps = Record<string, unknown> & {
  userId?: string;
};

// SECURITY: Allowlist of safe properties to prevent leaking sensitive data
const SAFE_PROPERTIES = [
  'userId',
  'projectId',
  'messageId',
  'framework',
  'sandboxId',
  'filesCount',
  'model',
  'requestedModel',
  'validationHasErrors',
  'lintErrorLength',
  'buildErrorLength',
  'specMode',
  'specLength',
  'error',
  'timestamp',
];

/**
 * Sanitizes telemetry properties to prevent leaking user prompts, API keys, or file contents.
 * Only allowlisted properties are included in the sanitized output.
 */
function sanitizeProperties(properties: TelemetryProps): TelemetryProps {
  const sanitized: TelemetryProps = {};
  
  for (const key of SAFE_PROPERTIES) {
    if (key in properties) {
      sanitized[key] = properties[key];
    }
  }
  
  return sanitized;
}

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

export function captureTelemetry(
  event: string,
  properties: TelemetryProps = {},
): void {
  const ph = getClient();
  if (!ph) return;

  try {
    const distinctId =
      (properties.userId as string | undefined) ||
      (properties.projectId as string | undefined) ||
      "anonymous";

    // SECURITY: Sanitize properties before sending to prevent data leaks
    const sanitizedProperties = sanitizeProperties(properties);

    // Fire-and-forget: PostHog queues events asynchronously
    // For serverless/short-lived processes, call flushTelemetry() at shutdown
    ph.capture({
      distinctId,
      event,
      properties: sanitizedProperties,
    });
  } catch (error) {
    console.error("[Telemetry] Failed to capture event", event, error);
  }
}

export async function flushTelemetry(): Promise<void> {
  // Avoid initializing a new client during shutdown; only flush if one exists.
  const ph = client;
  if (!ph) return;

  try {
    await ph.shutdown();
    client = null;
  } catch (error) {
    console.error("[Telemetry] Failed to flush", error);
  }
}
