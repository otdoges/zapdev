// Upstash Redis REST client for server-side usage
// Requires the following environment variables:
// - UPSTASH_REDIS_REST_URL
// - UPSTASH_REDIS_REST_TOKEN

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function assertEnv() {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error(
      'Missing Upstash Redis environment. Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.'
    );
  }
}

async function upstashRequest<T = unknown>(path: string, method: 'GET' | 'POST' = 'GET', body?: BodyInit): Promise<T> {
  assertEnv();
  const url = `${UPSTASH_URL!.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upstash request failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

export async function kvGet(key: string): Promise<string | null> {
  const data = await upstashRequest<{ result: string | null }>(`get/${encodeURIComponent(key)}`);
  return data.result ?? null;
}

export async function kvPut(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const ttlQuery = typeof ttlSeconds === 'number' && Number.isFinite(ttlSeconds)
    ? `?_expire=${Math.max(0, Math.floor(ttlSeconds))}`
    : '';
  const path = `set/${encodeURIComponent(key)}${ttlQuery}`;
  await upstashRequest<{ result: string }>(path, 'POST', JSON.stringify({ value }));
}

export async function kvGetJson<T = unknown>(key: string): Promise<T | null> {
  const raw = await kvGet(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null as T | null;
  }
}

export async function kvPutJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  await kvPut(key, JSON.stringify(value), ttlSeconds);
}


