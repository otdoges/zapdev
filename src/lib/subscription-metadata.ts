export const toSafeTimestamp = (value: unknown, fallback: number) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.getTime();
    }
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return fallback;
};

export function sanitizeSubscriptionMetadata(metadata: unknown) {
    if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
        return metadata as Record<string, unknown>;
    }
    return {};
}

export function extractUserIdFromMetadata(metadata: unknown) {
    const safe = sanitizeSubscriptionMetadata(metadata);
    const userIdValue = (safe as Record<string, unknown>).userId;

    if (typeof userIdValue === "string" && userIdValue.trim() !== "") {
        return { metadata: safe, userId: userIdValue.trim() };
    }

    return { metadata: safe, userId: "" };
}

export function buildSubscriptionIdempotencyKey(payload: any) {
    const id = typeof payload?.id === "string" && payload.id.trim() !== "" ? payload.id.trim() : "";
    const updatedAt = toSafeTimestamp(payload?.updatedAt, 0);
    const status = typeof payload?.status === "string" ? payload.status : "unknown";

    if (!id && !updatedAt && status === "unknown") {
        return "";
    }

    return [id || "unknown", updatedAt, status].join(":");
}
