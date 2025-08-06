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
  ShieldX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { streamAIResponse } from '@/lib/ai';
import { executeCode } from '@/lib/sandbox.ts';
import { useAuth } from '@/hooks/useAuth';
import { E2BCodeExecution } from './E2BCodeExecution';
import { MessageEncryption, isEncryptedMessage } from '@/lib/message-encryption';
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
  const [newChatTitle, setNewChatTitle] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  
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
        const validation = validateInput(newChatTitle, MAX_TITLE_LENGTH);
        if (!validation.isValid) {
          toast.error(validation.error);
          span.setAttribute("validation_error", validation.error);
          return;
        }
        
        if (newChatTitle.trim().length < MIN_TITLE_LENGTH) {
          toast.error('Chat title must be at least 1 character');
          span.setAttribute("validation_error", "title_too_short");
          return;
        }
        
        try {
          span.setAttribute("chat_title", newChatTitle.trim());
          logger.info("Creating new chat", { title: newChatTitle.trim() });
          
          const sanitizedTitle = sanitizeText(newChatTitle.trim());
          const chatId = await createChat({ title: sanitizedTitle });
          
          setSelectedChatId(chatId);
          setNewChatTitle('');
          setIsNewChatOpen(false);
          
          span.setAttribute("chat_id", chatId);
          logger.info("Chat created successfully", { chatId, title: sanitizedTitle });
          toast.success('New chat created!');
        } catch (error) {
          logger.error("Error creating chat", { 
            error: error instanceof Error ? error.message : String(error),
            title: newChatTitle.trim()
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

          // Stream AI response
          const streamResult = await streamAIResponse(userContent);
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

  return (
    <div className="flex h-full bg-background">
      {/* Chat Sidebar */}
      <div className="w-80 border-r bg-card/50 backdrop-blur-sm">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chats
            </h2>
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Enter chat title..."
                    value={newChatTitle}
                    onChange={(e) => setNewChatTitle(e.target.value.substring(0, MAX_TITLE_LENGTH))}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateChat()}
                    maxLength={MAX_TITLE_LENGTH}
                  />
                  <div className="text-xs text-muted-foreground">
                    {newChatTitle.length}/{MAX_TITLE_LENGTH} characters
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsNewChatOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateChat} disabled={!newChatTitle.trim()}>
                      Create Chat
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-80px)]">
          <div className="p-2">
            {chats?.map((chat) => (
              <motion.div
                key={chat._id}
                layout
                className={`group relative p-3 rounded-lg cursor-pointer transition-all mb-2 ${
                  selectedChatId === chat._id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedChatId(chat._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">
                      <SafeText>{chat.title}</SafeText>
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimestamp(chat.updatedAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
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
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No chats yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create your first chat to get started</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area with animated background */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Animated background gradient */}
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none"
        />
        {selectedChatId ? (
          <>
            {/* Chat Header with animation */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-b bg-card/30 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 mr-2 text-primary" />
                    </motion.div>
                    AI Assistant with E2B
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    <SafeText>{chats?.find(c => c._id === selectedChatId)?.title || 'Chat'}</SafeText>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                      Next.js + E2B Ready
                    </Badge>
                  </motion.div>
                  
                  {/* Encryption toggle and status */}
                  <Button
                    size="sm"
                    variant={encryptionEnabled ? "default" : "outline"}
                    onClick={() => encryptionInitialized && setEncryptionEnabled(!encryptionEnabled)}
                    disabled={!encryptionInitialized}
                    className={`h-7 px-2 text-xs ${!encryptionInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={
                      !encryptionInitialized 
                        ? "Encryption unavailable - initialization failed" 
                        : encryptionEnabled 
                          ? "Encryption enabled" 
                          : "Encryption disabled"
                    }
                  >
                    {!encryptionInitialized ? (
                      <>
                        <Shield className="w-3 h-3 mr-1" />
                        Unavailable
                      </>
                    ) : encryptionEnabled ? (
                      <>
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Encrypted
                      </>
                    ) : (
                      <>
                        <ShieldX className="w-3 h-3 mr-1" />
                        Plaintext
                      </>
                    )}
                  </Button>
                  
                  <Badge variant="secondary" className="text-xs">
                    {messages?.length || 0} messages
                  </Badge>
                </div>
              </div>
            </motion.div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-4xl mx-auto space-y-6">
                <AnimatePresence>
                  {messages?.map((message) => (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <Avatar className="w-8 h-8 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10">
                            <Bot className="w-4 h-4 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[70%] ${message.role === 'user' ? 'order-1' : ''}`}>
                        <Card className={`${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-card border-muted'
                        }`}>
                          <CardContent className="p-4">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <div className="whitespace-pre-wrap">
                                <SafeText>{getMessageContent(message)}</SafeText>
                              </div>
                              
                              {/* Encryption indicator */}
                              {message.isEncrypted && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>End-to-end encrypted</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Code blocks with E2B execution */}
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
                                  onExecute={async (code, language) => {
                                    const result = await executeCode(code, language as 'python' | 'javascript');
                                    return {
                                      success: result.success,
                                      output: result.stdout,
                                      error: result.error as string | undefined,
                                      logs: result.stderr ? [result.stderr] : [],
                                      executionTime: Date.now() % 1000, // Mock execution time
                                    };
                                  }}
                                  showNextJsHint={block.language.toLowerCase() === 'javascript' || block.language.toLowerCase() === 'typescript'}
                                />
                              </motion.div>
                            ))}
                            
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(message.createdAt)}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
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
                        <Avatar className="w-8 h-8 border-2 border-muted">
                          <AvatarImage src={user?.avatarUrl} />
                          <AvatarFallback>
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
                    <Avatar className="w-8 h-8 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="w-4 h-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </motion.div>
                          <motion.span
                            className="text-sm text-purple-700 dark:text-purple-300 font-medium"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            Generating Next.js code with E2B...
                          </motion.span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Form with enhanced styling */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-t bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 backdrop-blur-sm"
            >
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value.substring(0, MAX_MESSAGE_LENGTH))}
                      placeholder="Ask me anything..."
                      className="min-h-[44px] max-h-32 resize-none"
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
                    className="h-11 px-6"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {input.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
              </form>
            </motion.div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-16 h-16 mx-auto mb-4 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Welcome to ZapDev AI</h3>
              <p className="text-muted-foreground mb-4">Create Next.js applications with E2B integration</p>
              <Button onClick={() => setIsNewChatOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;