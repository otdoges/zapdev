import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kvGet, kvGetJson } from './_utils/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { key, json } = req.query as { key?: string; json?: string };
  if (!key) return res.status(400).send('Missing key');

  const allowedPrefixes = ['public:'];
  const isAllowedKey = allowedPrefixes.some((prefix) => key.startsWith(prefix));
  if (!isAllowedKey) return res.status(403).send('Forbidden');

  try {
    if (json === '1' || json === 'true') {
      const v = await kvGetJson(key);
      if (v == null) return res.status(404).send('');
      return res.status(200).json(v);
    }
    const v = await kvGet(key);
    if (v == null) return res.status(404).send('');
    return res.status(200).send(v);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Error';
    return res.status(500).send(message);
  }
}


