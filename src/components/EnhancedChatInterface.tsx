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
import { SubscriptionUpgradeModal } from './SubscriptionUpgradeModal';

// Import utilities
import { validateInput, MAX_MESSAGE_LENGTH, sanitizeText, validateResponse, MAX_RESPONSE_LENGTH } from '@/utils/security';

// Import additional required modules
import { searchWithBrave, type BraveSearchResult } from '@/lib/search-service';
import { logger } from '@/lib/error-handler';

interface ConvexMessage {
  _id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: number;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
  };
}

const EnhancedChatInterface: React.FC = () => {
  // Hook declarations (must be at the top)
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<BraveSearchResult[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convex hooks (always called)
  const chats = useQuery(
    api.chats.getUserChats,
    user ? {} : 'skip'
  );
  const messages = useQuery(
    api.messages.getChatMessages,
    selectedChatId
      ? { chatId: selectedChatId as Id<'chats'> }
      : 'skip'
  );
  const createChatMutation = useMutation(api.chats.createChat);
  const createMessageMutation = useMutation(api.messages.createMessage);
  const deleteChatMutation = useMutation(api.chats.deleteChat);

  // All callbacks and effects
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
      
      // Check if it's a subscription limit error
      if (error instanceof Error && error.message.includes('Free plan limit reached')) {
        setShowUpgradeModal(true);
      } else {
        toast.error('Failed to create new chat');
      }
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

  // Enhanced message handling with comprehensive security
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !user) return;

    // Step 1: Validate input
    const validation = validateInput(input, MAX_MESSAGE_LENGTH);
    if (!validation.isValid) {
      logger.error('Input validation failed:', validation.error);
      toast.error(validation.error);
      return;
    }

    // Step 2: Sanitize input
    const sanitizedInput = sanitizeText(input.trim());
    
    // Step 3: Enforce length by truncating to MAX_MESSAGE_LENGTH
    const userInput = sanitizedInput.length > MAX_MESSAGE_LENGTH 
      ? sanitizedInput.substring(0, MAX_MESSAGE_LENGTH)
      : sanitizedInput;
    
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

      // Create user message with sanitized input
      await createMessageMutation({
        chatId: currentChatId as Id<'chats'>,
        content: userInput,
        role: 'user'
      });

      // Generate AI response with sanitized input
      const aiResponse = await streamAIResponse(userInput);
      let responseContent = '';
      
      // Handle the streaming response with enhanced security
      if (typeof aiResponse === 'string') {
        // Direct string response
        responseContent = (aiResponse as string).trim();
      } else if (aiResponse && typeof aiResponse === 'object' && 'textStream' in aiResponse) {
        // Handle streaming response with incremental length tracking
        let cumulativeLength = 0;
        const chunks: string[] = [];
        
        try {
          const streamResponse = aiResponse as { textStream: AsyncIterable<string> };
          for await (const delta of streamResponse.textStream) {
            const piece = String(delta || '').trim();
            
            // Skip empty pieces
            if (!piece) continue;
            
            // Check if adding this piece would exceed the limit
            if (cumulativeLength + piece.length > MAX_RESPONSE_LENGTH) {
              // Take only what fits within the limit
              const remainingSpace = MAX_RESPONSE_LENGTH - cumulativeLength;
              if (remainingSpace > 0) {
                chunks.push(piece.substring(0, remainingSpace));
                cumulativeLength += remainingSpace;
              }
              logger.warn('AI response truncated due to length limit');
              break;
            }
            
            chunks.push(piece);
            cumulativeLength += piece.length;
          }
          
          responseContent = chunks.join('').trim();
        } catch (streamError) {
          logger.error('Error reading AI stream:', streamError);
          responseContent = 'AI response generated with streaming issues';
        }
      } else {
        // Fallback for unexpected response format
        logger.warn('Unexpected AI response format:', typeof aiResponse);
        responseContent = 'AI response generated successfully';
      }
      
      // Step 4: Validate the assembled response
      const responseValidation = validateResponse(responseContent);
      if (!responseValidation.isValid) {
        logger.error('AI response validation failed:', {
          error: responseValidation.error,
          responseLength: responseContent.length,
          responsePreview: responseContent.substring(0, 100)
        });
        responseContent = 'AI response contained invalid content. Please try rephrasing your question.';
      }
      
      // Ensure we have valid content
      if (!responseContent || responseContent.trim().length === 0) {
        responseContent = 'AI response was empty. Please try again.';
      }
      
      // Final validation before database storage
      if (typeof responseContent !== 'string') {
        logger.error('Invalid content type for message creation:', typeof responseContent);
        throw new Error('Invalid response content type');
      }
      
      if (responseContent.trim().length === 0) {
        logger.error('Empty response content for message creation');
        throw new Error('Empty response content');
      }
      
      await createMessageMutation({
        chatId: currentChatId as Id<'chats'>,
        content: responseContent,
        role: 'assistant',
        metadata: {
          model: 'ai-assistant',
          tokens: Math.ceil(responseContent.length / 4),
          cost: 0.01
        }
      });

      // Auto-generate chat title if first message
      if (messages && 'messages' in messages && messages.messages.length === 0) {
        await generateChatTitleFromMessages([
          { content: userInput, role: 'user' },
          { content: responseContent, role: 'assistant' }
        ]);
      }

    } catch (error) {
      logger.error('Chat error:', error);
      
      // Check if it's a subscription limit error
      if (error instanceof Error && error.message.includes('Free plan limit reached')) {
        setShowUpgradeModal(true);
      } else {
        toast.error('Failed to send message');
      
      // Create fallback assistant message if processing failed
      try {
        if (selectedChatId) {
          await createMessageMutation({
            chatId: selectedChatId as Id<'chats'>,
            content: 'I apologize, but I encountered an error processing your request. Please try again.',
            role: 'assistant',
            metadata: {
              model: 'error-fallback'
            }
          });
        }
      } catch (fallbackError) {
        logger.error('Failed to create fallback message:', fallbackError);
      }
      }
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, user, selectedChatId, messages, createChatMutation, createMessageMutation]);

  // Subscription upgrade handlers
  const handleUpgrade = useCallback(() => {
    setShowUpgradeModal(false);
    navigate('/pricing');
  }, [navigate]);

  const handleCloseUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
  }, []);

  // Effects and memoized values
  useEffect(() => {
    const element = messagesEndRef.current;
    if (element) {
      requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages]);

  const memoizedMessages = useMemo(() => {
    if (messages && 'messages' in messages) {
      return messages.messages || [];
    }
    return [];
  }, [messages]);

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

  // Early returns after all hooks
  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in required</h2>
          <p className="text-muted-foreground">
            Please sign in to access the chat interface
          </p>
        </div>
      </div>
    );
  }

  // Main render
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
                chats={chats && 'chats' in chats ? chats.chats : []}
                selectedChatId={selectedChatId}
                startNewChat={startNewChat}
                selectChat={selectChat}
                deleteChat={deleteChat}
                formatTimestamp={formatTimestamp}
                user={user || null}
              />

              <div className="flex-1 flex flex-col relative">
                <ScrollArea className="flex-1 custom-scrollbar">
                  <div className="p-6 space-y-6 max-w-4xl mx-auto">
                    {memoizedMessages.map((message, index: number) => {
                      const convexMessage = message as ConvexMessage;
                      const prevMessage = index > 0 ? memoizedMessages[index - 1] as ConvexMessage : null;
                      const isFirstInGroup = !prevMessage || prevMessage.role !== convexMessage.role;
                      
                      return (
                        <ChatMessage
                          key={convexMessage._id}
                          message={{
                            ...convexMessage,
                            role: convexMessage.role as 'user' | 'assistant'
                          }}
                          user={user || null}
                          isUser={convexMessage.role === 'user'}
                          isFirstInGroup={isFirstInGroup}
                          formatTimestamp={formatTimestamp}
                          copiedMessage={copiedMessage}
                          copyToClipboard={async (content: string, id: string) => {
                            await navigator.clipboard.writeText(content);
                            setCopiedMessage(id);
                            setTimeout(() => setCopiedMessage(null), 2000);
                          }}
                        />
                      );
                    })}
                    
                    {typingIndicator}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <ChatInput
                  input={input}
                  setInput={setInput}
                  textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
                  handleSubmit={handleSubmit}
                  isTyping={isTyping}
                  isSearchOpen={isSearchOpen}
                  setIsSearchOpen={setIsSearchOpen}
                />

                <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <DialogContent className="sm:max-w-[600px] glass-card border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-gradient-static">Search the Web</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Search query..."
                        className="glass-input"
                        onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') {
                            const searchQuery = e.currentTarget.value.trim();
                            const validation = validateInput(searchQuery, 200);
                            if (!validation.isValid) {
                              toast.error(validation.error);
                              return;
                            }
                            try {
                              const results = await searchWithBrave(searchQuery);
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
        
        {/* Subscription Upgrade Modal */}
        <SubscriptionUpgradeModal
          isOpen={showUpgradeModal}
          onClose={handleCloseUpgradeModal}
          onUpgrade={handleUpgrade}
          title="Chat Limit Reached"
          message="You've reached your free plan limit of 5 chats. Upgrade to Pro to create unlimited chats and access advanced features."
        />
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedChatInterface;