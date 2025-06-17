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
};

// Create context with default values
const ConvexChatContext = createContext<ConvexChatContextType>({
  userId: null,
  chatId: null,
  messages: undefined,
  sendMessage: async () => {},
  isLoading: true,
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

  // Function to send a message
  const sendMessage = async (content: string) => {
    if (!currentChatId || !content.trim()) return;
    
    try {
      await addMessageMutation({
        chatId: currentChatId,
        content,
        role: "user",
      });
      
      // Here you would typically trigger an AI response
      // For demo, let's just add an echo response after a short delay
      setTimeout(async () => {
        await addMessageMutation({
          chatId: currentChatId,
          content: `Echo: ${content}`,
          role: "assistant",
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to send message:", error);
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
      }}
    >
      {children}
    </ConvexChatContext.Provider>
  );
} 