// Polar helper utilities
// Uses environment-driven configuration for checkout/portal URLs.

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN || '';
const POLAR_API_BASE = (process.env.POLAR_API_BASE || 'https://api.polar.sh').replace(/\/$/, '');

type Period = 'month' | 'year';

type KnownStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'none';

export function resolveCheckoutUrl(planId: string, period: Period = 'month', opts?: { userId?: string; email?: string }): string {
  const envKey = `POLAR_CHECKOUT_${planId.toUpperCase()}_${period.toUpperCase()}`;
  const url = process.env[envKey] || '';
  if (!url) return '#/billing';
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
  status: KnownStatus;
  currentPeriodStart: number; // ms
  currentPeriodEnd: number; // ms
  cancelAtPeriodEnd: boolean;
}

function freePlan(): PolarSubscriptionCache {
  const now = Date.now();
  return {
    planId: 'free',
    status: 'none',
    currentPeriodStart: now,
    currentPeriodEnd: now,
    cancelAtPeriodEnd: false,
  };
}

function toMs(value: unknown): number {
  if (typeof value === 'number') {
    return value < 10_000_000_000 ? value * 1000 : value;
  }
  return Date.now();
}

interface PolarListResponse<T> { items?: T[]; data?: T[] }

async function polarRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!POLAR_ACCESS_TOKEN) {
    throw new Error('POLAR_ACCESS_TOKEN not configured');
  }
  
  const url = `${POLAR_API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${POLAR_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Polar API ${res.status}: ${res.statusText}`);
  }
  return (await res.json()) as T;
}

function mapPlanId(raw: string | undefined | null): 'free' | 'pro' | 'enterprise' {
  if (!raw) return 'pro';
  const proList = (process.env.POLAR_PLAN_PRO_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const entList = (process.env.POLAR_PLAN_ENTERPRISE_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (entList.includes(raw) || /enterprise/i.test(raw)) return 'enterprise';
  if (proList.includes(raw) || /pro/i.test(raw)) return 'pro';
  return 'pro';
}

// Query Polar for the user's active subscription by external_id/email with safe fallbacks
export async function getUserSubscriptionFromPolar(userId: string, email?: string): Promise<PolarSubscriptionCache> {
  try {
    if (!POLAR_ACCESS_TOKEN) return freePlan();

    // Try multiple query strategies; stop at first hit
    const queries: string[] = [];
    if (userId) {
      queries.push(`/v1/subscriptions?external_customer_id=${encodeURIComponent(userId)}&status=active`);
      queries.push(`/v1/subscriptions?user_id=${encodeURIComponent(userId)}&status=active`);
    }
    if (email) {
      queries.push(`/v1/subscriptions?customer_email=${encodeURIComponent(email)}&status=active`);
    }

    type SubRow = Record<string, unknown> & {
      price_id?: string;
      product_id?: string;
      plan_id?: string;
      status?: KnownStatus | string;
      current_period_start?: number;
      current_period_end?: number;
      cancel_at_period_end?: boolean;
    };

    let first: SubRow | undefined;
    for (const q of queries) {
      try {
        const data = await polarRequest<PolarListResponse<SubRow>>(q);
        const list: SubRow[] = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.data)
          ? data.data
          : [];
        if (list.length > 0) {
          first = list[0];
          break;
        }
      } catch {
        // try next
      }
    }

    if (!first) return freePlan();

    const rawPlanId = first.price_id || first.product_id || first.plan_id || '';
    const status = ((first.status as string) || 'active') as KnownStatus;
    const currentPeriodStart = toMs(first.current_period_start);
    const currentPeriodEnd = toMs(first.current_period_end);
    const cancelAtPeriodEnd = Boolean(first.cancel_at_period_end);

    return {
      planId: mapPlanId(rawPlanId),
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    };
  } catch {
    return freePlan();
  }
}

export const POLAR_CONFIG = {
  apiBase: POLAR_API_BASE,
  hasToken: Boolean(POLAR_ACCESS_TOKEN),
};


