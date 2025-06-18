import { auth } from '@/lib/auth';
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export const runtime = 'edge';

// Defensive Convex client creation
const createConvexClient = () => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.warn("NEXT_PUBLIC_CONVEX_URL not found, using placeholder");
    return new ConvexHttpClient("https://placeholder.convex.cloud");
  }
  return new ConvexHttpClient(convexUrl);
};

const convex = createConvexClient();

export async function POST(req: Request) {
  try {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { chatId, content, role } = await req.json();
      headers: req.headers
    // Removed stray closing brace and duplicate session check.
    const isValidConvexId = chatId && !chatId.includes('-') && chatId.length > 10;
    
    if (!isValidConvexId) {
      return new Response('Invalid chat ID format', { status: 400 });
    }

    // Save the message to Convex
    await convex.mutation(api.chats.addMessage, {
      chatId,
      content,
      role
    });

    return new Response('Message saved', { status: 200 });

  } catch (error) {
    console.error('Error saving message:', error);
    return new Response('Failed to save message', { status: 500 });
  }
} 