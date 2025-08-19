import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { trpcServer } from '@hono/trpc-server';
import { appRouter, createContext } from '../convex/trpc/router';

const app = new Hono();

// Add CORS middleware
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || '*';
  const allowedOrigins = ['http://localhost:8080', 'https://zapdev.link', 'https://www.zapdev.link'];
  
  if (origin === '*' || allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  }
  
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  c.header('Access-Control-Allow-Credentials', 'true');
  
  if (c.req.method === 'OPTIONS') {
    return new Response('', { status: 204 });
  }
  
  await next();
});

// tRPC integration
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: (opts: FetchCreateContextFnOptions) => createContext(opts),
    onError: ({ error, path, type }) => {
      console.error(`Hono tRPC Error on ${path} (${type}):`, {
        error: error.message,
        stack: error.stack,
        path,
        type
      });
    },
  })
);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    service: 'hono-trpc-serverless',
    timestamp: new Date().toISOString(),
    endpoints: {
      trpc: '/trpc/*'
    }
  });
});

// Export the Vercel handler with explicit method exports
const handler = handle(app);

export default handler;
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;