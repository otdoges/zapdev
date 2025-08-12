import { httpRouter, ROUTABLE_HTTP_METHODS } from "convex/server";
import { httpAction } from "./_generated/server";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from './trpc/router';
import { autumnHandler } from "autumn-js/convex";

// Clerk JWT verification (duplicated from tRPC router for HTTP identify)
async function verifyClerkJwt(token: string): Promise<{ id: string; email?: string } | null> {
  try {
    const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (!issuer) throw new Error('Missing CLERK_JWT_ISSUER_DOMAIN');
    const audience = process.env.CLERK_JWT_AUDIENCE;
    const { verifyToken } = await import('@clerk/backend');
    const options: { jwtKey?: string; audience?: string } = { jwtKey: issuer };
    if (audience) options.audience = audience;
    const verified = (await verifyToken(token, options)) as { sub?: string; email?: string };
    const sub = verified.sub;
    const email = verified.email;
    if (!sub) return null;
    return { id: sub, email };
  } catch (error) {
    console.error('verifyClerkJwt failed', error);
    return null;
  }
}

// HTTP action to handle tRPC requests
const trpcHandler = httpAction(async (ctx, request) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: request,
    router: appRouter,
    createContext: ({ req }) => createContext({ req }),
    onError: ({ error, path }) => {
      console.error(`tRPC Error on ${path}:`, error);
    },
  });
});

// HTTP router configuration
const http = httpRouter();

// Route all /trpc requests to the tRPC handler
http.route({
  path: "/trpc",
  method: "GET",
  handler: trpcHandler,
});

http.route({
  path: "/trpc",
  method: "POST", 
  handler: trpcHandler,
});

// Handle tRPC batch requests
http.route({
  pathPrefix: "/trpc/",
  method: "GET",
  handler: trpcHandler,
});

http.route({
  pathPrefix: "/trpc/",
  method: "POST",
  handler: trpcHandler,
});

// Initialize Autumn handler for Convex HTTP routes
const autumn = autumnHandler({
  httpAction,
  identify: async ({ request }) => {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : undefined;

    let customerId: string | undefined;
    let email: string | undefined;

    if (token) {
      const verified = await verifyClerkJwt(token);
      if (verified) {
        customerId = verified.id;
        email = verified.email;
      }
    }

    return {
      customerId,
      customerData: {
        email,
      },
    };
  },
});

// Route all /api/autumn/* requests to the Autumn handler for every routable method
for (const method of ROUTABLE_HTTP_METHODS) {
  http.route({
    pathPrefix: "/api/autumn/",
    method,
    handler: autumn,
  });
}

export default http;
