import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { streamAIResponse, generateChatTitleFromMessages, generateAIResponse } from '@/lib/ai';
import { generateDiagramResponse, generateUpdatedDiagram } from '@/lib/diagram-ai';
import { executeCode, startSandbox } from '@/lib/sandbox';
import { useAuth } from '@/hooks/useAuth';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { toast } from 'sonner';

// Import extracted components
import { ChatSidebar } from './chat/ChatSidebar';
import { EnhancedChatMessage } from './chat/EnhancedChatMessage';
import { ChatInput } from './chat/ChatInput';
import { WelcomeScreen } from './chat/WelcomeScreen';
import { ErrorBoundary } from './ErrorBoundary';
import GitHubIntegration from './GitHubIntegration';
import DiagramMessageComponent from './DiagramMessageComponent';

// Import utilities
import { validateInput, MAX_MESSAGE_LENGTH } from '@/utils/security';
import { throttle, debounce } from '@/utils/performance';

// Import additional required modules
import { searchWithBrave, type BraveSearchResult } from '@/lib/search-service';
import type { WebsiteAnalysis } from '@/lib/firecrawl';
import type { GitHubRepo } from '@/lib/github-service';
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
    diagramData?: {
      type: 'mermaid' | 'flowchart' | 'sequence' | 'gantt';
      diagramText: string;
      isApproved?: boolean;
      userFeedback?: string;
      version: number;
    };
  };
}

