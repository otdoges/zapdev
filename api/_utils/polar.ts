// Polar helper utilities
// Uses environment-driven configuration for checkout/portal URLs.

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN || '';
const POLAR_API_BASE = process.env.POLAR_API_BASE || 'https://api.polar.sh';

type Period = 'month' | 'year';

export function resolveCheckoutUrl(planId: string, period: Period = 'month', opts?: { userId?: string; email?: string }): string {
  const envKey = `POLAR_CHECKOUT_${planId.toUpperCase()}_${period.toUpperCase()}`;
  const url = process.env[envKey] || '';
  if (!url) return '#/billing';
  // Optionally append email for prefill if supported by your checkout links
  try {
    const u = new URL(url);
    if (opts?.email) u.searchParams.set('prefill_email', opts.email);
    if (opts?.userId) u.searchParams.set('external_id', opts.userId);
    return u.toString();
  } catch {
    return url;
  }
}

export function resolvePortalUrl(returnUrl?: string): string {
  const raw = process.env.POLAR_PORTAL_URL || '';
  if (!raw) return returnUrl || '/settings';
  try {
    const u = new URL(raw);
    if (returnUrl) u.searchParams.set('return_url', returnUrl);
    return u.toString();
  } catch {
    return raw;
  }
}

export interface PolarSubscriptionCache {
  planId: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'none';
  currentPeriodStart: number; // ms
  currentPeriodEnd: number; // ms
  cancelAtPeriodEnd: boolean;
}

// Minimal placeholder that can be expanded to call Polar API.
// For production, implement a fetch to Polar with POLAR_ACCESS_TOKEN and map to your plans.
export async function getUserSubscriptionFromPolar(_userId: string, _email?: string): Promise<PolarSubscriptionCache> {
  // TODO: Integrate Polar API here. For now, return a inert free plan.
  return {
    planId: 'free',
    status: 'none',
    currentPeriodStart: Date.now(),
    currentPeriodEnd: Date.now(),
    cancelAtPeriodEnd: false,
  };
}

export const POLAR_CONFIG = {
  apiBase: POLAR_API_BASE,
  hasToken: Boolean(POLAR_ACCESS_TOKEN),
};


