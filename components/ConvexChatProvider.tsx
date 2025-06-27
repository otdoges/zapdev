'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/convex/_generated/api';
import { useAuthUser } from '@/lib/actions';
import { useMutation, useQuery } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

// Define the context shape
type ConvexChatContextType = {
  userId: Id<'users'> | null;
  chatId: Id<'chats'> | null;
  messages: any[] | undefined;
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  isThinking: boolean;
  currentResponse: string;
  setCurrentChatId: (chatId: Id<'chats'> | null) => void;
  currentChat: any;
  regenerateLastMessage: () => Promise<void>;
  canRegenerate: boolean;
};

// Create context with default values
const ConvexChatContext = createContext<ConvexChatContextType>({
  userId: null,
  chatId: null,
  messages: undefined,
  sendMessage: async () => {},
  isLoading: true,
  isThinking: false,
  currentResponse: '',
  setCurrentChatId: () => {},
  currentChat: null,
  regenerateLastMessage: async () => {},
  canRegenerate: false,
});

// Hook to use the chat context
export const useConvexChat = () => useContext(ConvexChatContext);

// Provider component
export default function ConvexChatProvider({
  children,
  chatId,
}: {
  children: ReactNode;
  chatId?: string;
}) {
  const { user } = useAuthUser();
  const userId = user?.id as Id<'users'> | null;
  const [currentChatId, setCurrentChatId] = useState<Id<'chats'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  // Convex mutations and queries
  const createChatMutation = useMutation(api.chats.createChat);
  const addMessageMutation = useMutation(api.chats.addMessage);

  // Query for messages if we have a chat ID
  const messages = useQuery(
    api.chats.getMessagesByChatId,
    currentChatId ? { chatId: currentChatId } : 'skip'
  );

  // Query for current chat details
  const currentChat = useQuery(
    api.chats.getChatById,
    currentChatId ? { chatId: currentChatId } : 'skip'
  );

  // Function to regenerate last message
  const regenerateLastMessage = async () => {
    if (!messages || messages.length === 0) return;

    // Find the last user message
    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === 'user');
    if (lastUserMessage) {
      await sendMessage(lastUserMessage.content);
    }
  };

  // Check if we can regenerate (has messages and not currently thinking)
  const canRegenerate = Boolean(messages && messages.length > 0 && !isThinking);

  // Load existing chat if chatId is provided
  useEffect(() => {
    if (chatId && !chatId.includes('-') && chatId.length > 10) {
      // It's a valid Convex ID format
      setCurrentChatId(chatId as Id<'chats'>);
    } else {
      // No valid chat ID, will create one when first message is sent
      setCurrentChatId(null);
    }
  }, [chatId]);

  // Function to send a message with real-time AI response
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    setIsThinking(true);
    setCurrentResponse('');

    try {
      let workingChatId = currentChatId;

      // Create chat if it doesn't exist yet
      if (!workingChatId && userId) {
        setIsLoading(true);
        try {
          const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
          workingChatId = await createChatMutation({
            userId,
            title,
          });
          setCurrentChatId(workingChatId);
        } catch (error) {
          errorLogger.error(ErrorCategory.GENERAL, 'Failed to create chat:', error);
          throw new Error('Failed to create chat');
        } finally {
          setIsLoading(false);
        }
      }

      // Get chat history for context
      const chatHistory = messages || [];
      const historyForAPI = chatHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the new user message to history
      historyForAPI.push({ role: 'user', content });

      // Send to API with streaming response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: historyForAPI,
          chatId: workingChatId,
          modelId: 'deepseek/deepseek-chat:free', // Default model
          useMultipleModels: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          setCurrentResponse(fullResponse);
        }

        // Get the updated chat ID from headers if it was created
        const newChatId = response.headers.get('X-Chat-ID');
        if (newChatId && newChatId !== workingChatId) {
          setCurrentChatId(newChatId as Id<'chats'>);
        }
      }
    } catch (error) {
      errorLogger.error(ErrorCategory.GENERAL, 'Failed to send message:', error);
      setCurrentResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsThinking(false);
      // Clear the current response after a brief delay to let the UI update
      setTimeout(() => setCurrentResponse(''), 100);
    }
  };

  return (
    <ConvexChatContext.Provider
      value={{
        userId,
        chatId: currentChatId,
        messages,
        sendMessage,
        isLoading,
        isThinking,
        currentResponse,
        setCurrentChatId,
        currentChat,
        regenerateLastMessage,
        canRegenerate,
      }}
    >
      {children}
    </ConvexChatContext.Provider>
  );
}
