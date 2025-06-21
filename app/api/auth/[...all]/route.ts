import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

// Add CORS headers to all responses
const addCorsHeaders = (response: Response) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
};

export const POST = async (request: Request) => {
  try {
    const response = await handler.POST(request);
    return addCorsHeaders(response);
  } catch (error) {
    console.error("Auth POST error:", error);
    return addCorsHeaders(new Response(
      JSON.stringify({ error: "Authentication error" }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    ));
  }
};

export const GET = async (request: Request) => {
  try {
    const response = await handler.GET(request);
    return addCorsHeaders(response);
  } catch (error) {
    console.error("Auth GET error:", error);
    return addCorsHeaders(new Response(
      JSON.stringify({ error: "Authentication error" }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    ));
  }
};

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}; 