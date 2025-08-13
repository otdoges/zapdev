import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowRight
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { streamAIResponse, generateChatTitleFromMessages, generateAIResponse } from '@/lib/ai';
import { executeCode, startSandbox } from '@/lib/sandbox.ts';
import { useAuth } from '@/hooks/useAuth';
import { useAuth as useClerkAuth, SignInButton } from '@clerk/clerk-react';
import { E2BCodeExecution } from './E2BCodeExecution';
import AnimatedResultShowcase, { type ShowcaseExecutionResult } from './AnimatedResultShowcase';
import { MessageEncryption, isEncryptedMessage } from '@/lib/message-encryption';
import { braveSearchService, type BraveSearchResult, type WebsiteAnalysis } from '@/lib/search-service';
import { crawlSite } from '@/lib/firecrawl';
import { toast } from 'sonner';
import * as Sentry from '@sentry/react';
import WebContainerFailsafe from './WebContainerFailsafe';
import { DECISION_PROMPT_NEXT } from '@/lib/decisionPrompt';
import Navigation from '@/components/Navigation';
import { FeaturesSection } from '@/components/features/FeaturesSection';
import { DynamicPricingSection } from '@/components/pricing/DynamicPricingSection';
import Footer from '@/components/Footer';
import { useNavigate, useLocation } from 'react-router-dom';

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
  contentSha256?: string;
  
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

