import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kvGet, kvGetJson } from './_utils/kv';
import { ALLOWED_KV_PREFIXES } from './_utils/kv-constants';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const keyParam = req.query.key as string | string[] | undefined;
  let key: string | undefined;
  if (Array.isArray(keyParam)) {
    if (keyParam.length === 1) {
      key = keyParam[0];
    } else {
      return res.status(400).send('Invalid key');
    }
  } else {
    key = keyParam;
  }
  if (!key) return res.status(400).send('Missing key');

  const isAllowedKey = ALLOWED_KV_PREFIXES.some((prefix) => key!.startsWith(prefix));
  if (!isAllowedKey) return res.status(403).send('Forbidden');

  try {
    const jsonParam = req.query.json as string | string[] | undefined;
    const json = Array.isArray(jsonParam) ? jsonParam[0] : jsonParam;
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