interface ConvexChat {
  _id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

interface CodeBlock {
  id: string;
  language: 'python' | 'javascript';
  code: string;
  executed: boolean;
  result?: string;
}

const EnhancedChatInterface: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { getToken } = useClerkAuth();
  const { getSubscription } = useUsageTracking();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);

  // Enhanced UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<BraveSearchResult[]>([]);
  const [isSubmittingDiagram, setIsSubmittingDiagram] = useState(false);
  
  // GitHub Integration state
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [githubContext, setGithubContext] = useState<string>('');

  // Code execution
  const [codeBlocks, setCodeBlocks] = useState<CodeBlock[]>([]);
  const [sandboxReady, setSandboxReady] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Convex queries and mutations
  const chats = useQuery(api.chats.getUserChats, user ? { userId: user.id } : 'skip');
  const messages = useQuery(api.messages.getChatMessages, selectedChatId ? { chatId: selectedChatId as Id<'chats'> } : 'skip');
  const createChatMutation = useMutation(api.chats.createChat);
  const createMessageMutation = useMutation(api.messages.createMessage);
  const updateMessageMutation = useMutation(api.messages.updateMessage);
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
        userId: user.id,
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
          userId: user.id,
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
      const subscription = await getSubscription();
      const aiResponse = await streamAIResponse(userInput, [], subscription?.tier || 'free');
      
      // Create assistant message
      await createMessageMutation({
        chatId: currentChatId as Id<'chats'>,
        content: aiResponse.content,
        role: 'assistant',
        metadata: {
          model: aiResponse.model,
          tokens: aiResponse.usage?.total_tokens,
          cost: aiResponse.cost
        }
      });

      // Auto-generate chat title if first message
      if (messages?.length === 0) {
        const title = await generateChatTitleFromMessages([
          { content: userInput, role: 'user' },
          { content: aiResponse.content, role: 'assistant' }
        ]);
        // Update chat title (would need a mutation for this)
      }

    } catch (error) {
      logger.error('Chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, user, selectedChatId, messages, createChatMutation, createMessageMutation, getSubscription]);

  // GitHub integration handlers
  const handleRepoSelected = useCallback((repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setGithubContext(`Working with repository: ${repo.full_name}`);
  }, []);

  const handlePullRequestCreated = useCallback((prUrl: string) => {
    toast.success(`Pull request created: ${prUrl}`);
  }, []);

  // Diagram handlers
  const handleApproveDiagram = useCallback(async (messageId: string) => {
    setIsSubmittingDiagram(true);
    try {
      const existingMessage = messages?.find(m => m._id === messageId);
      if (!existingMessage) throw new Error('Message not found');
      
      await updateMessageMutation({
        messageId: messageId as Id<'messages'>,
        content: existingMessage.content,
        metadata: {
          ...existingMessage.metadata,
          diagramData: existingMessage.metadata?.diagramData ? {
            ...existingMessage.metadata.diagramData,
            isApproved: true,
          } : undefined
        }
      });
      
      toast.success('Diagram approved! You can proceed with implementation.');
    } catch (error) {
      logger.error('Failed to approve diagram:', error);
      toast.error('Failed to approve diagram. Please try again.');
    } finally {
      setIsSubmittingDiagram(false);
    }
  }, [messages, updateMessageMutation]);

  const handleRequestDiagramChanges = useCallback(async (messageId: string, feedback: string) => {
    setIsSubmittingDiagram(true);
    try {
      const message = messages?.find(m => m._id === messageId);
      if (!message?.metadata?.diagramData) {
        throw new Error('No diagram data found');
      }

      const updatedDiagram = await generateUpdatedDiagram(
        message.metadata.diagramData.diagramText,
        feedback
      );
      
      await updateMessageMutation({
        messageId: messageId as Id<'messages'>,
        content: message.content,
        metadata: {
          ...message.metadata,
          diagramData: {
            ...message.metadata.diagramData,
            diagramText: updatedDiagram.diagramText,
            userFeedback: feedback,
            version: (message.metadata.diagramData.version || 0) + 1
          }
        }
      });
      
      toast.success('Diagram updated successfully!');
    } catch (error) {
      logger.error('Failed to update diagram:', error);
      toast.error('Failed to update diagram. Please try again.');
    } finally {
      setIsSubmittingDiagram(false);
    }
  }, [messages, updateMessageMutation]);

  // Optimized auto-scroll to bottom
  useEffect(() => {
    const element = messagesEndRef.current;
    if (element) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages?.length]); // Only trigger on message count change, not content

  // Initialize sandbox with cleanup
  useEffect(() => {
    let isMounted = true;
    const initSandbox = async () => {
      try {
        await startSandbox();
        if (isMounted) {
          setSandboxReady(true);
        }
      } catch (error) {
        logger.warn('Sandbox initialization failed:', error);
      }
    };
    initSandbox();
    return () => {
      isMounted = false;
    };
  }, []);

  // Memoized message list to prevent unnecessary re-renders
  const memoizedMessages = useMemo(() => {
    return messages || [];
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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950/20 to-gray-950 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <AnimatePresence mode="wait">
          {!selectedChatId ? (
            <WelcomeScreen 
              onStartNewChat={startNewChat}
              input={input}
              setInput={setInput}
              textareaRef={textareaRef}
              handleSubmit={handleSubmit}
              isTyping={isTyping}
              isSearchOpen={isSearchOpen}
              setIsSearchOpen={setIsSearchOpen}
            />
          ) : (
            <motion.div 
              key="split"
              className="flex-1 flex"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <ChatSidebar
                sidebarExpanded={sidebarExpanded}
                setSidebarExpanded={setSidebarExpanded}
                chats={chats || []}
                selectedChatId={selectedChatId}
                startNewChat={startNewChat}
                selectChat={selectChat}
                deleteChat={deleteChat}
                formatTimestamp={formatTimestamp}
                user={user}
              />

              {/* Main chat area */}
              <div className="flex-1 flex flex-col relative">
                {/* Messages area */}
                <ScrollArea className="flex-1 custom-scrollbar">
                  <div className="p-6 space-y-6 max-w-4xl mx-auto">
                    {memoizedMessages.map((message, index) => {
                      const isUser = message.role === 'user';
                      const isFirstInGroup = index === 0 || memoizedMessages[index - 1].role !== message.role;

                      return (
                        <EnhancedChatMessage
                          key={message._id}
                          message={message}
                          isUser={isUser}
                          isFirstInGroup={isFirstInGroup}
                          formatTimestamp={formatTimestamp}
                          copyToClipboard={async (text: string, messageId: string) => {
                            await navigator.clipboard.writeText(text);
                            setCopiedMessage(messageId);
                            setTimeout(() => setCopiedMessage(null), 2000);
                            toast.success('Message copied to clipboard!');
                          }}
                          copiedMessage={copiedMessage}
                          onApproveDiagram={handleApproveDiagram}
                          onRequestDiagramChanges={handleRequestDiagramChanges}
                          isSubmittingDiagram={isSubmittingDiagram}
                        />
                      );
                    })}
                    
                    {typingIndicator}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input area */}
                <ChatInput
                  input={input}
                  setInput={setInput}
                  textareaRef={textareaRef}
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
                            } catch (error) {
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedChatInterface;