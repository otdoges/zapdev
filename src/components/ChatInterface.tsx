import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SafeText } from '@/components/ui/SafeText';
import { 
  Send, 
  User, 
  Bot, 
  Copy, 
  Check, 
  Plus,
  MessageSquare,
  Trash2,
  Clock,
  Zap,
  Loader2,
  Search,
  Globe,
  ExternalLink,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { streamAIResponse, generateChatTitleFromMessages } from '@/lib/ai';
import { executeCode, startSandbox } from '@/lib/sandbox.ts';
import { useAuth } from '@/hooks/useAuth';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { E2BCodeExecution } from './E2BCodeExecution';
import AnimatedResultShowcase, { type ShowcaseExecutionResult } from './AnimatedResultShowcase';
import { braveSearchService, type BraveSearchResult } from '@/lib/search-service';
import { SmartPrompts } from './SmartPrompts.tsx';
import { LivePreview } from '@/components/LivePreview';
import { toast } from 'sonner';
import * as Sentry from '@sentry/react';



const { logger } = Sentry;

// Memoized Message Component to prevent unnecessary re-renders
const MessageComponent = memo(({ message, extractCodeBlocks, copyToClipboard, copiedMessage, formatTimestamp, getMessageContent }: {
  message: ConvexMessage;
  extractCodeBlocks: (content: string) => CodeBlock[];
  copyToClipboard: (text: string, messageId: string) => Promise<void>;
  copiedMessage: string | null;
  formatTimestamp: (timestamp: number) => string;
  getMessageContent: (message: ConvexMessage) => string;
}) => {
  const messageContent = getMessageContent(message);
  const codeBlocks = useMemo(() => extractCodeBlocks(messageContent), [messageContent, extractCodeBlocks]);
  
  return (
    <Card className={`rounded-xl transition-all duration-300 group-hover:shadow-2xl ${
      message.role === 'user'
        ? 'bg-gradient-to-br from-blue-500/10 to-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5'
        : 'bg-[#1A1A1A]/90 backdrop-blur-xl border border-gray-800/50 shadow-xl shadow-black/20'
    }`}>
      <CardContent className="p-5">
        <div className="text-sm leading-relaxed text-gray-100">
          <SafeText>{messageContent}</SafeText>
        </div>



        {message.role === 'assistant' && codeBlocks.map((block) => (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <E2BCodeExecution
              code={block.code}
              language={block.language}
              autoRun={block.language.toLowerCase() !== 'python'}
              onExecute={async (code, language) => {
                const result = await executeCode(code, language as 'python' | 'javascript');
                return {
                  success: result.success,
                  output: result.stdout,
                  error: result.error as string | undefined,
                  logs: result.stderr ? [result.stderr] : [],
                  executionTime: Date.now() % 1000,
                };
              }}
              showNextJsHint={block.language.toLowerCase() === 'javascript' || block.language.toLowerCase() === 'typescript'}
            />
          </motion.div>
        ))}

        {message.role === 'user' && codeBlocks.map((block) => (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <E2BCodeExecution
              code={block.code}
              language={block.language}
              autoRun={block.language.toLowerCase() !== 'python'}
              onExecute={async (code, language) => {
                const result = await executeCode(code, language as 'python' | 'javascript');
                return {
                  success: result.success,
                  output: result.stdout,
                  error: result.error as string | undefined,
                  logs: result.stderr ? [result.stderr] : [],
                  executionTime: Date.now() % 1000,
                };
              }}
              showNextJsHint={block.language.toLowerCase() === 'javascript' || block.language.toLowerCase() === 'typescript'}
            />
          </motion.div>
        ))}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <span className="text-xs opacity-70">
            {formatTimestamp(message.createdAt)}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-70 hover:opacity-100 transition-all"
            onClick={() => copyToClipboard(messageContent, message._id)}
          >
            {copiedMessage === message._id ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// Security constants for input validation
const MAX_MESSAGE_LENGTH = 10000;

// XSS protection: sanitize text input
const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>'"&]/g, (char) => {
      const chars: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#x27;',
        '"': '&quot;',
        '&': '&amp;'
      };
      // eslint-disable-next-line security/detect-object-injection
      return chars[char] || char;
    })
    .trim();
};

// Validate input length and content
const validateInput = (text: string, maxLength: number): { isValid: boolean; error?: string } => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Input cannot be empty' };
  }
  if (text.length > maxLength) {
    return { isValid: false, error: `Input too long. Maximum ${maxLength} characters allowed` };
  }
  // Check for potentially malicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return { isValid: false, error: 'Invalid content detected' };
    }
  }
  
  return { isValid: true };
};

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


