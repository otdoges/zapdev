import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createChat, addMessage, requireAuth } from '@/lib/supabase-operations';
import { openrouterProvider } from '@/lib/openrouter';
import { streamText, convertToCoreMessages } from 'ai';
import { systemPrompt } from '@/lib/system-prompt';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await requireAuth();
    const { messages, chatId, modelId } = await request.json();

    let finalChatId = chatId;

    // Validate if it's a proper chat ID format
    const isValidChatId = chatId && chatId.length > 10;

    if (!isValidChatId) {
      // Create a new chat in Supabase
      try {
        const userMessage = messages[messages.length - 1]?.content || 'New Chat';
        const title = userMessage.length > 50 
          ? userMessage.substring(0, 50) + '...' 
          : userMessage;

        const newChat = await createChat(user.id, title);
        finalChatId = newChat.id;
      } catch (error) {
        console.error('Failed to create chat in Supabase:', error);
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
      }
    }

    // Save user message to Supabase if we have a valid chat ID
    const userMessage = messages[messages.length - 1];
    if (userMessage && finalChatId) {
      try {
        await addMessage(finalChatId, 'user', userMessage.content);
      } catch (error) {
        console.error('Failed to save user message:', error);
      }
    }

    const coreMessages = convertToCoreMessages(messages);

    // Check for different types of requests
    const lastMessage = messages[messages.length - 1]?.content || '';
    const isTeamRequest = lastMessage.toLowerCase().includes('team') || 
                         lastMessage.toLowerCase().includes('coordinate') ||
                         lastMessage.toLowerCase().includes('collaborate');
    
    // Check for code building requests
    const isCodeRequest = /\b(build|create|make|generate|code|app|website|component|function)\b/i.test(lastMessage);
    const isFeatureRequest = /\b(add|implement|include|feature|button|form|page)\b/i.test(lastMessage);

    // Enhanced system prompt based on request type
    let enhancedSystemPrompt = systemPrompt;
    
    if (isCodeRequest || isFeatureRequest) {
      enhancedSystemPrompt = `You are ZapDev, an AI that BUILDS instead of explains. When users ask for code, features, or applications, you:

1. 🔨 Immediately start building the actual code
2. 🚀 Show action indicators like "Building..." "Creating..." "Adding..."  
3. ✅ Provide working, complete code solutions
4. 📱 Create responsive, modern interfaces with Tailwind CSS
5. 🎯 Focus on delivering results, not tutorials

NEVER say "Here's how you would..." or "You could do this by..." 
ALWAYS say "🔨 Building [feature]..." then provide the actual working code.

Use these action phrases:
- 🔨 Building your [component/app/feature]...
- ⚙️ Setting up the structure...
- 🎨 Adding styles and interactions...
- ✅ Complete! Here's your working [feature]:

Provide complete, runnable code with all imports and dependencies.`;
    }

    if (isTeamRequest) {
      enhancedSystemPrompt = `You are coordinating a team of AI specialists. Based on the user's request, create a response that simulates multiple AI experts working together. Include perspectives from different specialists like a frontend developer, backend developer, UX designer, and project manager. Make it conversational and collaborative.

When building projects, always trigger the WebContainer for live preview by including code blocks with complete, runnable applications.`;
    }

    // Always use streaming for consistent UI behavior
    const result = await streamText({
      model: openrouterProvider.chat(modelId || 'anthropic/claude-3.5-sonnet'),
      messages: [
        {
          role: 'system',
          content: enhancedSystemPrompt
        },
        ...coreMessages
      ],
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Save AI response to Supabase when streaming is complete
    let fullResponse = '';
    
    // Create a readable stream that also collects the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          
          // Save the complete AI response to Supabase when streaming is done
          if (finalChatId && fullResponse) {
            try {
              await addMessage(finalChatId, 'assistant', fullResponse);
            } catch (error) {
              console.error('Failed to save AI response:', error);
            }
          }
          
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Chat-ID': finalChatId || '',
    });

    // Add special headers for different request types
    if (isCodeRequest || isFeatureRequest) {
      headers.set('X-Build-Triggered', 'true');
    }
    
    if (isTeamRequest) {
      headers.set('X-AI-Team-Triggered', 'true');
    }

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      error: 'Failed to process chat message' 
    }, { status: 500 });
  }
} 