const UnifiedInterface: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { getToken } = useClerkAuth();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const [showcaseExecutions, setShowcaseExecutions] = useState<ShowcaseExecutionResult[]>([]);
  const [previewCode, setPreviewCode] = useState<string>('');
  const [previewLanguage, setPreviewLanguage] = useState<string>('javascript');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);
  const [teamLeadPlan, setTeamLeadPlan] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  
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
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [messageEncryption, setMessageEncryption] = useState<MessageEncryption | null>(null);
  const [encryptionInitialized, setEncryptionInitialized] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map());
  
  // Chat expansion state
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convex queries and mutations - skip if user not loaded or not authenticated
  const chatsData = useQuery(api.chats.getUserChats, user && !authLoading ? {} : "skip");
  const messagesData = useQuery<typeof api.messages.getChatMessages>(
    api.messages.getChatMessages,
    selectedChatId && user && !authLoading
      ? { chatId: selectedChatId as Id<"chats"> }
      : ("skip" as const)
  );

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

  // Pre-warm E2B sandbox
  useEffect(() => {
    startSandbox().catch(() => {
      // Ignore; E2B errors will be surfaced by execution components
    });
  }, []);

  // Initialize message encryption when user is available
  useEffect(() => {
    if (user?.userId && !messageEncryption) {
      try {
        const encryption = new MessageEncryption(user.userId);
        setMessageEncryption(encryption);
        setEncryptionInitialized(true);
        if (!encryptionInitialized) {
          setEncryptionEnabled(true);
        }
      } catch (error) {
        console.error('Failed to initialize message encryption:', error);
        setEncryptionEnabled(false);
        setEncryptionInitialized(false);
      }
    }
  }, [user?.userId, messageEncryption, encryptionInitialized]);

  // Auto-select first chat if none selected and expand chat
  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0]._id);
      setIsChatExpanded(true);
    }
  }, [chats, selectedChatId]);

  // Expand chat when session starts or when on /chat route
  useEffect(() => {
    if (sessionStarted || messages.length > 0 || location.pathname === '/chat') {
      setIsChatExpanded(true);
    }
  }, [sessionStarted, messages.length, location.pathname]);

  // Decrypt messages when they change or encryption is initialized
  const decryptMessages = React.useCallback(async () => {
    if (!messageEncryption || !messages) return;
    
    const newDecryptedMessages = new Map<string, string>();
    let hasChanges = false;
    
    for (const message of messages) {
      if (!message.isEncrypted || decryptedMessages.has(message._id)) {
        continue;
      }
      
      try {
        if (message.encryptedContent && message.encryptionSalt && message.encryptionIv && message.contentSha256) {
          const encryptedData = {
            encryptedContent: message.encryptedContent,
            salt: message.encryptionSalt,
            iv: message.encryptionIv,
            checksum: message.contentSha256,
            timestamp: message.createdAt
          };
          
          const result = await messageEncryption.decrypt(encryptedData);
          
          if (result.isValid) {
            newDecryptedMessages.set(message._id, result.content);
            hasChanges = true;
          } else {
            logger.warn('Failed to decrypt message - integrity check failed');
            newDecryptedMessages.set(message._id, '[Decryption Failed - Content may be corrupted]');
            hasChanges = true;
          }
        }
      } catch (error) {
        logger.error('Error decrypting message', { error: error instanceof Error ? error.message : String(error) });
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
  };

  const executeCodeBlock = async (block: CodeBlock) => {
    try {
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
          const tempTitle = 'New chat';
          span.setAttribute("chat_title", tempTitle);
          logger.info("Creating new chat", { title: tempTitle });
          const chatId = await createChat({ title: tempTitle });
          
          setSelectedChatId(chatId);
          setIsNewChatOpen(false);
          setIsChatExpanded(true);
          
          span.setAttribute("chat_id", chatId);
          logger.info("Chat created successfully", { chatId, title: tempTitle });
          toast.success('New chat created!');

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
        setIsChatExpanded(false);
      }
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    // Check if user is authenticated before processing message
    if (!user) {
      toast.error('Please sign in to send messages');
      return;
    }

    // Create a chat if none exists
    if (!selectedChatId) {
      await handleCreateChat();
      return; // The form will be submitted again after chat creation
    }

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
        setIsChatExpanded(true);

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
            contentSha256?: string;
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
                contentSha256: encrypted.checksum,
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
            const runnableBlocks = userBlocks.filter(b => b.language !== 'python');
            const skippedPython = userBlocks.length !== runnableBlocks.length;
            if (skippedPython) {
              toast.info('Python blocks detected; auto-run is limited to JS/TS.');
            }

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
            setIsPlanning(true);
            const planningPrompt = `${DECISION_PROMPT_NEXT}\n\n<user_request>\n${userContent}\n</user_request>\n\nProduce a concise Team Lead plan and execution strategy as bullet points. No code.`;
            const plan = await generateAIResponse(planningPrompt, { skipCache: true });
            setTeamLeadPlan(plan);
          } catch (planErr) {
            console.debug('Planning step skipped', planErr);
          } finally {
            setIsPlanning(false);
          }

          // Stream AI response
          const searchContext = searchResults.length > 0 ? (
            `\n\nSearch Context (top 5):\n` + searchResults.slice(0,5).map((r,i)=>`${i+1}. ${r.title} - ${r.url}\n${r.description}`).join('\n')
          ) : '';
          const websiteContext = websiteAnalysis ? (
            `\n\nWebsite Context: ${websiteAnalysis.url}\nTitle: ${websiteAnalysis.title || ''}\nTech: ${(websiteAnalysis.technologies||[]).join(', ')}`
          ) : '';
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
          const sanitizedResponse = assistantContent;
          span.setAttribute("response_length", sanitizedResponse.length);

          // Extract assistant code blocks for preview
          const assistantBlocks = extractCodeBlocks(sanitizedResponse);
          const assistantRunnable = assistantBlocks.filter(b => b.language !== 'python');
          if (assistantRunnable[0]) {
            setPreviewCode(assistantRunnable[0].code);
            setPreviewLanguage(assistantRunnable[0].language);
            setShowPreview(true);
          }

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
            contentSha256?: string;
          } = {
            chatId: selectedChatId as Parameters<typeof createMessage>[0]['chatId'],
            content: sanitizedResponse,
            role: 'assistant' as const,
            metadata: {
              model: 'openai/gpt-oss-120b',
              tokens: Math.floor(sanitizedResponse.length / 4),
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
                contentSha256: encrypted.checksum,
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

  // Suggested prompts inspired by CreateAnything.com
  const suggestedPrompts = [
    "Help me build a modern React dashboard",
    "Create a landing page for my startup",
    "Build a real-time chat application",
    "Design a task management app",
    "Create an e-commerce product page",
    "Build a user authentication system"
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-foreground flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-foreground">
      <Navigation />

      {/* Global background layer */}
      <div className="absolute inset-0 -z-10 bg-[#0A0A0A]" />
      
      {/* Hero Section with Integrated Chat */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={`relative container mx-auto px-4 transition-all duration-700 ${
          isChatExpanded ? 'py-24 min-h-screen' : 'py-24 min-h-[calc(100svh-80px)]'
        } flex items-center justify-center`}
      >
        {/* Centered background glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: isChatExpanded 
              ? 'radial-gradient(50% 40% at 50% 20%, rgba(55, 122, 251, 0.15) 0%, rgba(55, 122, 251, 0) 70%)'
              : 'radial-gradient(60% 50% at 50% 35%, rgba(55, 122, 251, 0.25) 0%, rgba(55, 122, 251, 0) 70%)'
          }}
        />
        
        <div className="flex flex-col items-center text-center relative z-10 w-full max-w-4xl">
          {/* Badge Section */}
          {!isChatExpanded && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
              className="inline-block mb-4 px-4 py-1.5 rounded-full glass"
            >
              <span className="text-sm font-medium">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ delay: 0.8, duration: 2, ease: "easeInOut" }}
                  className="inline-block"
                >
                  <Sparkles className="w-4 h-4 inline-block mr-2" />
                </motion.div>
                ZapDev - Build with AI, Ship faster
              </span>
            </motion.div>
          )}
          
          {/* Heading and Description */}
          {!isChatExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 80 }}
              className="max-w-3xl mx-auto relative z-10 mb-8"
            >
              <motion.h1 
                className="text-5xl md:text-7xl font-normal mb-4 tracking-tight"
              >
                <motion.span 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-white font-medium block"
                >
                  Build something real.
                </motion.span>
                <motion.span 
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="text-gradient font-medium block"
                >
                  Just describe what you want.
                </motion.span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.7, type: "spring", stiffness: 90 }}
                className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto"
              >
                The fastest way to build full-stack web applications with AI. From idea to deployment in minutes.
              </motion.p>
            </motion.div>
          )}

          {/* Integrated Chat Interface */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isChatExpanded ? 0.1 : 1.2, duration: 0.6 }}
            className={`w-full transition-all duration-700 ${
              isChatExpanded ? 'max-w-6xl' : 'max-w-2xl'
            }`}
          >
            {/* Chat Input */}
            <motion.div
              layout
              className={`transition-all duration-700 ${
                isChatExpanded ? 'mb-6' : 'mb-8'
              }`}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value.substring(0, MAX_MESSAGE_LENGTH))}
                    placeholder={
                      !user && isChatExpanded 
                        ? "Sign in to start building with AI..." 
                        : isChatExpanded 
                          ? "Continue the conversation..." 
                          : "What would you like to build today?"
                    }
                    className={`text-base bg-card/80 backdrop-blur-sm border-2 border-muted/50 focus:border-primary/50 transition-all duration-200 resize-none pr-16 rounded-xl shadow-lg ${
                      isChatExpanded ? 'min-h-[52px]' : 'min-h-[60px]'
                    }`}
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
                    title={!user ? "Sign in to send messages" : "Send message"}
                  >
                    {isTyping ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : !user ? (
                      <User className="w-4 h-4" />
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

            {/* Suggested Prompts - only show when not expanded */}
            {!isChatExpanded && !user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8"
              >
                {suggestedPrompts.slice(0, 6).map((prompt, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInput(prompt)}
                    className="text-left p-3 bg-card/40 backdrop-blur-sm border border-muted/30 rounded-lg hover:border-primary/30 transition-all duration-200 text-sm"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Auth prompt for non-authenticated users */}
            {!user && !isChatExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.6 }}
                className="text-center"
              >
                <SignInButton mode="redirect" forceRedirectUrl="/chat">
                  <Button 
                    size="lg" 
                    className="button-gradient mr-4"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </SignInButton>
                <Button size="lg" variant="link" className="text-white">
                  View Examples <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* Expanded Chat Interface */}
            <AnimatePresence>
              {isChatExpanded && (user || location.pathname === '/chat') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="bg-[#0F1012]/70 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden"
                >
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-800/60 bg-[#1A1A1A]/50 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25"
                          animate={{ 
                            boxShadow: [
                              "0 8px 20px rgba(168, 85, 247, 0.25)",
                              "0 8px 20px rgba(139, 92, 246, 0.35)",
                              "0 8px 20px rgba(168, 85, 247, 0.25)"
                            ]
                          }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Bot className="w-4 h-4 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="font-semibold text-sm text-gray-100">
                            <SafeText>{chats?.find(c => c._id === selectedChatId)?.title || 'New Conversation'}</SafeText>
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5">
                              ZapDev AI
                            </Badge>
                            <span className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                              {messages?.length || 0} messages
                            </span>
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
                          className={`h-7 px-3 text-xs transition-all duration-200 ${
                            encryptionEnabled 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' 
                              : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:bg-gray-700/50'
                          } ${!encryptionInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {!encryptionInitialized ? (
                            <Shield className="w-3 h-3 mr-1" />
                          ) : encryptionEnabled ? (
                            <ShieldCheck className="w-3 h-3 mr-1" />
                          ) : (
                            <ShieldX className="w-3 h-3 mr-1" />
                          )}
                          {encryptionEnabled ? 'E2E' : 'Plain'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsChatExpanded(false)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="relative">
                    <AnimatedResultShowcase
                      visible={showShowcase}
                      onClose={() => setShowShowcase(false)}
                      executions={showcaseExecutions}
                    />
                    
                    {/* Team Lead Plan */}
                    {teamLeadPlan && (
                      <div className="p-4">
                        <Card className="bg-[#1A1A1A]/90 border border-purple-500/30">
                          <CardContent className="p-3">
                            <div className="text-xs uppercase tracking-wide text-purple-300 mb-2">Team Lead Plan</div>
                            <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">
                              <SafeText>{teamLeadPlan}</SafeText>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Messages */}
                    <ScrollArea className="h-96 p-4">
                      <div className="space-y-4">
                        {/* Sign-in prompt for unauthenticated users with no messages */}
                        {!user && (!messages || messages.length === 0) && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-8 text-center"
                          >
                            <div className="bg-card/80 backdrop-blur-sm border border-muted/50 rounded-lg p-6 max-w-sm">
                              <div className="mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                                  <Bot className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-semibold text-gray-100 mb-2">Ready to start building?</h3>
                                <p className="text-sm text-gray-400 mb-4">Sign in to start chatting with ZapDev AI and build amazing applications.</p>
                              </div>
                              <SignInButton mode="redirect" forceRedirectUrl="/chat">
                                <Button className="w-full button-gradient">
                                  Sign In to Continue
                                  <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                              </SignInButton>
                            </div>
                          </motion.div>
                        )}

                        <AnimatePresence>
                          {messages?.map((message, idx) => {
                            const prev = idx > 0 ? messages[idx - 1] : undefined;
                            const next = idx < (messages.length - 1) ? messages[idx + 1] : undefined;
                            const newDay = !prev || !isSameDay(prev.createdAt, message.createdAt);
                            const firstInGroup = !prev || prev.role !== message.role || newDay;
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
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  className={`group flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  {message.role === 'assistant' && lastInGroup && (
                                    <Avatar className="w-6 h-6 border border-primary/20 shadow-sm self-end">
                                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600">
                                        <Bot className="w-3 h-3 text-white" />
                                      </AvatarFallback>
                                    </Avatar>
                                  )}

                                  <div className={`max-w-[70%] ${message.role === 'user' ? 'order-1' : ''}`}>
                                    <Card className={`rounded-lg transition-all duration-300 group-hover:shadow-lg ${
                                      message.role === 'user'
                                        ? 'bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 shadow-sm shadow-purple-500/5'
                                        : 'bg-[#1A1A1A]/90 backdrop-blur-xl border border-gray-800/50 shadow-sm shadow-black/20'
                                    }`}>
                                      <CardContent className="p-3">
                                        <div className="text-sm leading-relaxed text-gray-100">
                                          <SafeText>{getMessageContent(message)}</SafeText>
                                        </div>

                                        {message.isEncrypted && (
                                          <div className="flex items-center gap-2 mt-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded px-2 py-1">
                                            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                                            <span>Encrypted</span>
                                          </div>
                                        )}

                                        {extractCodeBlocks(getMessageContent(message)).map((block) => (
                                          <motion.div
                                            key={block.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="mt-3"
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

                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                                          <span className="text-xs opacity-70">
                                            {formatTimestamp(message.createdAt)}
                                          </span>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 opacity-70 hover:opacity-100 transition-all"
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

                                  {message.role === 'user' && lastInGroup && (
                                    <Avatar className="w-6 h-6 border border-muted shadow-sm self-end">
                                      <AvatarImage src={user?.avatarUrl} />
                                      <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                                        <User className="w-3 h-3" />
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </motion.div>
                              </React.Fragment>
                            );
                          })}
                        </AnimatePresence>

                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3"
                          >
                            <Avatar className="w-6 h-6 border border-purple-500/20 shadow-lg shadow-purple-500/25">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                  <Bot className="w-3 h-3 text-white" />
                                </motion.div>
                              </AvatarFallback>
                            </Avatar>
                            <Card className="bg-[#1A1A1A]/90 backdrop-blur-xl border border-gray-800/50 shadow-sm shadow-black/20">
                              <CardContent className="p-3">
                                <motion.div
                                  className="flex items-center gap-2 text-sm text-gray-300"
                                >
                                  <motion.div
                                    className="flex gap-1"
                                  >
                                    {[0, 1, 2].map((i) => (
                                      <motion.div
                                        key={i}
                                        className="w-1.5 h-1.5 bg-purple-400 rounded-full"
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
                                  <span>AI is thinking...</span>
                                </motion.div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Demo Screenshot - only show when not expanded */}
          {!isChatExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.8, duration: 0.8, type: "spring", stiffness: 70 }}
              className="relative mx-auto max-w-5xl mt-16"
            >
              <motion.div 
                initial={{ rotateX: 15, rotateY: -10 }}
                animate={{ rotateX: 0, rotateY: 0 }}
                transition={{ delay: 2.2, duration: 1.2, ease: "easeOut" }}
                className="overflow-hidden w-full max-w-full"
              >
                <motion.img
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 2.5, duration: 0.8 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
                  alt="ZapDev - AI Platform Dashboard for Fast Development"
                  className="w-full h-auto"
                  src="/lovable-uploads/e5028882-3e9c-4315-b720-bae1fe817df8.png"
                />
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Features Section - only show when not chat expanded */}
      <AnimatePresence>
        {!isChatExpanded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            id="features"
          >
            <FeaturesSection />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pricing Section - only show when not chat expanded */}
      <AnimatePresence>
        {!isChatExpanded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            id="pricing"
          >
            <DynamicPricingSection />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Section - only show when not chat expanded */}
      <AnimatePresence>
        {!isChatExpanded && (
          <motion.section 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full border-t border-white py-20 px-4 md:px-8 lg:px-32"
            style={{
              background: '#3E6FF3'
            }}
          >
            <div className="flex flex-col items-center justify-center w-full">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-center max-w-4xl mx-auto"
              >
                <motion.h2 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-3xl md:text-4xl font-bold mb-4 text-white"
                >
                  Ready to build something amazing?
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="text-lg text-white/80 mb-8 max-w-2xl mx-auto"
                >
                  Join thousands of developers who have already discovered the power of AI-driven development.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {user ? (
                    <Button 
                      size="lg" 
                      className="bg-white text-blue-600 hover:bg-white/90"
                      onClick={() => setIsChatExpanded(true)}
                    >
                      Start Building
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <SignInButton mode="redirect" forceRedirectUrl="/chat">
                      <Button 
                        size="lg" 
                        className="bg-white text-blue-600 hover:bg-white/90"
                      >
                        Get Started
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </SignInButton>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer - only show when not chat expanded */}
      <AnimatePresence>
        {!isChatExpanded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnifiedInterface;