// Cloudflare KV REST API client for server-side usage
// Requires the following environment variables:
// - CLOUDFLARE_ACCOUNT_ID
// - CF_KV_NAMESPACE_ID (or CLOUDFLARE_KV_NAMESPACE_ID)
// - CLOUDFLARE_API_TOKEN

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID || process.env.CLOUDFLARE_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

function assertEnv() {
  if (!CF_ACCOUNT_ID || !CF_NAMESPACE_ID || !CF_API_TOKEN) {
    throw new Error(
      'Missing Cloudflare KV environment. Ensure CLOUDFLARE_ACCOUNT_ID, CF_KV_NAMESPACE_ID (or CLOUDFLARE_KV_NAMESPACE_ID), and CLOUDFLARE_API_TOKEN are set.'
    );
  }
}

const baseUrl = () =>
  `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_NAMESPACE_ID}`;

export async function kvGet(key: string): Promise<string | null> {
  assertEnv();
  const url = `${baseUrl()}/values/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`KV get failed (${res.status}): ${text}`);
  }
  return await res.text();
}

export async function kvPut(key: string, value: string): Promise<void> {
  assertEnv();
  const url = `${baseUrl()}/values/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'text/plain',
    },
    body: value,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`KV put failed (${res.status}): ${text}`);
  }
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

export async function kvPutJson(key: string, value: unknown): Promise<void> {
  await kvPut(key, JSON.stringify(value));
}


