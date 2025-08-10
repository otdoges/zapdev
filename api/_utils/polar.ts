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
    console.warn('POLAR_ACCESS_TOKEN not configured, using fallback');
    throw new Error('Polar API not available');
  }
  
  const url = `${POLAR_API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${POLAR_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ZapDev/1.0',
    },
    ...init,
  });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    console.error(`Polar API Error: ${res.status} ${res.statusText}`, errorText);
    throw new Error(`Polar API ${res.status}: ${res.statusText}`);
  }
  
  const data = await res.json();
  return data as T;
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
    if (!POLAR_ACCESS_TOKEN) {
      console.log('No Polar access token, returning free plan');
      return freePlan();
    }

    // Use correct Polar API endpoints based on documentation
    const queries: string[] = [];
    if (userId) {
      // Try external_id parameter for customer identification
      queries.push(`/v1/subscriptions/?external_id=${encodeURIComponent(userId)}`);
    }
    if (email) {
      // Try customer lookup by email first, then get subscriptions
      queries.push(`/v1/customers/?email=${encodeURIComponent(email)}`);
    }

    type SubRow = Record<string, unknown> & {
      price_id?: string;
      product_id?: string;
      plan_id?: string;
      status?: KnownStatus | string;
      current_period_start?: string | number;
      current_period_end?: string | number;
      cancel_at_period_end?: boolean;
      canceled_at?: string | null;
    };

    let first: SubRow | undefined;
    
    for (const q of queries) {
      try {
        console.log(`Trying Polar query: ${q}`);
        const data = await polarRequest<PolarListResponse<SubRow>>(q);
        
        // Handle both items and data arrays
        const list: SubRow[] = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data) ? data : [];
          
        console.log(`Found ${list.length} results for query: ${q}`);
        
        if (list.length > 0) {
          // Find active subscription
          const active = list.find(sub => 
            !sub.status || sub.status === 'active' || sub.status === 'trialing'
          );
          if (active) {
            first = active;
            break;
          }
        }
      } catch (error) {
        console.error(`Polar query failed: ${q}`, error);
        // Continue to next query
      }
    }

    if (!first) {
      console.log('No active subscription found, returning free plan');
      return freePlan();
    }

    const rawPlanId = first.price_id || first.product_id || first.plan_id || '';
    const status = ((first.status as string) || 'active') as KnownStatus;
    const currentPeriodStart = toMs(first.current_period_start);
    const currentPeriodEnd = toMs(first.current_period_end);
    const cancelAtPeriodEnd = Boolean(first.cancel_at_period_end);

    const subscription = {
      planId: mapPlanId(rawPlanId),
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    };
    
    console.log('Subscription found:', subscription);
    return subscription;
  } catch (error) {
    console.error('getUserSubscriptionFromPolar error:', error);
    return freePlan();
  }
}

export const POLAR_CONFIG = {
  apiBase: POLAR_API_BASE,
  hasToken: Boolean(POLAR_ACCESS_TOKEN),
};


