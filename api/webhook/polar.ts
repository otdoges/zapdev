import type { VercelRequest, VercelResponse } from '@vercel/node';
import { api } from '../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

// Polar webhook endpoint
// URL: /api/webhook/polar
// Docs reference: https://docs.polar.sh/llms-full.txt (Webhooks section)

const SUPPORTED_EVENTS = new Set<string>([
  'checkout.created',
  'checkout.updated',
  'order.created',
  'order.updated',
  'order.paid',
  'subscription.created',
  'subscription.updated',
  'subscription.active',
  'subscription.canceled',
  'subscription.revoked',
  'invoice.paid',
  'invoice.payment_failed',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const secret = process.env.POLAR_WEBHOOK_SECRET;
    const signatureHeaderRaw = req.headers['polar-signature'] || req.headers['x-polar-signature'];
    const signature = Array.isArray(signatureHeaderRaw) ? signatureHeaderRaw[0] : signatureHeaderRaw;

    // Minimal verification: require secret and presence of signature header.
    // For full verification, prefer Polar SDK adapters (Next.js/Express/etc.).
    if (secret && !signature) {
      return res.status(400).send('Missing Polar signature header');
    }

    // Parse payload (supports string, buffer, or parsed JSON)
    type ReqWithRaw = VercelRequest & { rawBody?: string | Buffer; body?: unknown } & { text?: () => Promise<string> };
    const r = req as ReqWithRaw;
    let json: unknown = undefined;
    if (typeof r.body === 'object' && r.body !== null) {
      json = r.body as object;
    } else if (typeof r.body === 'string') {
      try { json = JSON.parse(r.body) as object; } catch { /* ignore */ }
    } else if (typeof r.rawBody === 'string') {
      try { json = JSON.parse(r.rawBody) as object; } catch { /* ignore */ }
    } else if (Buffer.isBuffer(r.rawBody)) {
      try { json = JSON.parse(r.rawBody.toString('utf8')) as object; } catch { /* ignore */ }
    } else if (Buffer.isBuffer(r as unknown as Buffer)) {
      try { json = JSON.parse((r as unknown as Buffer).toString('utf8')) as object; } catch { /* ignore */ }
    } else if (typeof r.text === 'function') {
      try { const txt = await r.text(); json = JSON.parse(txt) as object; } catch { /* ignore */ }
    }

    const eventTypeHeaderRaw = req.headers['polar-event'] || req.headers['x-polar-event'];
    const eventTypeHeader = Array.isArray(eventTypeHeaderRaw) ? eventTypeHeaderRaw[0] : eventTypeHeaderRaw;
    const body = (json || {}) as Record<string, unknown>;
    const eventType = (eventTypeHeader as string) || (body.type as string) || (body.event as string) || 'unknown';

    // At this point you can branch on eventType and update your DB.
    // Our app fetches subscription state on-demand, so we just acknowledge.
    const ignored = !SUPPORTED_EVENTS.has(eventType);

    // If we receive a subscription event and we have user context, upsert in Convex
    if (!ignored && eventType.startsWith('subscription')) {
      // Expecting payload to include external_id (Clerk user id) and plan info
      const payload = (body.data as Record<string, unknown>) || (body.payload as Record<string, unknown>) || body || {};
      const userId = (payload.external_id as string) || (payload.user_id as string) || (payload.customer_id as string) || '';
      const rawPlanId: string = (payload.plan_id as string) || (payload.price_id as string) || (payload.product_id as string) || '';
      const proList = (process.env.POLAR_PLAN_PRO_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
      const entList = (process.env.POLAR_PLAN_ENTERPRISE_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
      const isEnterprise = rawPlanId ? entList.includes(rawPlanId) || /enterprise/i.test(rawPlanId) : false;
      const isPro = rawPlanId ? proList.includes(rawPlanId) || /pro/i.test(rawPlanId) : false;
      const planId: 'free' | 'pro' | 'enterprise' = isEnterprise ? 'enterprise' : isPro ? 'pro' : 'pro';
      const status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'none' =
        (payload.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'none' | undefined) || (eventType.includes('canceled') ? 'canceled' : 'active');
      const currentPeriodStart = typeof payload.current_period_start === 'number' ? payload.current_period_start * 1000 : Date.now();
      const currentPeriodEnd = typeof payload.current_period_end === 'number' ? payload.current_period_end * 1000 : Date.now();

      // 1) Update Clerk public metadata
      if (userId && process.env.CLERK_SECRET_KEY) {
        try {
          const { createClerkClient } = await import('@clerk/backend');
          const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
          await clerk.users.updateUser(userId, {
            publicMetadata: {
              billing: {
                provider: 'polar',
                planId,
                status,
                currentPeriodStart,
                currentPeriodEnd,
              },
            },
          } as unknown as { publicMetadata: Record<string, unknown> });
        } catch (e) {
          console.error('[POLAR WEBHOOK] Clerk update failed', e);
        }
      }

      // 2) Upsert subscription in Convex
      const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
      if (userId && convexUrl) {
        const client = new ConvexHttpClient(convexUrl);
        try {
          await client.mutation(api.users.upsertUserSubscription, {
            userId,
            planId,
            status,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: !!payload.cancel_at_period_end,
          });
        } catch (e) {
          console.error('[POLAR WEBHOOK] Convex upsert failed', e);
        }
      }
    }

    return res.status(200).json({ received: true, event: eventType, ignored });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[POLAR WEBHOOK] Error', message);
    return res.status(400).send(message);
  }
}


