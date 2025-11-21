type SubscriptionMetadata = Record<string, unknown>;

interface IdempotencySource {
  id: string;
  updatedAt: string | number | Date;
  status: string;
}

function resolveTimestamp(value: string | number | Date): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

export function sanitizeSubscriptionMetadata(input: unknown): SubscriptionMetadata {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return input as SubscriptionMetadata;
}

export function extractUserIdFromMetadata(input: unknown): {
  metadata: SubscriptionMetadata;
  userId: string;
} {
  const metadata = sanitizeSubscriptionMetadata(input);
  const userIdValue = metadata.userId;
  const userId = typeof userIdValue === "string" ? userIdValue.trim() : "";

  return { metadata, userId };
}

export function buildSubscriptionIdempotencyKey(source: IdempotencySource): string {
  const updatedAtTimestamp = resolveTimestamp(source.updatedAt);
  const normalizedStatus = source.status?.toLowerCase() ?? "";

  return `${source.id}:${updatedAtTimestamp}:${normalizedStatus}`;
}
