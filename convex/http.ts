import { httpRouter, ROUTABLE_HTTP_METHODS } from "convex/server";
import { httpAction } from "./_generated/server";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from './trpc/router';

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


export default http;
