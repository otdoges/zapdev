import Stripe from 'stripe';
import { z } from 'zod';

// Utilities for safe Stripe usage shared across API routes

const EmailSchema = z.string().email();
const USER_ID_PATTERN = /^[A-Za-z0-9._:@\-|/]+$/; // conservative allow-list

export function isValidEmail(email: string | undefined | null): email is string {
  if (!email || typeof email !== 'string') return false;
  const parsed = EmailSchema.safeParse(email.trim());
  return parsed.success;
}

export function sanitizeUserId(userId: string | undefined | null): string | null {
  if (!userId || typeof userId !== 'string') return null;
  const trimmed = userId.trim();
  if (trimmed.length === 0 || trimmed.length > 128) return null;
  return USER_ID_PATTERN.test(trimmed) ? trimmed : null;
}

export function escapeStripeQueryValue(value: string): string {
  // Escape backslashes and single quotes used in Stripe's search syntax
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function stableIdempotencyKey(email: string, userId?: string | null): string {
  const lower = email.toLowerCase();
  return `customer_${userId ?? 'none'}_${lower}`.slice(0, 255);
}

export async function ensureStripeCustomer(
  stripe: Stripe,
  email?: string,
  userId?: string
): Promise<string | undefined> {
  if (!isValidEmail(email)) return undefined;
  const normalizedEmail = email!.trim().toLowerCase();
  const safeUserId = sanitizeUserId(userId);

  const query = safeUserId
    ? `metadata['userId']:'${escapeStripeQueryValue(safeUserId)}'`
    : `email:'${escapeStripeQueryValue(normalizedEmail)}'`;

  try {
    const search = await stripe.customers.search({ query });
    if (search.data[0]) return search.data[0].id;
  } catch (error) {
    console.error('Stripe customers.search failed', { query, error });
  }

  // Fallback list by email to handle cases where search index lags
  try {
    const list = await stripe.customers.list({ email: normalizedEmail, limit: 1 });
    if (list.data[0]) {
      const existing = list.data[0];
      if (safeUserId) {
        try {
          await stripe.customers.update(existing.id, { metadata: { userId: safeUserId } });
        } catch (updateError) {
          console.error('Stripe customers.update (metadata attach) failed', { customerId: existing.id, updateError });
        }
      }
      return existing.id;
    }
  } catch (listError) {
    console.error('Stripe customers.list failed', { email: normalizedEmail, listError });
  }

  // Create with idempotency to avoid race-condition duplicates
  const idempotencyKey = stableIdempotencyKey(normalizedEmail, safeUserId ?? undefined);
  try {
    const created = await stripe.customers.create(
      { email: normalizedEmail, metadata: safeUserId ? { userId: safeUserId } : undefined },
      { idempotencyKey }
    );
    return created.id;
  } catch (createError) {
    console.error('Stripe customers.create failed; retrying search', { idempotencyKey, createError });
    // Brief retry: search again in case another concurrent request created it
    try {
      const retry = await stripe.customers.search({ query });
      if (retry.data[0]) return retry.data[0].id;
    } catch (retryError) {
      console.error('Stripe customers.search retry failed', { query, retryError });
    }
    return undefined;
  }
}

export async function ensureStripeCustomerByUser(
  stripe: Stripe,
  userId: string
): Promise<string | undefined> {
  const safeUserId = sanitizeUserId(userId);
  if (!safeUserId) return undefined;
  const query = `metadata['userId']:'${escapeStripeQueryValue(safeUserId)}'`;
  try {
    const search = await stripe.customers.search({ query });
    if (search.data[0]) return search.data[0].id;
    return undefined;
  } catch (error) {
    console.error('Stripe customers.search by user failed', { query, error });
    return undefined;
  }
}

export function mapPriceId(id: string): 'free' | 'pro' | 'enterprise' {
  const pro = [process.env.STRIPE_PRICE_PRO_MONTH, process.env.STRIPE_PRICE_PRO_YEAR].filter(Boolean) as string[];
  const ent = [process.env.STRIPE_PRICE_ENTERPRISE_MONTH, process.env.STRIPE_PRICE_ENTERPRISE_YEAR].filter(Boolean) as string[];
  if (ent.includes(id)) return 'enterprise';
  if (pro.includes(id)) return 'pro';
  return 'free';
}


