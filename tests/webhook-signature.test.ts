import { createHmac, timingSafeEqual } from "crypto";

// Copy of the verifyWebhookSignature function to match production implementation
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Polar platform webhooks sign payloads with a base64 HMAC SHA256 digest
    const secretBytes = Buffer.from(secret, "base64");
    if (secretBytes.length === 0) {
      console.error("Webhook verification failed: base64 secret decoded to empty value");
      return false;
    }

    const hmac = createHmac("sha256", secretBytes);
    hmac.update(payload);
    const expectedSignature = hmac.digest("base64");

    const providedSignature = signature.trim();
    if (providedSignature.length === 0) {
      console.warn("Webhook signature missing or empty");
      return false;
    }

    // Ensure both strings are same length before comparison
    // timingSafeEqual will throw if lengths differ
    if (providedSignature.length !== expectedSignature.length) {
      console.warn("Webhook base64 signature length mismatch");
      return false;
    }

    return timingSafeEqual(
      Buffer.from(providedSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch (error) {
    console.error("Webhook base64 signature verification failed:", error);
    return false;
  }
}

describe("Webhook Signature Verification", () => {
  // Test secret - base64 encoded to match production behavior
  // Not a real secret, safe for version control
  const secret = Buffer.from("test_webhook_secret_12345").toString("base64");
  const payload = JSON.stringify({ type: "subscription.created", data: { id: "sub_123" } });

  function generateSignature(payload: string, secret: string): string {
    const secretBytes = Buffer.from(secret, "base64");
    const hmac = createHmac("sha256", secretBytes);
    hmac.update(payload);
    return hmac.digest("base64");
  }

  test("should verify valid signature", () => {
    const signature = generateSignature(payload, secret);
    const result = verifyWebhookSignature(payload, signature, secret);
    expect(result).toBe(true);
  });

  test("should reject invalid signature", () => {
    const invalidSignature = "invalid_signature_12345";
    const result = verifyWebhookSignature(payload, invalidSignature, secret);
    expect(result).toBe(false);
  });

  test("should reject signature with wrong secret", () => {
    // Test value - not a real secret
    const wrongSecret = "wrong_secret_12345";
    const signature = generateSignature(payload, wrongSecret);
    const result = verifyWebhookSignature(payload, signature, secret);
    expect(result).toBe(false);
  });

  test("should reject signature with different length", () => {
    const signature = generateSignature(payload, secret);
    const truncatedSignature = signature.slice(0, -2);
    const result = verifyWebhookSignature(payload, truncatedSignature, secret);
    expect(result).toBe(false);
  });

  test("should reject empty signature", () => {
    const result = verifyWebhookSignature(payload, "", secret);
    expect(result).toBe(false);
  });

  test("should handle modified payload", () => {
    const signature = generateSignature(payload, secret);
    const modifiedPayload = payload + " modified";
    const result = verifyWebhookSignature(modifiedPayload, signature, secret);
    expect(result).toBe(false);
  });

  test("should handle timing attack scenarios", () => {
    const signature = generateSignature(payload, secret);
    // Create a signature that differs by one character
    const almostValidSignature = signature.slice(0, -1) + (signature.slice(-1) === "a" ? "b" : "a");
    const result = verifyWebhookSignature(payload, almostValidSignature, secret);
    expect(result).toBe(false);
  });

  test("should handle special characters in payload", () => {
    const specialPayload = JSON.stringify({ 
      type: "test", 
      data: { 
        message: "Special chars: @#$%^&*(){}[]|\\:;\"'<>,.?/~`" 
      } 
    });
    const signature = generateSignature(specialPayload, secret);
    const result = verifyWebhookSignature(specialPayload, signature, secret);
    expect(result).toBe(true);
  });

  test("should handle unicode in payload", () => {
    const unicodePayload = JSON.stringify({ 
      type: "test", 
      data: { 
        message: "Unicode: 你好世界 🚀 émojis" 
      } 
    });
    const signature = generateSignature(unicodePayload, secret);
    const result = verifyWebhookSignature(unicodePayload, signature, secret);
    expect(result).toBe(true);
  });

  test("should handle very long payload", () => {
    const longPayload = JSON.stringify({ 
      type: "test", 
      data: { 
        message: "x".repeat(10000) 
      } 
    });
    const signature = generateSignature(longPayload, secret);
    const result = verifyWebhookSignature(longPayload, signature, secret);
    expect(result).toBe(true);
  });
});
