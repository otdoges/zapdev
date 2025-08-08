import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SafeText } from '@/components/ui/SafeText';
import { 
  Send, 
  User, 
  Bot, 
  Play, 
  Copy, 
  Check, 
  Plus,
  MessageSquare,
  Trash2,
  Edit3,
  Sparkles,
  Clock,
  Zap,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldX,
  Search,
  Globe,
  ExternalLink,
  Link
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { streamAIResponse, generateChatTitleFromMessages } from '@/lib/ai';
import { executeCode } from '@/lib/sandbox.ts';
import { useAuth } from '@/hooks/useAuth';
import { E2BCodeExecution } from './E2BCodeExecution';
import AnimatedResultShowcase, { type ShowcaseExecutionResult } from './AnimatedResultShowcase';
import { MessageEncryption, isEncryptedMessage } from '@/lib/message-encryption';
import { braveSearchService, type BraveSearchResult, type WebsiteAnalysis } from '@/lib/search-service';
import { crawlSite } from '@/lib/firecrawl';
import { toast } from 'sonner';
import * as Sentry from '@sentry/react';

const { logger } = Sentry;

// Security constants for input validation
const MAX_MESSAGE_LENGTH = 10000;
const MAX_TITLE_LENGTH = 100;
const MIN_TITLE_LENGTH = 1;

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
  
  // Encryption fields
  isEncrypted?: boolean;
  encryptedContent?: string;
  encryptionSalt?: string;
  encryptionIv?: string;
  contentChecksum?: string;
  
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
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

const ChatInterface: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const [showcaseExecutions, setShowcaseExecutions] = useState<ShowcaseExecutionResult[]>([]);
  
  // Search and website cloning state
  const [searchQuery, setSearchQuery] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);
  const [searchResults, setSearchResults] = useState<BraveSearchResult[]>([]);
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showWebsiteDialog, setShowWebsiteDialog] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlPages, setCrawlPages] = useState<{url: string; title?: string}[]>([]);
  
  // Encryption state
  // Default encryption to disabled until initialization succeeds
  const [encryptionEnabled, setEncryptionEnabled] = useState(false); // Default to disabled
  const [messageEncryption, setMessageEncryption] = useState<MessageEncryption | null>(null);
  const [encryptionInitialized, setEncryptionInitialized] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map());
  
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
  const chats = React.useMemo(() => chatsData?.chats ?? [], [chatsData?.chats]);
  const messages = React.useMemo(() => messagesData?.messages ?? [], [messagesData?.messages]);
  const createChat = useMutation(api.chats.createChat);
  const updateChat = useMutation(api.chats.updateChat);
  const createMessage = useMutation(api.messages.createMessage);
  const deleteChat = useMutation(api.chats.deleteChat);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize message encryption when user is available
  useEffect(() => {
    if (user?.id && !messageEncryption) {
      try {
        const encryption = new MessageEncryption(user.id);
        setMessageEncryption(encryption);
        setEncryptionInitialized(true);
        // Only enable encryption if it was previously enabled or if this is the first initialization
        if (!encryptionInitialized) {
          setEncryptionEnabled(true);
        }
      } catch (error) {
        console.error('Failed to initialize message encryption:', error);
        setEncryptionEnabled(false);
        setEncryptionInitialized(false);
      }
    }
  }, [user?.id, messageEncryption, encryptionInitialized]);

  // Auto-select first chat if none selected
  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0]._id);
    }
  }, [chats, selectedChatId]);

  // Decrypt messages when they change or encryption is initialized
  const decryptMessages = React.useCallback(async () => {
    if (!messageEncryption || !messages) return;
    
    const newDecryptedMessages = new Map<string, string>();
    let hasChanges = false;
    
    for (const message of messages) {
      // Skip if message is not encrypted or already decrypted
      if (!message.isEncrypted || decryptedMessages.has(message._id)) {
        continue;
      }
      
      try {
        if (message.encryptedContent && message.encryptionSalt && message.encryptionIv && message.contentChecksum) {
          const encryptedData = {
            encryptedContent: message.encryptedContent,
            salt: message.encryptionSalt,
            iv: message.encryptionIv,
            checksum: message.contentChecksum,
            timestamp: message.createdAt
          };
          
          const result = await messageEncryption.decrypt(encryptedData);
          
          if (result.isValid) {
            newDecryptedMessages.set(message._id, result.content);
            hasChanges = true;
          } else {
            console.warn(`Failed to decrypt message ${message._id} - integrity check failed`);
            newDecryptedMessages.set(message._id, '[Decryption Failed - Content may be corrupted]');
            hasChanges = true;
          }
        }
      } catch (error) {
        console.error(`Error decrypting message ${message._id}:`, error);
        newDecryptedMessages.set(message._id, '[Decryption Failed]');
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      setDecryptedMessages(prev => new Map([...prev, ...newDecryptedMessages]));
    }
  }, [messages, messageEncryption, decryptedMessages]);
  
  useEffect(() => {
    decryptMessages();
  }, [decryptMessages]);
  // Helper function to get display content for a message
  const getMessageContent = (message: ConvexMessage): string => {
    if (message.isEncrypted) {
      return decryptedMessages.get(message._id) || '[Decrypting...]';
    }
    return message.content;
  };

  const extractCodeBlocks = (content: string): CodeBlock[] => {
    // Improved regex to be more secure and specific
    const codeBlockRegex = /```(python|javascript|js)\n([\s\S]*?)```/g;
    const blocks: CodeBlock[] = [];
    let match;
    let count = 0;

    while ((match = codeBlockRegex.exec(content)) !== null && count < 10) { // Limit to 10 code blocks
      const language = match[1] === 'js' ? 'javascript' : match[1] as 'python' | 'javascript';
      const code = match[2].trim();
      
      // Validate code block content
      if (code.length > 0 && code.length < 10000) { // Reasonable size limit
        blocks.push({
          id: `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          language,
          code,
          executed: false,
        });
      }
      count++;
    }

    return blocks;
  };

  const executeCodeBlock = async (block: CodeBlock) => {
    try {
      // Additional validation before execution
      if (block.code.length > 5000) {
        throw new Error('Code block too long for execution');
      }
      
      const result = await executeCode(block.code, block.language);
      return { ...block, executed: true, result };
    } catch (error) {
      console.error('Code execution error:', error);
      return { ...block, executed: true, result: `Error: ${error}` };
    }
  };

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
          } catch {}
        } catch (error) {
          logger.error("Error creating chat", { 
            error: error instanceof Error ? error.message : String(error),
            title: 'New chat'
          });
          Sentry.captureException(error);
          toast.error('Failed to create chat');
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
            chatId: selectedChatId,
            encrypted: encryptionEnabled
          });
          
          // Prepare message data with optional encryption
          let messageData: {
            chatId: Parameters<typeof createMessage>[0]['chatId'];
            content: string;
            role: 'user';
            isEncrypted?: boolean;
            encryptedContent?: string;
            encryptionSalt?: string;
            encryptionIv?: string;
            contentChecksum?: string;
          } = {
            chatId: selectedChatId as Parameters<typeof createMessage>[0]['chatId'],
            content: userContent,
            role: 'user' as const,
          };
          
          // Encrypt message if encryption is enabled and available
          if (encryptionEnabled && messageEncryption) {
            try {
              const encrypted = await messageEncryption.encrypt(userContent);
              messageData = {
                ...messageData,
                isEncrypted: true,
                encryptedContent: encrypted.encryptedContent,
                encryptionSalt: encrypted.salt,
                encryptionIv: encrypted.iv,
                contentChecksum: encrypted.checksum,
              };
              
              logger.info("Message encrypted successfully");
            } catch (encryptionError) {
              console.warn('Failed to encrypt message, sending as plaintext:', encryptionError);
              toast.warning('Message encryption failed, sent as plaintext');
            }
          }
          
          // Create user message
          await createMessage(messageData);

          // Auto-run user code blocks via E2B (JS/TS only per project preference)
          const userBlocks = extractCodeBlocks(userContent);
          if (userBlocks.length > 0) {
            // Respect preference to avoid executing Python automatically [[memory:4361423]]
            const runnableBlocks = userBlocks.filter(b => b.language !== 'python');
            const skippedPython = userBlocks.length !== runnableBlocks.length;
            if (skippedPython) {
              toast.info('Python blocks detected; auto-run is limited to JS/TS.');
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

          // Stream AI response (prepend search / website analysis context if present)
          const searchContext = searchResults.length > 0 ? (
            `\n\nSearch Context (top 5):\n` + searchResults.slice(0,5).map((r,i)=>`${i+1}. ${r.title} - ${r.url}\n${r.description}`).join('\n')
          ) : '';
          const websiteContext = websiteAnalysis ? (
            `\n\nWebsite Context: ${websiteAnalysis.url}\nTitle: ${websiteAnalysis.title || ''}\nTech: ${(websiteAnalysis.technologies||[]).join(', ')}`
          ) : '';
          const combined = userContent + searchContext + websiteContext;
          const streamResult = await streamAIResponse(combined);
          let assistantContent = '';

          for await (const delta of streamResult.textStream) {
            assistantContent += delta;
            // Prevent extremely long responses
            if (assistantContent.length > 50000) {
              break;
            }
          }

          // Sanitize AI response (though it should be safe from reputable AI providers)
          const sanitizedResponse = assistantContent.substring(0, 50000); // Hard limit
          span.setAttribute("response_length", sanitizedResponse.length);

          // Prepare assistant message data with optional encryption
          let assistantMessageData: {
            chatId: Parameters<typeof createMessage>[0]['chatId'];
            content: string;
            role: 'assistant';
            metadata: { model: string; tokens: number };
            isEncrypted?: boolean;
            encryptedContent?: string;
            encryptionSalt?: string;
            encryptionIv?: string;
            contentChecksum?: string;
          } = {
            chatId: selectedChatId as Parameters<typeof createMessage>[0]['chatId'],
            content: sanitizedResponse,
            role: 'assistant' as const,
            metadata: {
              model: 'moonshotai/kimi-k2-instruct',
              tokens: Math.floor(sanitizedResponse.length / 4), // Rough estimate
            },
          };
          
          // Encrypt assistant response if encryption is enabled
          if (encryptionEnabled && messageEncryption) {
            try {
              const encrypted = await messageEncryption.encrypt(sanitizedResponse);
              assistantMessageData = {
                ...assistantMessageData,
                isEncrypted: true,
                encryptedContent: encrypted.encryptedContent,
                encryptionSalt: encrypted.salt,
                encryptionIv: encrypted.iv,
                contentChecksum: encrypted.checksum,
              };
            } catch (encryptionError) {
              console.warn('Failed to encrypt assistant response, sending as plaintext:', encryptionError);
              toast.warning('Assistant response encryption failed, saved as plaintext');
            }
          }

          // Create assistant message
          await createMessage(assistantMessageData);

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
          } catch {}

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

  const handleWebsiteAnalysis = async () => {
    if (!websiteUrl.trim() || isAnalyzingWebsite) return;

    setIsAnalyzingWebsite(true);
    try {
      logger.info('Analyzing website', { url: websiteUrl.trim() });
      const analysis = await braveSearchService.analyzeWebsite(websiteUrl.trim());
      
      setWebsiteAnalysis(analysis);
      toast.success('Website analysis complete!');
      
      // Auto-add analysis to chat if a chat is selected
      if (selectedChatId && analysis) {
        const analysisSummary = `Website Analysis: ${analysis.url}\n\n` +
          `**Title:** ${analysis.title || 'N/A'}\n` +
          `**Description:** ${analysis.description || 'N/A'}\n` +
          `**Technologies:** ${analysis.technologies?.join(', ') || 'Unknown'}\n` +
          `**Layout:** ${analysis.layout || 'Unknown'}\n` +
          `**Components:** ${analysis.components?.join(', ') || 'None detected'}\n` +
          `**Color Scheme:** ${analysis.colorScheme?.slice(0, 5).join(', ') || 'Not detected'}\n\n` +
          `**Content Preview:** ${analysis.content?.substring(0, 500) || 'No content extracted'}...\n\n`;
        
        setInput(prev => prev + (prev ? '\n\n' : '') + `Please help me clone this website:\n\n${analysisSummary}\n\nI want to recreate: `);
      }
      
    } catch (error) {
      logger.error('Website analysis error', { error: error instanceof Error ? error.message : String(error) });
      toast.error(error instanceof Error ? error.message : 'Website analysis failed');
    } finally {
      setIsAnalyzingWebsite(false);
    }
  };

  const addSearchResultToInput = (result: BraveSearchResult) => {
    const resultText = `Reference: ${result.title} - ${result.description} (${result.url})`;
    setInput(prev => prev + (prev ? '\n\n' : '') + resultText + '\n\n');
    toast.success('Search result added to message');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
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
    <div className="flex h-full bg-background">
      {/* Welcome Hero - shown until the user sends the first message */}
      {!showSplitLayout && (
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Animated background gradient */}
          <motion.div
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(62, 111, 243, 0.05) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(62, 111, 243, 0.05) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none"
          />

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
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20"
                  >
                    <Zap className="w-10 h-10 text-white" />
                  </motion.div>
                  <motion.div
                    animate={{ rotate: [360, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 via-transparent to-blue-600/20 rounded-3xl blur-xl"
                  />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight"
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
                      onChange={(e) => setInput(e.target.value.substring(0, MAX_MESSAGE_LENGTH))}
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
                      className="absolute right-2 bottom-2 h-10 w-10 p-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
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

                <Dialog open={showWebsiteDialog} onOpenChange={setShowWebsiteDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="bg-card/80 backdrop-blur-sm border-2 hover:border-primary/50 transition-all duration-200"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Clone Website
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        Website Analysis & Cloning
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter website URL to analyze (e.g., https://example.com)"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleWebsiteAnalysis()}
                          className="flex-1"
                        />
                        <Button onClick={handleWebsiteAnalysis} disabled={!websiteUrl.trim() || isAnalyzingWebsite}>
                          {isAnalyzingWebsite ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Globe className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      
                      {websiteAnalysis && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 max-h-96 overflow-y-auto"
                        >
                          <h4 className="font-medium text-sm">Website Analysis:</h4>
                          <div className="p-4 border rounded-lg bg-muted/30">
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="font-medium">URL:</span> 
                                <a href={websiteAnalysis.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                                  {websiteAnalysis.url}
                                </a>
                              </div>
                              {websiteAnalysis.title && (
                                <div><span className="font-medium">Title:</span> {websiteAnalysis.title}</div>
                              )}
                              {websiteAnalysis.description && (
                                <div><span className="font-medium">Description:</span> {websiteAnalysis.description}</div>
                              )}
                              {websiteAnalysis.technologies && websiteAnalysis.technologies.length > 0 && (
                                <div>
                                  <span className="font-medium">Technologies:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {websiteAnalysis.technologies.map((tech, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">{tech}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {websiteAnalysis.layout && (
                                <div><span className="font-medium">Layout:</span> {websiteAnalysis.layout}</div>
                              )}
                              {websiteAnalysis.components && websiteAnalysis.components.length > 0 && (
                                <div>
                                  <span className="font-medium">Components:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {websiteAnalysis.components.map((comp, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">{comp}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {websiteAnalysis.colorScheme && websiteAnalysis.colorScheme.length > 0 && (
                                <div>
                                  <span className="font-medium">Colors:</span>
                                  <div className="flex gap-1 mt-1">
                                    {websiteAnalysis.colorScheme.slice(0, 8).map((color, index) => (
                                      <div 
                                        key={index} 
                                        className="w-6 h-6 rounded border"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <Button 
                                variant="secondary"
                                onClick={async () => {
                                  setIsCrawling(true);
                                  try {
                                    const result = await crawlSite(websiteAnalysis.url, { maxPages: 12, includeSitemap: true });
                                    setCrawlPages(result.pages.map(p => ({ url: p.url, title: p.title })));
                                    toast.success(`Crawled ${result.pages.length} pages with Firecrawl`);
                                  } catch (err) {
                                    toast.error(err instanceof Error ? err.message : 'Firecrawl failed');
                                  } finally {
                                    setIsCrawling(false);
                                  }
                                }}
                                disabled={isCrawling}
                              >
                                {isCrawling ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Globe className="w-4 h-4 mr-2"/>}
                                Crawl with Firecrawl
                              </Button>
                              <Button 
                                className="w-full"
                                onClick={() => {
                                  handleWebsiteAnalysis();
                                  setShowWebsiteDialog(false);
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add to Chat
                              </Button>
                            </div>
                            {crawlPages.length > 0 && (
                              <div className="mt-3">
                                <h5 className="font-medium text-sm mb-2">Crawled Pages</h5>
                                <div className="max-h-40 overflow-auto space-y-1 text-xs">
                                  {crawlPages.slice(0, 20).map((p, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-primary truncate">
                                        {p.title || p.url}
                                      </a>
                                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground">
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <Button 
                              className="w-full mt-4" 
                              onClick={() => {
                                const summary = `Crawled ${crawlPages.length} pages from ${websiteAnalysis.url}. Key pages:\n` + crawlPages.slice(0,5).map(p=>`- ${p.title || p.url} (${p.url})`).join('\n');
                                setInput(prev => prev + (prev ? '\n\n' : '') + summary + '\n\nUse these references to recreate the UI.');
                                setShowWebsiteDialog(false);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Insert Crawl Summary
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
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
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
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
            className="w-80 border-r bg-card/30 backdrop-blur-sm flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                  Chats
                </h2>
                <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
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
              <div className="p-2 space-y-1">
                {chats?.map((chat) => (
                  <motion.div
                    key={chat._id}
                    layout
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedChatId === chat._id 
                        ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-primary/20 shadow-sm' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedChatId(chat._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate mb-1">
                          <SafeText>{chat.title}</SafeText>
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(chat.updatedAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
          </motion.div>

          {/* Right Panel - Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100, delay: 0.1 }}
            className="flex-1 flex flex-col relative overflow-hidden bg-background"
          >
            {/* Chat Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 border-b bg-card/30 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base">
                      <SafeText>{chats?.find(c => c._id === selectedChatId)?.title || 'Chat'}</SafeText>
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 px-2 py-0.5">
                        ZapDev AI
                      </Badge>
                      <span>{messages?.length || 0} messages</span>
                    </div>
                  </div>
                </div>
                
                {/* Encryption status */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={encryptionEnabled ? "default" : "outline"}
                    onClick={() => encryptionInitialized && setEncryptionEnabled(!encryptionEnabled)}
                    disabled={!encryptionInitialized}
                    className={`h-8 px-3 text-xs transition-all ${!encryptionInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {!encryptionInitialized ? (
                      <Shield className="w-3 h-3 mr-1" />
                    ) : encryptionEnabled ? (
                      <ShieldCheck className="w-3 h-3 mr-1 text-green-600" />
                    ) : (
                      <ShieldX className="w-3 h-3 mr-1" />
                    )}
                    {encryptionEnabled ? 'Encrypted' : 'Plain'}
                  </Button>
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
              {/* Animated background gradient */}
              <motion.div
                animate={{
                  background: [
                    "radial-gradient(circle at 20% 50%, rgba(62, 111, 243, 0.03) 0%, transparent 50%)",
                    "radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.03) 0%, transparent 50%)",
                    "radial-gradient(circle at 20% 50%, rgba(62, 111, 243, 0.03) 0%, transparent 50%)",
                  ],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 pointer-events-none"
              />
              
              {/* Messages */}
              <ScrollArea className="h-full p-6">
                <div className="space-y-6 max-w-4xl mx-auto">
                  <AnimatePresence>
                    {messages?.map((message) => (
                      <motion.div
                        key={message._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`group flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <Avatar className="w-8 h-8 border border-primary/20 shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600">
                              <Bot className="w-4 h-4 text-white" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
                          <Card className={`transition-all duration-200 group-hover:shadow-xl ${
                            message.role === 'user' 
                              ? 'bg-white text-blue-600 border border-white/20' 
                              : 'bg-card/80 backdrop-blur-md border-white/10'
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-1">
                                <Badge
                                  variant={message.role === 'assistant' ? 'secondary' : 'outline'}
                                  className="px-1.5 py-0.5 text-[10px] leading-none"
                                >
                                  {message.role === 'assistant' ? 'AI' : 'You'}
                                </Badge>
                              </div>
                              <div className="text-sm leading-relaxed">
                                <SafeText>{getMessageContent(message)}</SafeText>
                              </div>
                              
                              {/* Encryption indicator */}
                              {message.isEncrypted && (
                                <div className="flex items-center gap-1 mt-3 text-xs opacity-70">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  <span>End-to-end encrypted</span>
                                </div>
                              )}
                              
                              {/* Code blocks with E2B execution (assistant, auto-run for JS/TS) */}
                              {message.role === 'assistant' && extractCodeBlocks(getMessageContent(message)).map((block) => (
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

                              {/* Code blocks with E2B execution (user, auto-run for JS/TS) */}
                              {message.role === 'user' && extractCodeBlocks(getMessageContent(message)).map((block) => (
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
                                  onClick={() => copyToClipboard(getMessageContent(message), message._id)}
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
                        </div>

                        {message.role === 'user' && (
                          <Avatar className="w-8 h-8 border border-muted shadow-sm">
                            <AvatarImage src={user?.avatarUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4"
                    >
                      <Avatar className="w-8 h-8 border border-primary/20 shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </AvatarFallback>
                      </Avatar>
                      <Card className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200/50 dark:border-purple-800/50 shadow-sm">
                        <CardContent className="p-4">
                          <motion.div
                            className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="flex gap-1"
                            >
                              <div className="w-2 h-2 bg-current rounded-full opacity-60" />
                              <div className="w-2 h-2 bg-current rounded-full opacity-40" />
                              <div className="w-2 h-2 bg-current rounded-full opacity-20" />
                            </motion.div>
                            <span>Thinking...</span>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input Form - Lovable-style floating composer */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="px-6 pb-6 pt-2"
            >
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <motion.div 
                  initial={{ opacity: 0.95 }}
                  whileFocus={{ opacity: 1 }}
                  className="rounded-full bg-[#0F1012]/70 backdrop-blur-xl border border-white/10 shadow-2xl px-4 py-2 flex items-end gap-2"
                >
                  <div className="flex-1">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value.substring(0, MAX_MESSAGE_LENGTH))}
                      placeholder="Ask anything or paste code (```js)..."
                      className="min-h-[48px] max-h-40 resize-none text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:outline-none focus:outline-none pr-2 rounded-none"
                      maxLength={MAX_MESSAGE_LENGTH}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!input.trim() || isTyping}
                    size="sm"
                    className="h-9 px-4 rounded-full bg-white text-blue-600 hover:bg-white/90 shadow-md"
                  >
                    {isTyping ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
                <div className="flex justify-between items-center mt-2 text-[11px] text-muted-foreground">
                  <span>Enter to send • Shift+Enter for newline</span>
                  <span className={input.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-orange-500' : ''}>
                    {input.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatInterface;
