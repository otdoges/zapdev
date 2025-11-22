/**
 * Secure OAuth state token generation and validation
 * Uses HMAC-SHA256 to prevent tampering
 *
 * SECURITY: Uses existing INNGEST_SIGNING_KEY environment variable
 */

import { createHmac, randomBytes } from "crypto";

const STATE_SECRET = process.env.INNGEST_SIGNING_KEY;
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

if (!STATE_SECRET) {
  throw new Error("INNGEST_SIGNING_KEY environment variable is required for OAuth security");
}
// Safe, non-null secret for downstream helpers
const STATE_SECRET_KEY: string = STATE_SECRET;

interface StateData {
  userId: string;
  nonce: string;
  timestamp: number;
}

/**
 * Create a cryptographically secure OAuth state token
 * Format: base64(payload:signature)
 *
 * @param userId - The user ID to embed in the state
 * @returns Signed state token
 */
export function createOAuthState(userId: string): string {
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Date.now();

  const payload: StateData = {
    userId,
    nonce,
    timestamp,
  };

  const payloadJson = JSON.stringify(payload);
  const signature = createHmac("sha256", STATE_SECRET_KEY)
    .update(payloadJson)
    .digest("hex");

  const combined = `${payloadJson}:${signature}`;
  return Buffer.from(combined).toString("base64");
}

/**
 * Validate and extract data from an OAuth state token
 *
 * @param state - The state token to validate
 * @param expectedUserId - The user ID that should match
 * @returns true if valid, false otherwise
 * @throws Error if validation fails
 */
export function validateOAuthState(state: string, expectedUserId: string): boolean {
  try {
    // Decode base64
    const decoded = Buffer.from(state, "base64").toString("utf-8");
    const lastColonIndex = decoded.lastIndexOf(":");

    if (lastColonIndex === -1) {
      throw new Error("Invalid state format");
    }

    const payloadJson = decoded.substring(0, lastColonIndex);
    const providedSignature = decoded.substring(lastColonIndex + 1);

    // Verify signature
    const expectedSignature = createHmac("sha256", STATE_SECRET_KEY)
      .update(payloadJson)
      .digest("hex");

    if (providedSignature !== expectedSignature) {
      throw new Error("Invalid state signature");
    }

    // Parse payload
    const payload: StateData = JSON.parse(payloadJson);

    // Verify user ID
    if (payload.userId !== expectedUserId) {
      throw new Error("State token user ID mismatch");
    }

    // Check expiry
    const age = Date.now() - payload.timestamp;
    if (age > STATE_EXPIRY_MS) {
      throw new Error(`State token expired (age: ${Math.round(age / 1000)}s)`);
    }

    return true;
  } catch (error) {
    console.error("[OAuth State Validation Error]", error);
    throw error;
  }
}
