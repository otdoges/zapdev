import { nextJsHandler } from "@convex-dev/better-auth/nextjs";

const { GET, POST } = nextJsHandler();

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
  });
}

export { GET, POST };