interface CodeBlock {
  id: string;
  language: 'python' | 'javascript';
  code: string;
  executed: boolean;
  result?: string;
}

const ChatInterface: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { getSubscription } = useUsageTracking();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const [showcaseExecutions, setShowcaseExecutions] = useState<ShowcaseExecutionResult[]>([]);
  // Persistent right-side preview state
  const [previewCode, setPreviewCode] = useState<string>('');
  const [previewLanguage, setPreviewLanguage] = useState<string>('javascript');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);
  // Team Lead planning
  const [teamLeadPlan, setTeamLeadPlan] = useState<string | null>(null);
  // Search and website cloning state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [searchResults, setSearchResults] = useState<BraveSearchResult[]>([]);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showSmartPrompts, setShowSmartPrompts] = useState(true); // Show smart prompts initially
  
  
  const messagesEndRef = useRef<HTMLDivElement>(null);


  // Convex queries and mutations
  const chatsData = useQuery(api.chats.getUserChats, {});
  const messagesData = useQuery<typeof api.messages.getChatMessages>(
    api.messages.getChatMessages,
    selectedChatId
      ? { chatId: selectedChatId as Id<"chats"> }
      : ("skip" as const)
  );

  // Memoize normalized results to prevent useEffect dependencies from changing on every render
  const chats = React.useMemo(() => {
    const chatsArray = chatsData?.chats;
    return Array.isArray(chatsArray) ? chatsArray : [];
  }, [chatsData?.chats]);
  const messages = React.useMemo(() => {
    const messagesArray = messagesData?.messages;
    return Array.isArray(messagesArray) ? messagesArray : [];
  }, [messagesData?.messages]);
  const createChat = useMutation(api.chats.createChat);
  const updateChat = useMutation(api.chats.updateChat);
  const createMessage = useMutation(api.messages.createMessage);
  const deleteChat = useMutation(api.chats.deleteChat);

  // Memoized scroll function to prevent unnecessary calls
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Throttled scroll effect to improve performance
  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, scrollToBottom]);

  // Pre-warm E2B sandbox so execution feels instant and actually tries to connect
  useEffect(() => {
    startSandbox().catch(() => {
      // Ignore; E2B errors will be surfaced by execution components
    });
  }, []);




  // Auto-select first chat if none selected
  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0]._id);
    }
  }, [chats, selectedChatId]);

  // Helper function to get display content for a message
  const getMessageContent = (message: ConvexMessage): string => {
    return message.content;
  };

  // Memoized code block extraction to prevent unnecessary recalculations
  const extractCodeBlocks = useCallback((content: string): CodeBlock[] => {
    const source = (content || '').slice(0, 60000);
    const blocks: CodeBlock[] = [];
    const maxBlocks = 10;
    const maxScanTimeMs = 50;
    const startAt = Date.now();

    let scanIndex = 0;
    while (scanIndex < source.length && blocks.length < maxBlocks) {
      if (Date.now() - startAt > maxScanTimeMs) {
        break;
      }
      const fenceStart = source.indexOf('```', scanIndex);
      if (fenceStart === -1) break;
      const langLineEnd = source.indexOf('\n', fenceStart + 3);
      if (langLineEnd === -1) break;
      const langRaw = source.slice(fenceStart + 3, langLineEnd).trim().toLowerCase();
      const lang = langRaw === 'js' ? 'javascript' : langRaw;
      if (lang !== 'javascript' && lang !== 'python') {
        scanIndex = langLineEnd + 1;
        continue;
      }
      const fenceEnd = source.indexOf('```', langLineEnd + 1);
      if (fenceEnd === -1) break;
      const code = source.slice(langLineEnd + 1, fenceEnd).trim();
      if (code.length > 0 && code.length < 10000) {
        blocks.push({
          id: `code-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          language: lang as 'python' | 'javascript',
          code,
          executed: false,
        });
      }
      scanIndex = fenceEnd + 3;
    }

    return blocks;
  }, []);


  const handleCreateChat = async () => {
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Create New Chat",
      },
      async (span) => {
        try {
          // Create chat with a temporary placeholder, then rename via AI
          const tempTitle = 'New chat';
          span.setAttribute("chat_title", tempTitle);
          logger.info("Creating new chat", { title: tempTitle });
          const chatId = await createChat({ title: tempTitle });
          
          setSelectedChatId(chatId);
          setIsNewChatOpen(false);
          
          span.setAttribute("chat_id", chatId);
          logger.info("Chat created successfully", { chatId, title: tempTitle });
          toast.success('New chat created!');

          // Generate AI chat title using gemma2-9b-it based on initial context
          try {
            const messagesForTitle = [{ role: 'user' as const, content: input.trim() || 'General coding help' }];
            const aiTitle = await generateChatTitleFromMessages(messagesForTitle);
            if (aiTitle && aiTitle !== tempTitle) {
              await updateChat({ chatId: chatId as Parameters<typeof updateChat>[0]['chatId'], title: aiTitle });
            }
          } catch (err) {
            console.debug('Title generation skipped', err);
          }
        } catch (error) {
          logger.error("Error creating chat", { 
            error: error instanceof Error ? error.message : String(error),
            title: 'New chat'
          });
          
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Handle specific error types with helpful messages
          if (errorMessage.includes('Free plan limit reached')) {
            toast.error('Free plan limit reached! You can create up to 5 chats. Upgrade to Pro for unlimited chats.');
          } else if (errorMessage.includes('Rate limit exceeded')) {
            toast.error('Please wait a moment before creating another chat.');
          } else {
            Sentry.captureException(error);
            toast.error('Failed to create chat');
          }
        }
      }
    );
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat({ chatId: chatId as Parameters<typeof deleteChat>[0]['chatId'] });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !selectedChatId) return;

    Sentry.startSpan(
      {
        op: "ui.submit",
        name: "Send Chat Message",
      },
      async (span) => {
        const validation = validateInput(input, MAX_MESSAGE_LENGTH);
        if (!validation.isValid) {
          toast.error(validation.error);
          span.setAttribute("validation_error", validation.error);
          return;
        }

        const userContent = sanitizeText(input.trim());
        span.setAttribute("message_length", userContent.length);
        span.setAttribute("chat_id", selectedChatId);
        
        setInput('');
        setIsTyping(true);
        setSessionStarted(true);

        try {
          logger.info("Sending chat message", { 
            messageLength: userContent.length,
            chatId: selectedChatId
          });
          
          // Prepare message data
          const messageData = {
            chatId: selectedChatId as Parameters<typeof createMessage>[0]['chatId'],
            content: userContent,
            role: 'user' as const,
          };
          
          // Create user message
          await createMessage(messageData);

          // Refresh user subscription data after usage
          try {
            await getSubscription();
          } catch (error) {
            console.debug('Failed to refresh subscription data:', error);
          }

          // Auto-run user code blocks via E2B (JS/TS only per project preference)
          const userBlocks = extractCodeBlocks(userContent);
          if (userBlocks.length > 0) {
            // Respect preference to avoid executing Python automatically [[memory:4361423]]
            const runnableBlocks = userBlocks.filter(b => b.language !== 'python');
            const skippedPython = userBlocks.length !== runnableBlocks.length;
            if (skippedPython) {
              toast.info('Python blocks detected; auto-run is limited to JS/TS.');
            }

            // Set persistent preview to the first runnable JS/TS block
            const first = runnableBlocks[0];
            if (first) {
              setPreviewCode(first.code);
              setPreviewLanguage(first.language);
              setShowPreview(true);
            }

            setShowShowcase(true);
            setShowcaseExecutions([]);

            try {
              const results = await Promise.all(runnableBlocks.map(async (b) => {
                const res = await executeCode(b.code, b.language);
                return {
                  id: b.id,
                  language: b.language,
                  code: b.code,
                  success: res.success,
                  output: res.stdout,
                  error: typeof res.error === 'string' ? res.error : undefined,
                  logs: res.stderr ? [res.stderr] : [],
                } as ShowcaseExecutionResult;
              }));
              setShowcaseExecutions(results);
            } catch (execErr) {
              console.error('Auto-execution failed:', execErr);
            }
          }

          // Team Lead planning step before streaming
          try {
            const plan = 'Planning functionality temporarily disabled';
            setTeamLeadPlan(plan);
          } catch (planErr) {
            console.debug('Planning step skipped', planErr);
          }

          // Stream AI response (prepend search / website analysis context if present)
          const searchContext = searchResults.length > 0 ? (
            `\n\nSearch Context (top 5):\n` + searchResults.slice(0,5).map((r,i)=>`${i+1}. ${r.title} - ${r.url}\n${r.description}`).join('\n')
          ) : '';
          const websiteContext = '';
          const combined = userContent + searchContext + websiteContext;
          const streamResult = await streamAIResponse(combined) as { textStream: AsyncIterable<string> };
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

          const assistantContent = chunks.join('').slice(0, 50000);

          const sanitizedResponse = assistantContent; // already clamped above
          span.setAttribute("response_length", sanitizedResponse.length);

          // Extract assistant code blocks for preview
          const assistantBlocks = extractCodeBlocks(sanitizedResponse);
          const assistantRunnable = assistantBlocks.filter(b => b.language !== 'python');
          if (assistantRunnable[0]) {
            setPreviewCode(assistantRunnable[0].code);
            setPreviewLanguage(assistantRunnable[0].language);
            setShowPreview(true);
          }

          // Prepare assistant message data
          const assistantMessageData = {
            chatId: selectedChatId as Parameters<typeof createMessage>[0]['chatId'],
            content: sanitizedResponse,
            role: 'assistant' as const,
            metadata: {
              model: 'openai/gpt-oss-120b',
              tokens: Math.floor(sanitizedResponse.length / 4), // Rough estimate
            },
          };

          // Create assistant message
          await createMessage(assistantMessageData);

          // Refresh user subscription data after usage  
          try {
            await getSubscription();
          } catch (error) {
            console.debug('Failed to refresh subscription data:', error);
          }

          // Try AI title refinement after first exchange
          try {
            const msgs = [
              { role: 'user' as const, content: userContent },
              { role: 'assistant' as const, content: sanitizedResponse }
            ];
            const aiTitle = await generateChatTitleFromMessages(msgs);
            if (aiTitle) {
              await updateChat({ chatId: selectedChatId as Parameters<typeof updateChat>[0]['chatId'], title: aiTitle });
            }
          } catch (err) {
            console.debug('Title refinement skipped', err);
          }

          logger.info("Chat message processed successfully", { 
            responseLength: sanitizedResponse.length,
            tokens: Math.floor(sanitizedResponse.length / 4)
          });

        } catch (error) {
          logger.error("AI response error", { 
            error: error instanceof Error ? error.message : String(error),
            chatId: selectedChatId
          });
          Sentry.captureException(error);
          toast.error('Failed to get AI response');
        } finally {
          setIsTyping(false);
        }
      }
    );
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessage(messageId);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedMessage(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    try {
      logger.info('Performing search', { query: searchQuery.trim() });
      const results = await braveSearchService.search(searchQuery.trim(), {
        count: 10,
        safesearch: 'moderate'
      });
      
      setSearchResults(results);
      toast.success(`Found ${results.length} search results`);
      
      // Auto-add search results to chat if a chat is selected
      if (selectedChatId && results.length > 0) {
        const searchSummary = `Search Results for "${searchQuery}":\n\n` +
          results.slice(0, 5).map((result, index) => 
            `${index + 1}. **${result.title}**\n${result.description}\n${result.url}\n`
          ).join('\n');
        
        setInput(prev => prev + (prev ? '\n\n' : '') + `Based on these search results:\n\n${searchSummary}\n\nPlease analyze and help me with: `);
      }
      
    } catch (error) {
      logger.error('Search error', { error: error instanceof Error ? error.message : String(error) });
      toast.error(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };


  const addSearchResultToInput = (result: BraveSearchResult) => {
    const resultText = `Reference: ${result.title} - ${result.description} (${result.url})`;
    setInput(prev => prev + (prev ? '\n\n' : '') + resultText + '\n\n');
    toast.success('Search result added to message');
  };

  // Handler for smart prompt selection
  const handleSmartPromptSelect = (prompt: string) => {
    setInput(prompt);
    setShowSmartPrompts(false);
    // Create a new chat if none exists
    if (!selectedChatId) {
      handleCreateChat();
    }
    toast.success('Smart prompt selected! Ready to send.');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isSameDay = (a: number, b: number) => {
    const da = new Date(a);
    const db = new Date(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  };

  const formatDateHeader = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Please sign in</h3>
          <p className="text-muted-foreground">You need to be signed in to use the chat</p>
        </div>
      </div>
    );
  }

  const hasMessages = messages && messages.length > 0;
  const showSplitLayout = sessionStarted || hasMessages;

  return (
    <div className="flex h-full bg-[#0A0A0A] text-gray-100">
      {/* Welcome Hero - shown until the user sends the first message */}
      {!showSplitLayout && (
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Static background gradient - reduces CPU usage */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />

          {/* Main content */}
          <div className="flex-1 flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl w-full"
            >
              {/* Logo/Icon */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8"
              >
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 bg-clip-text text-transparent leading-tight"
              >
                ZapDev AI
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-xl text-muted-foreground mb-8 leading-relaxed"
              >
                Build applications with AI-powered development.
                <br />
                <span className="text-base opacity-80">Start a conversation to unlock powerful coding assistance.</span>
              </motion.p>

              {/* Smart Prompts Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="mb-8"
              >
                <SmartPrompts 
                  onPromptSelect={handleSmartPromptSelect}
                  isVisible={showSmartPrompts && !input.trim()}
                />
              </motion.div>

              {/* Chat input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="max-w-lg mx-auto"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Textarea
                      value={input}
                      onChange={(e) => {
                        const newValue = e.target.value.substring(0, MAX_MESSAGE_LENGTH);
                        setInput(newValue);
                        // Hide smart prompts when user starts typing
                        if (newValue.trim() && showSmartPrompts) {
                          setShowSmartPrompts(false);
                        } else if (!newValue.trim() && !showSmartPrompts) {
                          setShowSmartPrompts(true);
                        }
                      }}
                      placeholder="What would you like to build today?"
                      className="min-h-[60px] text-base bg-card/80 backdrop-blur-sm border-2 border-muted/50 focus:border-primary/50 transition-all duration-200 resize-none pr-16 rounded-xl shadow-lg"
                      maxLength={MAX_MESSAGE_LENGTH}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <Button 
                      type="submit" 
                      disabled={!input.trim() || isTyping}
                      size="sm"
                      className="absolute right-2 bottom-2 h-10 w-10 p-0 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 shadow-lg"
                    >
                      {isTyping ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    <span className="text-xs">
                      {input.length}/{MAX_MESSAGE_LENGTH}
                    </span>
                  </div>
                </form>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-8 flex justify-center gap-4"
              >
                <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="bg-card/80 backdrop-blur-sm border-2 hover:border-primary/50 transition-all duration-200"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search Web
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-primary" />
                        Web Search
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search the web for information..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          className="flex-1"
                        />
                        <Button onClick={handleSearch} disabled={!searchQuery.trim() || isSearching}>
                          {isSearching ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          <h4 className="font-medium text-sm">Search Results:</h4>
                          {searchResults.map((result, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => addSearchResultToInput(result)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm truncate">{result.title}</h5>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{result.description}</p>
                                  <a 
                                    href={result.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {result.url}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                                <Button size="sm" variant="ghost" className="shrink-0">
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Clone website feature simplified - button now directly adds prompt to chat */}
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="bg-card/80 backdrop-blur-sm border-2 hover:border-primary/50 transition-all duration-200"
                    onClick={() => {
                      setInput(prev => prev + (prev ? '\n\n' : '') + 'Clone this website URL: ');
                      toast.success('Clone prompt added to chat!');
                    }}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Clone Website
                  </Button>
              </motion.div>

              {/* Feature highlights */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">Secure by Design</h3>
                  <p className="text-xs text-muted-foreground">End-to-end encryption for all conversations</p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">Web Search</h3>
                  <p className="text-xs text-muted-foreground">Search the web with Brave Search API integration</p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">Website Cloning</h3>
                  <p className="text-xs text-muted-foreground">Analyze and recreate any website with AI assistance</p>
                </div>
                  </motion.div>
                </motion.div>
              </div>
        </div>
      )}

      {/* Split Layout - post first send */}
      {showSplitLayout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex"
        >
          {/* Left Sidebar - Chat List */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            onMouseEnter={() => setSidebarExpanded(true)}
            onMouseLeave={() => setSidebarExpanded(false)}
            className={`${sidebarExpanded ? 'w-80' : 'w-3'} border-r border-gray-800/60 bg-[#1A1A1A]/90 backdrop-blur-xl flex flex-col transition-[width] duration-300`}
          >
            {sidebarExpanded ? (
              <>
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-800/60">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center text-gray-100">
                      <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                      Conversations
                    </h2>
                    <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 shadow-lg shadow-blue-500/25 transition-all duration-200">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Start a new chat</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2 text-sm text-muted-foreground">
                          <p>Well auto-generate a great title based on your first message.</p>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsNewChatOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreateChat}>
                              Create Chat
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Chat List */}
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-2">
                    {Array.isArray(chats) && chats.map((chat) => (
                      <motion.div
                        key={chat._id}
                        layout
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        className={`group relative p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedChatId === chat._id 
                            ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10' 
                            : 'hover:bg-gray-800/50 border border-transparent hover:border-gray-700/50'
                        }`}
                        onClick={() => setSelectedChatId(chat._id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate mb-1">
                              <SafeText>{chat.title}</SafeText>
                            </h3>
                            <p className="text-xs text-gray-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTimestamp(chat.updatedAt)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-400 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(chat._id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}

                    {chats?.length === 0 && (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No chats yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Create your first chat to get started</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="-rotate-90 text-[10px] tracking-widest text-gray-500">History</div>
              </div>
            )}
          </motion.div>

          {/* Right Panel - Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100, delay: 0.1 }}
            className="flex-1 flex relative overflow-hidden bg-[#0F0F0F]"
          >
            {/* Left column: Chat area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Chat Header */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 border-b border-gray-800/60 bg-[#1A1A1A]/50 backdrop-blur-xl"
              >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25"
                    animate={{ 
                      boxShadow: [
                        "0 10px 25px rgba(59, 130, 246, 0.25)",
                        "0 10px 25px rgba(37, 99, 235, 0.35)",
                        "0 10px 25px rgba(59, 130, 246, 0.25)"
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="font-semibold text-lg text-gray-100">
                      <SafeText>{chats?.find(c => c._id === selectedChatId)?.title || 'New Conversation'}</SafeText>
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-500/20 to-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1">
                        ZapDev AI
                      </Badge>
                      <span className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        {messages?.length || 0} messages
                      </span>
                    </div>
                  </div>
                </div>
                
              </div>
              </motion.div>

              {/* Messages Area */}
              <div className="flex-1 relative overflow-hidden">
              <AnimatedResultShowcase
                visible={showShowcase}
                onClose={() => setShowShowcase(false)}
                executions={showcaseExecutions}
              />
              {/* Simplified background gradient - reduces animation overhead */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/2 via-transparent to-purple-500/2" />
              
                {/* Team Lead Plan */}
                {teamLeadPlan && (
                  <div className="px-6 pt-4">
                    <Card className="bg-[#1A1A1A]/90 border border-blue-500/30">
                      <CardContent className="p-4">
                        <div className="text-xs uppercase tracking-wide text-blue-300 mb-2">Team Lead Plan</div>
                        <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">
                          <SafeText>{teamLeadPlan}</SafeText>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Messages */}
              <ScrollArea className="h-full p-6">
                <div className="space-y-4 max-w-4xl mx-auto">
                  {Array.isArray(messages) && messages.map((message, idx) => {
                    const prev = idx > 0 ? messages[idx - 1] : undefined;
                    const next = idx < (messages.length - 1) ? messages[idx + 1] : undefined;
                    const newDay = !prev || !isSameDay(prev.createdAt, message.createdAt);
                    const lastInGroup = !next || next.role !== message.role || !isSameDay(next.createdAt, message.createdAt);

                    return (
                      <React.Fragment key={message._id}>
                        {newDay && (
                          <div className="flex items-center justify-center my-4">
                            <div className="px-3 py-1 text-xs bg-card/80 border border-white/10 rounded-full text-muted-foreground">
                              {formatDateHeader(message.createdAt)}
                            </div>
                          </div>
                        )}
                        <div className={`group flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {message.role === 'assistant' && lastInGroup && (
                            <Avatar className="w-8 h-8 border border-primary/20 shadow-sm self-end">
                              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-600">
                                <Bot className="w-4 h-4 text-white" />
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
                            <MessageComponent
                              message={message}
                              extractCodeBlocks={extractCodeBlocks}
                              copyToClipboard={copyToClipboard}
                              copiedMessage={copiedMessage}
                              formatTimestamp={formatTimestamp}
                              getMessageContent={getMessageContent}
                            />
                          </div>

                          {message.role === 'user' && lastInGroup && (
                            <Avatar className="w-8 h-8 border border-muted shadow-sm self-end">
                              <AvatarImage src={user?.avatarUrl} />
                              <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4"
                    >
                      <Avatar className="w-8 h-8 border border-blue-500/20 shadow-lg shadow-blue-500/25">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Bot className="w-4 h-4 text-white" />
                          </motion.div>
                        </AvatarFallback>
                      </Avatar>
                      <Card className="bg-[#1A1A1A]/90 backdrop-blur-xl border border-gray-800/50 shadow-xl shadow-black/20">
                        <CardContent className="p-4">
                          <motion.div
                            className="flex items-center gap-3 text-sm text-gray-300"
                          >
                            <motion.div
                              className="flex gap-1"
                            >
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 bg-blue-400 rounded-full"
                                  animate={{
                                    scale: [1, 1.4, 1],
                                    opacity: [0.4, 1, 0.4]
                                  }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                  }}
                                />
                              ))}
                            </motion.div>
                            <span>ZapDev AI is thinking...</span>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              </div>

              {/* Input Form - Professional code editor style */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-6 border-t border-gray-800/60 bg-[#1A1A1A]/50 backdrop-blur-xl"
              >
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <motion.div 
                  initial={{ opacity: 0.95 }}
                  whileFocus={{ opacity: 1 }}
                  className="rounded-xl bg-[#0A0A0A]/90 backdrop-blur-xl border border-gray-700/50 shadow-2xl px-5 py-3 flex items-end gap-3 transition-all duration-200 focus-within:border-blue-500/50 focus-within:shadow-blue-500/20"
                >
                  <div className="flex-1">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value.substring(0, MAX_MESSAGE_LENGTH))}
                      placeholder="Ask me anything about development, debugging, or paste code for review..."
                      className="min-h-[52px] max-h-48 resize-none text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:outline-none focus:outline-none pr-2 rounded-none text-gray-100 placeholder:text-gray-500"
                      maxLength={MAX_MESSAGE_LENGTH}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      type="submit" 
                      disabled={!input.trim() || isTyping}
                      size="sm"
                      className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTyping ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
              </motion.div>
            </motion.div>

            <div className="flex justify-between items-center mt-3 text-[11px] text-gray-500">
              <span>⏎ Enter to send • ⇧⏎ Shift+Enter for newline</span>
              <span className={input.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-orange-400' : 'text-gray-600'}>
                {input.length.toLocaleString()}/{MAX_MESSAGE_LENGTH.toLocaleString()}
              </span>
            </div>
            </form>
          </motion.div>
          {/* Close left column */}
          </div>

          {/* Right column: Comprehensive Live Preview */}
          <div className="hidden xl:flex w-[45%] min-w-[480px] max-w-[780px]">
            <LivePreview
              code={previewCode}
              language={previewLanguage}
              isVisible={showPreview}
              onExecute={async () => {
                if (!previewCode?.trim()) {
                  toast.error('No code to execute');
                  return {
                    success: false,
                    error: 'No code provided',
                    logs: [],
                    executionTime: 0
                  };
                }
                
                try {
                  const startTime = Date.now();
                  const res = await executeCode(previewCode, previewLanguage as 'python' | 'javascript');
                  const executionTime = Date.now() - startTime;
                  
                  const result = {
                    success: res.success,
                    output: res.stdout,
                    error: res.error as string | undefined,
                    logs: res.stderr ? [res.stderr] : [],
                    executionTime
                  };
                  
                  // Show toast notifications for user feedback
                  if (result.success) {
                    toast.success(`Code executed successfully in ${executionTime}ms`);
                  } else {
                    toast.error(`Execution failed: ${result.error || 'Unknown error'}`);
                  }
                  
                  return result;
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : String(error);
                  console.error('LivePreview execution error:', error);
                  
                  toast.error(`Execution error: ${errorMessage}`);
                  
                  return {
                    success: false,
                    error: errorMessage,
                    logs: [],
                    executionTime: 0
                  };
                }
              }}
            />
          </div>
          {/* Close Right Panel - Chat Interface */}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatInterface;
