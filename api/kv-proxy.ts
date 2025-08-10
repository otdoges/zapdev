// Deprecated: KV proxy removed. Keeping endpoint to avoid 404s; returns 410 Gone.
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(410).send('KV proxy removed');
}


