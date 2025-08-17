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
  Search,
  Globe,
  ExternalLink,
  Link,
  Code,
  Palette,
  Layers,
  ArrowUp,
  Mic,
  Paperclip,
  Settings,
  Github,
  GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { streamAIResponse, generateChatTitleFromMessages, generateAIResponse } from '@/lib/ai';
import { executeCode, startSandbox } from '@/lib/sandbox';
import { useAuth } from '@/hooks/useAuth';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import AnimatedResultShowcase from './AnimatedResultShowcase';
import { braveSearchService, type BraveSearchResult, type WebsiteAnalysis } from '@/lib/search-service';
import { crawlSite } from '@/lib/firecrawl';
import { toast } from 'sonner';
import * as Sentry from '@sentry/react';
import WebContainerFailsafe from './WebContainerFailsafe';
import { DECISION_PROMPT_NEXT } from '@/lib/decisionPrompt';
import { GitHubIntegration } from '@/components/GitHubIntegration';
import type { GitHubRepo } from '@/lib/github-service';
import { githubService } from '@/lib/github-service';

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

const EnhancedChatInterface: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { getToken } = useClerkAuth();
  const { getSubscription } = useUsageTracking();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);

  // Enhanced UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<BraveSearchResult[]>([]);
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [isWebsiteDialogOpen, setIsWebsiteDialogOpen] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  // Enhanced animations
  const [messageAnimations, setMessageAnimations] = useState<{ [key: string]: boolean }>({});
  
  // GitHub Integration state
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [githubContext, setGithubContext] = useState<string>('');
  const [isGithubMode, setIsGithubMode] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Convex queries and mutations
  const chats = useQuery(api.chats.getUserChats);
  const messages = useQuery(
    api.messages.getChatMessages, 
    selectedChatId ? { chatId: selectedChatId as Id<'chats'> } : "skip"
  );
  
  const createChatMutation = useMutation(api.chats.createChat);
  const addMessageMutation = useMutation(api.messages.createMessage);
  const updateMessageMutation = useMutation(api.messages.updateMessage);
  const deleteChatMutation = useMutation(api.chats.deleteChat);
  const updateChatTitleMutation = useMutation(api.chats.updateChat);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize sandbox on component mount for better performance
  useEffect(() => {
    const warmUpSandbox = async () => {
      try {
        await startSandbox();
        logger.info('Sandbox warmed up successfully');
      } catch (error) {
        logger.warn('Sandbox warm-up failed:', error);
      }
    };
    
    warmUpSandbox();
  }, []);

  // Enhanced auto-resize for textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateInput(input, MAX_MESSAGE_LENGTH);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }
    
    const sanitizedInput = sanitizeText(input);
    if (!sanitizedInput.trim()) return;
    
    // Enhance message with GitHub context if available
    const enhancedInput = await enhanceMessageWithGitHub(sanitizedInput);

    if (!sessionStarted) {
      setSessionStarted(true);
    }

    try {
      let currentChatId = selectedChatId;
      
      if (!currentChatId) {
        const newChat = await createChatMutation({
          title: 'New Chat',
        });
        currentChatId = newChat;
        setSelectedChatId(currentChatId);
      }

      // Add user message
      await addMessageMutation({
        chatId: currentChatId as Id<'chats'>,
        content: sanitizedInput, // Store original user input
        role: 'user',
        metadata: {
          githubMode: isGithubMode,
          repository: selectedRepo?.full_name
        }
      });

      setInput('');
      setIsTyping(true);

      // Generate AI response with enhanced error handling
      try {
        const stream = await streamAIResponse(enhancedInput); // Use enhanced input for AI
        let assistantResponse = '';

        // Add assistant message placeholder
        const assistantMessageId = await addMessageMutation({
          chatId: currentChatId as Id<'chats'>,
          content: '',
          role: 'assistant',
          metadata: {}
        });

        // Process stream with real-time updates
        for await (const delta of stream.textStream) {
          assistantResponse += delta;
          // Update message in real-time
          try {
            await updateMessageMutation({
              messageId: assistantMessageId,
              content: assistantResponse
            });
          } catch (error) {
            // Continue streaming even if update fails
            console.warn('Failed to update message during streaming:', error);
          }
        }
        
        // Auto-generate title if this is the first exchange
        if (messages?.length === 0) {
          try {
            const title = await generateChatTitleFromMessages([
              { role: 'user', content: sanitizedInput },
              { role: 'assistant', content: assistantResponse }
            ]);
            await updateChatTitleMutation({
              chatId: currentChatId as Id<'chats'>,
              title: title.slice(0, MAX_TITLE_LENGTH)
            });
          } catch (titleError) {
            logger.warn('Title generation failed:', titleError);
          }
        }

        // Refresh subscription data
        try {
          await getSubscription();
        } catch (error) {
          logger.warn('Failed to refresh subscription data:', error);
        }

      } catch (aiError) {
        logger.error('AI response failed:', aiError);
        toast.error('Failed to generate AI response. Please try again.');
        
        await addMessageMutation({
          chatId: currentChatId as Id<'chats'>,
          content: 'I apologize, but I encountered an error while processing your request. Please try again.',
          role: 'assistant',
          metadata: { error: true }
        });
      }

    } catch (error) {
      logger.error('Chat submission failed:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessage(messageId);
      toast.success('Message copied to clipboard');
      
      setTimeout(() => {
        setCopiedMessage(null);
      }, 2000);
    } catch (error) {
      logger.error('Clipboard copy failed:', error);
      toast.error('Failed to copy message');
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await deleteChatMutation({ chatId: chatId as Id<'chats'> });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setSessionStarted(false);
      }
      toast.success('Chat deleted successfully');
    } catch (error) {
      logger.error('Chat deletion failed:', error);
      toast.error('Failed to delete chat');
    }
  };

  const startNewChat = () => {
    setSelectedChatId(null);
    setSessionStarted(false);
    setInput('');
    setIsNewChatOpen(false);
    toast.success('Started new chat');
  };

  const selectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setSessionStarted(true);
    setSidebarExpanded(false);
  };

  // Enhanced web search with improved UX
  const searchWeb = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setIsSearchOpen(true);
      const results = await braveSearchService.search(query);
      setSearchResults(results);
      toast.success(`Found ${results.length} results for "${query}"`);
    } catch (error) {
      logger.error('Web search failed:', error);
      toast.error('Search failed. Please try again.');
    }
  };

  // Enhanced website analysis
  const analyzeWebsite = async (url: string) => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      setIsAnalyzingWebsite(true);
      const analysis = await crawlSite(url);
      setWebsiteAnalysis(analysis);
      
      if (analysis) {
        const analysisSummary = 
          `**Website Analysis for ${url}:**\n\n` +
          `**Title:** ${analysis.title || 'Not detected'}\n\n` +
          `**Description:** ${analysis.description || 'Not detected'}\n\n` +
          `**Technologies:** ${analysis.technologies?.join(', ') || 'Not detected'}\n\n` +
          `**Color Scheme:** ${analysis.colorScheme?.slice(0, 5).join(', ') || 'Not detected'}\n\n` +
          `**Content Preview:** ${analysis.content?.substring(0, 500) || 'No content extracted'}...\n\n`;
        
        setInput(prev => prev + (prev ? '\n\n' : '') + `Please help me clone this website:\n\n${analysisSummary}\n\nI want to recreate: `);
        toast.success('Website analyzed successfully!');
      }
      
    } catch (error) {
      logger.error('Website analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Website analysis failed');
    } finally {
      setIsAnalyzingWebsite(false);
      setIsWebsiteDialogOpen(false);
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

  // GitHub Integration Functions
  const handleRepoSelected = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setIsGithubMode(true);
    
    const repoContext = `Repository: ${repo.full_name}\n` +
      `Description: ${repo.description || 'No description'}\n` +
      `Language: ${repo.language || 'Unknown'}\n` +
      `Default Branch: ${repo.default_branch}\n` +
      `Type: ${repo.private ? 'Private' : 'Public'} repository\n\n`;
    
    setGithubContext(repoContext);
    
    // Add context to the current input
    setInput(prev => {
      const newInput = `I'm working with this GitHub repository:\n\n${repoContext}` +
        `Please help me analyze and suggest improvements for this codebase. ` +
        `${prev ? '\n\n' + prev : ''}`;
      return newInput;
    });
    
    toast.success(`Repository ${repo.full_name} loaded for AI analysis!`);
  };

  const handlePullRequestCreated = (prUrl: string, repo: GitHubRepo) => {
    toast.success('Pull request created successfully!');
    
    // Add success message to chat
    if (selectedChatId) {
      addMessageMutation({
        chatId: selectedChatId as Id<'chats'>,
        content: `✅ **Pull Request Created Successfully!**\n\n` +
          `Repository: ${repo.full_name}\n` +
          `Pull Request: [View PR](${prUrl})\n\n` +
          `The changes have been applied and are ready for review. ` +
          `You can now review the pull request on GitHub and merge it when ready.`,
        role: 'assistant',
        metadata: { 
          type: 'github_success',
          prUrl,
          repository: repo.full_name
        }
      }).catch(error => {
        logger.error('Failed to add PR success message:', error);
      });
    }
  };

  const detectGithubUrls = (text: string): string[] => {
    const githubUrlRegex = /https?:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+(?:\/[^\s]*)?/g;
    return text.match(githubUrlRegex) || [];
  };

  const enhanceMessageWithGitHub = async (message: string): Promise<string> => {
    let enhancedMessage = message;
    
    // If GitHub mode is active, add repository context
    if (isGithubMode && selectedRepo && githubContext) {
      enhancedMessage = githubContext + '\n' + message;
    }
    
    // Detect and suggest GitHub integration
    const githubUrls = detectGithubUrls(message);
    if (githubUrls.length > 0 && !isGithubMode) {
      enhancedMessage += '\n\n[Assistant Note: I detected GitHub repository URLs in your message. ' +
        'Would you like to use the GitHub integration to analyze the repository, ' +
        'make changes, and create pull requests directly?]';
    }
    
    return enhancedMessage;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--color-chat-bg)]">
        <motion.div 
          className="flex items-center space-x-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground text-lg">Loading ZapDev...</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--color-chat-bg)]">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-6 p-4 rounded-full glass"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bot className="w-full h-full text-primary" />
          </motion.div>
          <h3 className="text-2xl font-semibold mb-3 text-gradient-static">Please Sign In</h3>
          <p className="text-muted-foreground text-lg">You need to be signed in to use ZapDev AI</p>
        </motion.div>
      </div>
    );
  }

  const hasMessages = messages && messages.length > 0;
  const showSplitLayout = sessionStarted || hasMessages;

  return (
    <div className="flex h-full bg-[var(--color-chat-bg)] text-foreground">
      {/* Enhanced Welcome Hero */}
      <AnimatePresence mode="wait">
        {!showSplitLayout && (
          <motion.div 
            key="hero"
            className="flex-1 flex flex-col relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Enhanced animated background */}
            <motion.div
              animate={{
                background: [
                  "radial-gradient(circle at 20% 30%, hsl(262 83% 58% / 0.15) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 70%, hsl(224 82% 60% / 0.15) 0%, transparent 50%)",
                  "radial-gradient(circle at 40% 90%, hsl(280 90% 65% / 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 30%, hsl(262 83% 58% / 0.15) 0%, transparent 50%)",
                ],
              }}
              transition={{ 
                duration: 12, 
                repeat: Infinity, 
                ease: "easeInOut",
                times: [0, 0.33, 0.66, 1]
              }}
              className="absolute inset-0 pointer-events-none"
            />

            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-primary/20 rounded-full"
                  initial={{ 
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    opacity: 0
                  }}
                  animate={{
                    y: [null, -100],
                    opacity: [0, 0.6, 0],
                  }}
                  transition={{
                    duration: 8 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "linear"
                  }}
                />
              ))}
            </div>

            {/* Enhanced main content */}
            <div className="flex-1 flex items-center justify-center px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center max-w-4xl w-full"
              >
                {/* Enhanced logo section */}
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    duration: 1.2, 
                    ease: "easeOut",
                    type: "spring",
                    stiffness: 100
                  }}
                  className="relative mb-8"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/20 to-blue-600/20 blur-xl"
                    />
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="relative w-24 h-24 mx-auto mb-2 glass-elevated rounded-2xl flex items-center justify-center cursor-pointer"
                    >
                      <Zap className="w-12 h-12 text-gradient animate-pulse-glow" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Enhanced title */}
                <motion.h1 
                  className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-gradient animate-gradient tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  ZapDev AI
                </motion.h1>

                <motion.p 
                  className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  Build, code, and create with the most advanced AI development assistant. 
                  From concept to deployment in minutes.
                </motion.p>

                {/* Enhanced feature highlights */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                >
                  {[
                    { icon: Code, title: "Live Code Execution", desc: "Run and test code instantly with E2B sandbox" },
                    { icon: Palette, title: "Smart UI Generation", desc: "Create beautiful interfaces with AI guidance" },
                    { icon: Layers, title: "Full-Stack Development", desc: "Build complete applications end-to-end" }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      className="glass-elevated p-6 rounded-xl glass-hover"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <feature.icon className="w-8 h-8 text-primary mb-3 mx-auto" />
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm text-pretty">{feature.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Enhanced input section */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1 }}
                  className="max-w-3xl mx-auto"
                >
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Enhanced input container */}
                    <div className="relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-blue-600/50 rounded-2xl blur opacity-20"></div>
                      <div className="relative glass-elevated rounded-2xl p-2">
                        <Textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="What would you like to build today? Describe your app, website, or coding challenge..."
                          className="min-h-[120px] max-h-[300px] resize-none border-none bg-transparent text-lg placeholder:text-muted-foreground/70 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none transition-smooth"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              handleSubmit(e);
                            }
                          }}
                        />
                        
                        {/* Enhanced action buttons */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <div className="flex items-center space-x-2">
                            {/* Quick action buttons */}
                            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="glass-hover rounded-lg"
                                  type="button"
                                >
                                  <Search className="w-4 h-4 mr-2" />
                                  Search Web
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="glass-elevated border-white/20">
                                <DialogHeader>
                                  <DialogTitle className="text-gradient-static">Web Search</DialogTitle>
                                </DialogHeader>
                                {/* Search content here */}
                              </DialogContent>
                            </Dialog>

                            <Dialog open={isWebsiteDialogOpen} onOpenChange={setIsWebsiteDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="glass-hover rounded-lg"
                                  type="button"
                                >
                                  <Globe className="w-4 h-4 mr-2" />
                                  Clone Website
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="glass-elevated border-white/20">
                                <DialogHeader>
                                  <DialogTitle className="text-gradient-static">Analyze Website</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Input
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    placeholder="Enter website URL to analyze..."
                                    className="glass"
                                  />
                                  <Button
                                    onClick={() => analyzeWebsite(websiteUrl)}
                                    disabled={isAnalyzingWebsite}
                                    className="button-gradient w-full"
                                  >
                                    {isAnalyzingWebsite ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Analyzing...
                                      </>
                                    ) : (
                                      'Analyze Website'
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>

                          {/* Enhanced send button */}
                          <Button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="button-gradient px-8 py-3 text-base font-semibold transition-smooth"
                          >
                            {isTyping ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <ArrowUp className="w-4 h-4 mr-2" />
                                Start Building
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced keyboard shortcut hint */}
                    <motion.p 
                      className="text-muted-foreground text-sm text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                    >
                      Press <kbd className="glass px-2 py-1 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="glass px-2 py-1 rounded text-xs font-mono">Enter</kbd> to send
                    </motion.p>
                  </form>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Split Layout */}
      <AnimatePresence>
        {showSplitLayout && (
          <motion.div 
            key="split"
            className="flex-1 flex"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Enhanced Left Sidebar */}
            <motion.div
              onMouseEnter={() => setSidebarExpanded(true)}
              onMouseLeave={() => setSidebarExpanded(false)}
              className={`${
                sidebarExpanded ? 'w-80' : 'w-12'
              } glass border-r border-white/10 flex flex-col transition-smooth relative overflow-hidden`}
              animate={{ width: sidebarExpanded ? 320 : 48 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Sidebar header */}
              <div className="p-4 border-b border-white/10">
                <motion.div 
                  className="flex items-center gap-3"
                  animate={{ opacity: sidebarExpanded ? 1 : 0 }}
                  transition={{ delay: sidebarExpanded ? 0.1 : 0 }}
                >
                  <div className="w-8 h-8 glass-elevated rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  {sidebarExpanded && (
                    <div>
                      <h3 className="font-semibold text-gradient-static">ZapDev</h3>
                      <p className="text-xs text-muted-foreground">AI Development Assistant</p>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* New chat button */}
              <div className="p-3">
                <Button
                  onClick={startNewChat}
                  className="w-full glass-hover justify-start"
                  variant="ghost"
                >
                  <Plus className="w-4 h-4" />
                  {sidebarExpanded && <span className="ml-2">New Chat</span>}
                </Button>
              </div>

              {/* Chat list */}
              <ScrollArea className="flex-1 custom-scrollbar">
                <div className="p-3 space-y-2">
                  {chats?.map((chat) => (
                    <motion.button
                      key={chat._id}
                      onClick={() => selectChat(chat._id)}
                      className={`w-full text-left p-3 rounded-lg glass-hover transition-smooth group relative ${
                        selectedChatId === chat._id 
                          ? 'chat-bubble-user' 
                          : 'glass'
                      }`}
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" />
                        {sidebarExpanded && (
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate text-sm">
                              {chat.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(chat.updatedAt)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {sidebarExpanded && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat._id);
                          }}
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>

              {/* Sidebar footer */}
              {sidebarExpanded && (
                <motion.div 
                  className="p-4 border-t border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Enhanced Main Chat Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-chat-bg)]">
              {/* Chat messages */}
              <ScrollArea className="flex-1 custom-scrollbar">
                <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
                  {messages?.map((message, index) => {
                    const isUser = message.role === 'user';
                    const prevMessage = messages[index - 1];
                    const showDateHeader = !prevMessage || !isSameDay(message.createdAt, prevMessage.createdAt);
                    const isFirstInGroup = !prevMessage || prevMessage.role !== message.role;
                    const nextMessage = messages[index + 1];
                    const isLastInGroup = !nextMessage || nextMessage.role !== message.role;

                    return (
                      <motion.div
                        key={message._id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.3,
                          delay: index * 0.05,
                          ease: "easeOut"
                        }}
                        className="space-y-4"
                      >
                        {showDateHeader && (
                          <div className="text-center">
                            <div className="glass px-4 py-2 rounded-full inline-block">
                              <span className="text-sm text-muted-foreground font-medium">
                                {formatDateHeader(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className={`group flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Enhanced Avatar */}
                          {isFirstInGroup && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 }}
                              className="flex-shrink-0"
                            >
                              <Avatar className="h-10 w-10">
                                {isUser ? (
                                  <AvatarImage src={user?.imageUrl} />
                                ) : (
                                  <div className="glass-elevated h-full w-full flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-primary" />
                                  </div>
                                )}
                                <AvatarFallback>
                                  {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-primary" />}
                                </AvatarFallback>
                              </Avatar>
                            </motion.div>
                          )}

                          {/* Enhanced Message Bubble */}
                          <div className={`flex-1 max-w-3xl ${!isFirstInGroup ? (isUser ? 'mr-14' : 'ml-14') : ''}`}>
                            <Card className={`
                              transition-smooth group-hover:scale-[1.01]
                              ${isUser 
                                ? 'chat-bubble-user ml-auto' 
                                : 'chat-bubble-assistant'
                              }
                              ${isFirstInGroup ? '' : (isUser ? 'rounded-tr-lg' : 'rounded-tl-lg')}
                              ${isLastInGroup ? '' : (isUser ? 'rounded-br-lg' : 'rounded-bl-lg')}
                            `}>
                              <CardContent className="p-4 relative">
                                {/* Message content */}
                                <div className="space-y-3">
                                  <SafeText 
                                    className={`text-sm leading-relaxed ${
                                      isUser ? 'text-foreground' : 'text-foreground/90'
                                    }`}
                                  >
                                    {message.content}
                                  </SafeText>
                                  
                                  {/* Message metadata */}
                                  {message.metadata?.model && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Badge variant="outline" className="glass text-xs">
                                        {message.metadata.model}
                                      </Badge>
                                      {message.metadata.tokens && (
                                        <span>{message.metadata.tokens} tokens</span>
                                      )}
                                      {message.metadata.cost && (
                                        <span>${message.metadata.cost.toFixed(4)}</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Enhanced message actions */}
                                <div className={`absolute top-2 ${isUser ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(message.content, message._id)}
                                    className="h-6 w-6 p-0 glass-hover"
                                  >
                                    {copiedMessage === message._id ? (
                                      <Check className="w-3 h-3 text-green-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </Button>
                                </div>

                                {/* Timestamp */}
                                <div className={`text-xs text-muted-foreground mt-2 ${
                                  isUser ? 'text-right' : 'text-left'
                                }`}>
                                  {formatTimestamp(message.createdAt)}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Enhanced typing indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex gap-4"
                      >
                        <Avatar className="h-10 w-10">
                          <div className="glass-elevated h-full w-full flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <Bot className="w-5 h-5 text-primary" />
                            </motion.div>
                          </div>
                        </Avatar>
                        
                        <Card className="chat-bubble-assistant max-w-xs">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">AI is thinking</span>
                              <div className="flex space-x-1">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="w-2 h-2 bg-primary rounded-full"
                                    animate={{ 
                                      scale: [1, 1.2, 1], 
                                      opacity: [0.4, 1, 0.4] 
                                    }}
                                    transition={{ 
                                      duration: 1.5, 
                                      repeat: Infinity, 
                                      delay: i * 0.2 
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* GitHub Mode Indicator */}
              <AnimatePresence>
                {isGithubMode && selectedRepo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="border-t border-white/10 bg-[var(--color-chat-surface)]/30 backdrop-blur-xl"
                  >
                    <div className="max-w-4xl mx-auto p-2">
                      <div className="flex items-center justify-between glass rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">GitHub Mode Active</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img 
                              src={selectedRepo.owner.avatar_url} 
                              alt={selectedRepo.owner.login}
                              className="w-5 h-5 rounded-full"
                            />
                            <span className="text-sm text-muted-foreground">{selectedRepo.full_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {selectedRepo.language || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(selectedRepo.html_url, '_blank')}
                            className="h-6 px-2 text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsGithubMode(false);
                              setSelectedRepo(null);
                              setGithubContext('');
                              toast.info('GitHub mode disabled');
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Input Area */}
              <div className="border-t border-white/10 bg-[var(--color-chat-surface)]/50 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto p-4">
                  <form onSubmit={handleSubmit}>
                    <div className="relative">
                      {/* Input container with enhanced styling */}
                      <div className="glass-elevated rounded-2xl p-3 focus-within:ring-2 focus-within:ring-primary/50 transition-smooth">
                        <Textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Ask me anything about coding, building apps, or development..."
                          className="min-h-[50px] max-h-[200px] resize-none border-none bg-transparent placeholder:text-muted-foreground/60 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none transition-smooth text-base"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              handleSubmit(e);
                            }
                          }}
                        />
                        
                        {/* Enhanced input actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
                          <div className="flex items-center gap-2">
                            {/* Quick action buttons with enhanced styling */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="glass-hover h-8 px-3 text-xs"
                              type="button"
                              onClick={() => setIsSearchOpen(true)}
                            >
                              <Search className="w-3 h-3 mr-1" />
                              Search
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="glass-hover h-8 px-3 text-xs"
                              type="button"
                              onClick={() => setIsWebsiteDialogOpen(true)}
                            >
                              <Globe className="w-3 h-3 mr-1" />
                              Clone
                            </Button>
                            <GitHubIntegration
                              onRepoSelected={handleRepoSelected}
                              onPullRequestCreated={handlePullRequestCreated}
                              className="inline-block"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {input.length}/{MAX_MESSAGE_LENGTH}
                            </span>
                            <Button
                              type="submit"
                              disabled={!input.trim() || isTyping}
                              className="button-gradient h-8 px-4 text-sm font-medium"
                            >
                              {isTyping ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedChatInterface;