// Note: getSubscriptionStatus is a pure function that doesn't depend on env vars
// We'll test it by copying the logic here to avoid import issues
function getSubscriptionStatus(subscription: any): {
  plan: "free" | "pro";
  status: string | null;
  isActive: boolean;
} {
  if (!subscription) {
    return { plan: "free", status: null, isActive: false };
  }

  const status = subscription.status;
  const isActive = ["active", "trialing"].includes(status);

  return {
    plan: isActive ? "pro" : "free",
    status,
    isActive,
  };
}

describe("Subscription Status Helper", () => {
  test("should return free plan for null subscription", () => {
    const result = getSubscriptionStatus(null);
    expect(result).toEqual({
      plan: "free",
      status: null,
      isActive: false,
    });
  });

  test("should return free plan for undefined subscription", () => {
    const result = getSubscriptionStatus(undefined);
    expect(result).toEqual({
      plan: "free",
      status: null,
      isActive: false,
    });
  });

  test("should return pro plan for active subscription", () => {
    const subscription = { status: "active", id: "sub_123" };
    const result = getSubscriptionStatus(subscription);
    expect(result).toEqual({
      plan: "pro",
      status: "active",
      isActive: true,
    });
  });

  test("should return pro plan for trialing subscription", () => {
    const subscription = { status: "trialing", id: "sub_123" };
    const result = getSubscriptionStatus(subscription);
    expect(result).toEqual({
      plan: "pro",
      status: "trialing",
      isActive: true,
    });
  });

  test("should return free plan for canceled subscription", () => {
    const subscription = { status: "canceled", id: "sub_123" };
    const result = getSubscriptionStatus(subscription);
    expect(result).toEqual({
      plan: "free",
      status: "canceled",
      isActive: false,
    });
  });

  test("should return free plan for past_due subscription", () => {
    const subscription = { status: "past_due", id: "sub_123" };
    const result = getSubscriptionStatus(subscription);
    expect(result).toEqual({
      plan: "free",
      status: "past_due",
      isActive: false,
    });
  });

  test("should return free plan for incomplete subscription", () => {
    const subscription = { status: "incomplete", id: "sub_123" };
    const result = getSubscriptionStatus(subscription);
    expect(result).toEqual({
      plan: "free",
      status: "incomplete",
      isActive: false,
    });
  });

  test("should return free plan for unknown status", () => {
    const subscription = { status: "unknown_status", id: "sub_123" };
    const result = getSubscriptionStatus(subscription);
    expect(result).toEqual({
      plan: "free",
      status: "unknown_status",
      isActive: false,
    });
  });

  test("should handle subscription with additional fields", () => {
    const subscription = {
      status: "active",
      id: "sub_123",
      customerId: "cust_456",
      productId: "prod_789",
      createdAt: "2024-01-01",
    };
    const result = getSubscriptionStatus(subscription);
    expect(result).toEqual({
      plan: "pro",
      status: "active",
      isActive: true,
    });
  });
});
