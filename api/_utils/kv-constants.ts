export const KV_PREFIXES = {
  STRIPE_USER: 'stripe:user:',
  STRIPE_CUSTOMER: 'stripe:customer:',
} as const;

export const ALLOWED_KV_PREFIXES = ['public:', 'stripe:user:', 'stripe:customer:'] as const;
export type AllowedKvPrefix = typeof ALLOWED_KV_PREFIXES[number];
