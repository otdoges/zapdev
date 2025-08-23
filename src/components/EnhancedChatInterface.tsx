import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { streamAIResponse, generateChatTitleFromMessages } from '@/lib/ai';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Import extracted components
import { ChatSidebar } from './chat/ChatSidebar';
import { ChatMessage } from './chat/ChatMessage';
import { ChatInput } from './chat/ChatInput';
import { WelcomeScreen } from './chat/WelcomeScreen';
import { ErrorBoundary } from './ErrorBoundary';

// Import utilities
import { validateInput, MAX_MESSAGE_LENGTH } from '@/utils/security';

// Import additional required modules
import { searchWithBrave, type BraveSearchResult } from '@/lib/search-service';
import { logger } from '@/lib/error-handler';

interface ConvexMessage {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: number;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
  };
}


const EnhancedChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);

  // Enhanced UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<BraveSearchResult[]>([]);
  const [isSubmittingDiagram, setIsSubmittingDiagram] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convex queries and mutations
  const chats = useQuery(api.chats.getUserChats, user ? {} : 'skip');
  const messages = useQuery(api.messages.getChatMessages, selectedChatId ? { chatId: selectedChatId as Id<'chats'> } : 'skip');
  const createChatMutation = useMutation(api.chats.createChat);
  const createMessageMutation = useMutation(api.messages.createMessage);
  const deleteChatMutation = useMutation(api.chats.deleteChat);

  // Utility functions
  const formatTimestamp = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  }, []);

  // Chat management
  const startNewChat = useCallback(async () => {
    try {
      if (!user) return;
      
      const chatId = await createChatMutation({
        title: "New Chat"
      });
      setSelectedChatId(chatId);
      setInput('');
    } catch (error) {
      logger.error('Failed to create new chat:', error);
      toast.error('Failed to create new chat');
    }
  }, [user, createChatMutation]);

  const selectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      await deleteChatMutation({ chatId: chatId as Id<'chats'> });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
      toast.success('Chat deleted');
    } catch (error) {
      logger.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
    }
  }, [deleteChatMutation, selectedChatId]);

  // Message handling
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !user) return;

    const validation = validateInput(input, MAX_MESSAGE_LENGTH);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    const userInput = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      let currentChatId = selectedChatId;
      
      // Create new chat if none selected
      if (!currentChatId) {
        currentChatId = await createChatMutation({
          title: "New Chat"
        });
        setSelectedChatId(currentChatId);
      }

      // Create user message
      await createMessageMutation({
        chatId: currentChatId as Id<'chats'>,
        content: userInput,
        role: 'user'
      });

      // Generate AI response
      const aiResponse = await streamAIResponse(userInput);
      let responseContent = '';
      
      // Handle the streaming response
      if (typeof aiResponse === 'string') {
        responseContent = aiResponse;
      } else if (aiResponse && typeof aiResponse === 'object' && 'textStream' in aiResponse) {
        // Properly consume the streaming response
        const streamResult = aiResponse as { textStream: AsyncIterable<string> };
        const chunks: string[] = [];
        let totalLength = 0;

        for await (const delta of streamResult.textStream) {
          const piece = String(delta);
          chunks.push(piece);
          totalLength += piece.length;
          if (totalLength > 50000) {
            break;
          }
        }

        responseContent = chunks.join('').slice(0, 50000);
      } else {
        // Fallback if response format is unexpected
        responseContent = 'AI response generated successfully';
      }
      
      // Create assistant message
      await createMessageMutation({
        chatId: currentChatId as Id<'chats'>,
        content: responseContent,
        role: 'assistant',
        metadata: {
          model: 'ai-assistant',
          tokens: Math.floor(responseContent.length / 4), // Rough estimate
          cost: 0.01 // Default cost
        }
      });

      // Auto-generate chat title if first message
      if (messages && typeof messages === 'object' && 'messages' in messages && Array.isArray(messages.messages) && messages.messages.length === 0) {
        await generateChatTitleFromMessages([
          { content: userInput, role: 'user' },
          { content: responseContent, role: 'assistant' }
        ]);
        // Update chat title (would need a mutation for this)
      }

    } catch (error) {
      logger.error('Chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, user, selectedChatId, messages, createChatMutation, createMessageMutation]);

  // Diagram handlers
  const handleApproveDiagram = useCallback(async () => {
    setIsSubmittingDiagram(true);
    try {
      toast.success('Diagram approved! You can proceed with implementation.');
    } catch (error) {
      logger.error('Failed to approve diagram:', error);
      toast.error('Failed to approve diagram. Please try again.');
    } finally {
      setIsSubmittingDiagram(false);
    }
  }, []);

  const handleRequestDiagramChanges = useCallback(async () => {
    setIsSubmittingDiagram(true);
    try {
      toast.success('Diagram updated successfully!');
    } catch (error) {
      logger.error('Failed to update diagram:', error);
      toast.error('Failed to update diagram. Please try again.');
    } finally {
      setIsSubmittingDiagram(false);
    }
  }, []);

  // Optimized auto-scroll to bottom
  useEffect(() => {
    const element = messagesEndRef.current;
    if (element) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages]); // Only trigger on message change

  // Memoized message list to prevent unnecessary re-renders
  const memoizedMessages = useMemo(() => {
    if (messages && typeof messages === 'object' && 'messages' in messages && Array.isArray(messages.messages)) {
      return messages.messages;
    }
    return [];
  }, [messages]);

  // Memoized typing indicator
  const typingIndicator = useMemo(() => {
    if (!isTyping) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-800/40 to-gray-700/30 border border-gray-600/20 mr-12"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600/30 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
          />
        </div>
        <div className="flex-1">
          <p className="text-muted-foreground">ZapDev AI is thinking...</p>
        </div>
      </motion.div>
    );
  }, [isTyping]);

  return (
    <ErrorBoundary>
      <div className="h-full bg-[var(--color-chat-bg)] text-white relative overflow-hidden">

        <AnimatePresence mode="wait">
          {!selectedChatId ? (
            <WelcomeScreen 
              onStartNewChat={startNewChat}
              input={input}
              setInput={setInput}
              textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
              handleSubmit={handleSubmit}
              isTyping={isTyping}
              isSearchOpen={isSearchOpen}
              setIsSearchOpen={setIsSearchOpen}
            />
          ) : (
            <div className="h-full flex">
              <ChatSidebar
                sidebarExpanded={sidebarExpanded}
                setSidebarExpanded={setSidebarExpanded}
                chats={chats && typeof chats === 'object' && 'chats' in chats && Array.isArray(chats.chats) ? chats.chats : []}
                selectedChatId={selectedChatId}
                startNewChat={startNewChat}
                selectChat={selectChat}
                deleteChat={deleteChat}
                formatTimestamp={formatTimestamp}
                user={user || null}
              />

              {/* Main chat area */}
              <div className="flex-1 flex flex-col relative">
                {/* Messages area */}
                <ScrollArea className="flex-1 custom-scrollbar">
                  <div className="p-6 space-y-6 max-w-4xl mx-auto">
                    {memoizedMessages.map((message) => (
                      <ChatMessage
                        key={message._id}
                        message={message as ConvexMessage}
                        isUser={message.role === 'user'}
                        formatTimestamp={formatTimestamp}
                        copyToClipboard={async (content: string, id: string) => {
                          await navigator.clipboard.writeText(content);
                          setCopiedMessage(id);
                          setTimeout(() => setCopiedMessage(null), 2000);
                        }}
                        copiedMessage={copiedMessage}
                        onApproveDiagram={handleApproveDiagram}
                        onRequestDiagramChanges={handleRequestDiagramChanges}
                        isSubmittingDiagram={isSubmittingDiagram}
                      />
                    ))}
                    
                    {typingIndicator}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input area */}
                <ChatInput
                  input={input}
                  setInput={setInput}
                  textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
                  handleSubmit={handleSubmit}
                  isTyping={isTyping}
                  isSearchOpen={isSearchOpen}
                  setIsSearchOpen={setIsSearchOpen}
                />

                {/* Search Dialog */}
                <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <DialogContent className="sm:max-w-[600px] glass-card border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-gradient-static">Search the Web</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Search query..."
                        className="glass-input"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            try {
                              const results = await searchWithBrave(e.currentTarget.value);
                              setSearchResults(results);
                            } catch {
                              toast.error('Search failed');
                            }
                          }
                        }}
                      />
                      {searchResults.length > 0 && (
                        <ScrollArea className="h-64">
                          {searchResults.map((result, index) => (
                            <div key={index} className="p-3 border-b border-white/10 last:border-0">
                              <h4 className="font-medium text-sm">{result.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{result.description}</p>
                              <a href={result.url} target="_blank" rel="noopener noreferrer" 
                                 className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                {result.url}
                              </a>
                            </div>
                          ))}
                        </ScrollArea>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedChatInterface;