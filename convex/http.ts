import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from './trpc/router';
import type { ActionCtx } from './_generated/server';


// HTTP action to handle tRPC requests
const trpcHandler = httpAction(async (ctx: ActionCtx, request: Request) => {
  try {
    console.log('tRPC request received:', {
      method: request.method,
      url: request.url,
      headers: request.headers ? Object.fromEntries(Object.entries(request.headers)) : {}
    });
    
    return fetchRequestHandler({
      endpoint: '/trpc',
      req: request,
      router: appRouter,
      createContext: ({ req }: { req: Request }) => createContext({ req }),
      onError: ({ error, path, type, input }: { error: Error; path?: string; type: string; input: unknown }) => {
        console.error(`tRPC Error on ${path} (${type}):`, {
          error: error.message,
          stack: error.stack,
          input,
          path,
          type
        });
      },
    });
  } catch (error) {
    console.error('Fatal tRPC handler error:', error);
    throw error;
  }
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
