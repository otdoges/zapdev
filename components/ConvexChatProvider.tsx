"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useConvexUser } from "@/lib/actions";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

// Define the context shape
type ConvexChatContextType = {
  userId: Id<"users"> | null;
  chatId: Id<"chats"> | null;
  messages: any[] | undefined;
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  isThinking: boolean;
  currentResponse: string;
};

// Create context with default values
const ConvexChatContext = createContext<ConvexChatContextType>({
  userId: null,
  chatId: null,
  messages: undefined,
  sendMessage: async () => {},
  isLoading: true,
  isThinking: false,
  currentResponse: "",
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
  const userId = useConvexUser();
  const [currentChatId, setCurrentChatId] = useState<Id<"chats"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");

  // Convex mutations and queries
  const createChatMutation = useMutation(api.chats.createChat);
  const addMessageMutation = useMutation(api.chats.addMessage);
  
  // Query for messages if we have a chat ID
  const messages = useQuery(
    api.chats.getMessagesByChatId,
    currentChatId ? { chatId: currentChatId } : "skip"
  );

  // Create a new chat or load existing one
  useEffect(() => {
    const initializeChat = async () => {
      if (!userId) return;
      
      // If we have a chatId from props, validate it's a proper Convex ID
      if (chatId && !chatId.includes('-') && chatId.length > 10) {
        // It's a valid Convex ID format
        setCurrentChatId(chatId as Id<"chats">);
        setIsLoading(false);
        return;
      }
      
      // Otherwise, create a new chat
      try {
        const newChatId = await createChatMutation({
          userId,
          title: "New Chat",
        });
        setCurrentChatId(newChatId);
      } catch (error) {
        console.error("Failed to create chat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      initializeChat();
    }
  }, [userId, chatId, createChatMutation]);

  // Function to send a message with real-time AI response
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setIsThinking(true);
    setCurrentResponse("");
    
    try {
      // Get chat history for context
      const chatHistory = messages || [];
      const historyForAPI = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
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
          chatId: currentChatId,
          modelId: "deepseek/deepseek-chat:free", // Default model
          useMultipleModels: false
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
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          setCurrentResponse(fullResponse);
        }

        // Get the updated chat ID from headers if it was created
        const newChatId = response.headers.get('X-Chat-ID');
        if (newChatId && newChatId !== currentChatId) {
          setCurrentChatId(newChatId as Id<"chats">);
        }
      }
      
    } catch (error) {
      console.error("Failed to send message:", error);
      setCurrentResponse("Sorry, I encountered an error. Please try again.");
    } finally {
      setIsThinking(false);
      // Clear the current response after a brief delay to let the UI update
      setTimeout(() => setCurrentResponse(""), 100);
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
      }}
    >
      {children}
    </ConvexChatContext.Provider>
  );
} 