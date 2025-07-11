'use client';

import { useEffect, useRef, useCallback, useTransition, useMemo } from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Paperclip,
  Command,
  SendIcon,
  XIcon,
  LoaderIcon,
  Sparkles,
  ImageIcon,
  Figma,
  MonitorIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';
import { useChat } from 'ai/react';
import { groqModelConfigs } from '@/lib/groq-provider';
import { useChatStore } from '@/lib/stores/chat-store';
import BuildingProgress from './building-progress';
import CodeGenerationDisplay from './code-generation-display';
import MessageList from './chat/message-list';
import ChatInput from './chat/chat-input';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

// Add missing utility functions
function filterMessage(content: string): string {
  // Remove any tool calls or special formatting from assistant messages
  return content
    .replace(/\[tool_call:.*?\]/g, '')
    .replace(/\[\/tool_call\]/g, '')
    .trim();
}

function extractCodeFromMessage(content: string): string | null {
  // Extract code blocks from markdown
  const codeBlockRegex = /```(?:[\w+]+)?\n([\s\S]*?)```/g;
  const matches = content.match(codeBlockRegex);
  
  if (matches && matches.length > 0) {
    // Return the first code block without the markdown formatting
    return matches[0].replace(/```[\w+]*\n?/g, '').replace(/```$/g, '');
  }
  
  return null;
}

// Throttle function for performance optimization
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  return function (this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    // Debounce the resize event for better performance
    const handleResize = () => {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(() => adjustHeight());
      } else {
        setTimeout(adjustHeight, 66); // ~15fps
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

// Memoize the Textarea component for better performance
const Textarea = React.memo(
  React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, containerClassName, showRing = true, ...props }, ref) => {
      const [isFocused, setIsFocused] = React.useState(false);

      return (
        <div className={cn('relative', containerClassName)}>
          <textarea
            className={cn(
              'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
              'transition-all duration-200 ease-in-out',
              'placeholder:text-muted-foreground',
              'disabled:cursor-not-allowed disabled:opacity-50',
              showRing
                ? 'focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
                : '',
              className
            )}
            ref={ref}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {showRing && isFocused && (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-violet-500/30 ring-offset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}

          {props.onChange && (
            <div
              className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-violet-500 opacity-0"
              style={{
                animation: 'none',
              }}
              id="textarea-ripple"
            />
          )}
        </div>
      );
    }
  )
);
Textarea.displayName = 'Textarea';

interface AnimatedAIChatProps {
  chatId?: string;
  onFirstMessageSent?: () => void;
  onCodeGenerated?: (code: string) => void;
  onAITeamBuild?: (projectData: any) => void;
  className?: string;
  useMultipleModels?: boolean;
  showThinking?: boolean;
  currentResponse?: string;
  isThinking?: boolean;
}

// Memoize command suggestions to prevent unnecessary recreations
const commandSuggestions: CommandSuggestion[] = [
  {
    icon: <ImageIcon className="h-4 w-4" />,
    label: 'Clone UI',
    description: 'Generate a UI from a screenshot',
    prefix: '/clone',
  },
  {
    icon: <Figma className="h-4 w-4" />,
    label: 'Import Figma',
    description: 'Import a design from Figma',
    prefix: '/figma',
  },
  {
    icon: <MonitorIcon className="h-4 w-4" />,
    label: 'Create Page',
    description: 'Generate a new web page',
    prefix: '/page',
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    label: 'Improve',
    description: 'Improve existing UI design',
    prefix: '/improve',
  },
];

export function AnimatedAIChat({
  chatId = 'default',
  onFirstMessageSent,
  onCodeGenerated,
  onAITeamBuild,
  className,
  useMultipleModels = false,
  showThinking = false,
  currentResponse = '',
  isThinking = false,
}: AnimatedAIChatProps) {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Get state from Zustand store
  const {
    messages,
    isTyping,
    isLoadingMessages,
    supabaseChatId,
    selectedModel,
    useReasoning,
    reasoningFormat,
    showBuildingProgress,
    showCodeGeneration,
    currentBuildStep,
    isBuilding,
    showReasoning,

    // Actions
    setChatId,
    setSupabaseChatId,
    setMessages,
    setIsTyping,
    setIsLoadingMessages,
    setBuildingProgress,
    setCodeGeneration,
    setCurrentBuildStep,
    setIsBuilding,
    addMessage,
    updateMessage,
    retryMessage,
    removeMessage,
  } = useChatStore();

  // Use Vercel AI SDK's useChat hook with Groq reasoning
  const { append, setMessages: setAIMessages } = useChat({
    api: '/api/chat',
    id: chatId,
    body: {
      modelId: selectedModel,
      chatId: supabaseChatId,
      useMultipleModels,
      useReasoning,
      reasoningFormat,
    },
    initialMessages: messages,
    onResponse: async (response) => {
      // Get the Supabase chat ID from response headers
      const newChatId = response.headers.get('X-Chat-ID');
      if (newChatId && newChatId !== supabaseChatId) {
        setSupabaseChatId(newChatId);
      }

      // Check for build triggers
      const buildTriggered = response.headers.get('X-Build-Triggered');
      const aiTeamTriggered = response.headers.get('X-AI-Team-Triggered');

      if (buildTriggered && onCodeGenerated) {
        errorLogger.info(
          ErrorCategory.AI_MODEL,
          'Build triggered - will extract code when response completes'
        );
      }

      if (aiTeamTriggered && onAITeamBuild) {
        errorLogger.info(
          ErrorCategory.AI_MODEL,
          'AI Team triggered - will initialize WebContainer'
        );
      }
    },
    onFinish: async (message, options) => {
      // Extract and send code when AI finishes responding
      if (message.role === 'assistant' && onCodeGenerated) {
        const extractedCode = extractCodeFromMessage(message.content);
        if (extractedCode) {
          errorLogger.info(
            ErrorCategory.AI_MODEL,
            'Code extracted, sending to WebContainer:',
            extractedCode.substring(0, 100) + '...'
          );
          onCodeGenerated(extractedCode);
        }
      }

      // Check if this is an AI team build response
      if (message.role === 'assistant' && onAITeamBuild) {
        // Check if the message contains code or project instructions
        const hasCode =
          message.content.includes('```') ||
          /\b(component|app|website|project)\b/i.test(message.content);

        if (hasCode) {
          errorLogger.info(
            ErrorCategory.AI_MODEL,
            'AI Team project detected, triggering WebContainer'
          );
          const projectData = {
            instructions: message.content,
            code: extractCodeFromMessage(message.content),
            timestamp: Date.now(),
          };
          onAITeamBuild(projectData);
        }
      }
    },
  });

  // Load existing messages from Supabase when chat ID changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId || chatId === 'new' || chatId === 'default') return;

      setIsLoadingMessages(true);
      try {
        const response = await fetch(`/api/chat/messages?chatId=${chatId}`);
        if (response.ok) {
          const { messages: existingMessages, chatId: validChatId } = await response.json();

          if (validChatId) {
            setSupabaseChatId(validChatId);
          }

          if (existingMessages && existingMessages.length > 0) {
            const formattedMessages = existingMessages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: new Date(msg.created_at),
              reasoning: msg.reasoning,
              status: 'sent',
            }));
            setMessages(formattedMessages);
            setAIMessages(formattedMessages);
          }
        }
      } catch (error) {
        errorLogger.error(ErrorCategory.AI_MODEL, 'Failed to load messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [chatId, setMessages, setAIMessages, setSupabaseChatId, setIsLoadingMessages]);

  // Update chat ID in store when prop changes
  useEffect(() => {
    setChatId(chatId || null);
  }, [chatId, setChatId]);

  // Filter messages to remove tool calls
  const filteredMessages = useMemo(() => {
    return messages.map((msg) => ({
      ...msg,
      content: msg.role === 'assistant' ? filterMessage(msg.content) : msg.content,
    }));
  }, [messages]);

  // Handle sending messages
  const handleSendMessage = async (message: string) => {
    if (onFirstMessageSent) {
      onFirstMessageSent();
    }

    // Check if this is a code generation request
    const isCodeRequest =
      /\b(build|create|make|generate|code|app|website|component|function)\b/i.test(message);
    const isFeatureRequest = /\b(add|implement|include|feature|button|form|page)\b/i.test(message);

    if (isCodeRequest || isFeatureRequest) {
      setIsBuilding(true);
      setBuildingProgress(true);
      setCurrentBuildStep('analyze');

      // Show code generation after a delay
      setTimeout(() => {
        setBuildingProgress(false);
        setCodeGeneration(true);
      }, 8000);
    }

    // Add message with optimistic update
    const newMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: message,
      createdAt: new Date(),
      status: 'sending' as const,
    };

    addMessage(newMessage);
    setIsTyping(true);

    try {
      await append({ role: 'user', content: message });
      updateMessage(newMessage.id, { status: 'sent' });
    } catch (error) {
      errorLogger.error(ErrorCategory.AI_MODEL, 'Failed to send message:', error);
      updateMessage(newMessage.id, { status: 'failed' });
    } finally {
      setIsTyping(false);
    }
  };

  // Handle message retry
  const handleRetryMessage = async (messageId: string) => {
    const message = messages.find((msg) => msg.id === messageId);
    if (message && message.status === 'failed') {
      retryMessage(messageId);
      try {
        await append({ role: message.role, content: message.content });
        updateMessage(messageId, { status: 'sent' });
      } catch (error) {
        errorLogger.error(ErrorCategory.AI_MODEL, 'Failed to retry message:', error);
        updateMessage(messageId, { status: 'failed' });
      }
    }
  };

  // Memoize the background gradient elements to prevent unnecessary re-renders
  const backgroundGradients = useMemo(
    () => (
      <div className="pointer-events-none">
        <div className="absolute -left-20 top-24 h-[500px] w-[500px] rounded-full bg-[#6C52A0]/10 blur-[150px]" />
        <div className="absolute -right-20 bottom-24 h-[500px] w-[500px] rounded-full bg-[#A0527C]/10 blur-[150px]" />
      </div>
    ),
    []
  );

  return (
    <div className={cn('flex h-full w-full flex-col overflow-hidden', className)}>
      {/* Visual Progress Components */}
      {showBuildingProgress && (
        <div className="p-6">
          <BuildingProgress
            isVisible={showBuildingProgress}
            currentStep={currentBuildStep}
            onComplete={() => {
              setBuildingProgress(false);
              setCodeGeneration(true);
            }}
          />
        </div>
      )}

      {showCodeGeneration && (
        <div className="p-6">
          <CodeGenerationDisplay
            isVisible={showCodeGeneration}
            onComplete={() => {
              setCodeGeneration(false);
              setIsBuilding(false);
            }}
          />
        </div>
      )}

      {/* Message List Component */}
      <MessageList
        messages={filteredMessages}
        isTyping={isTyping}
        selectedModel={selectedModel}
        showReasoning={showReasoning}
        onRetry={handleRetryMessage}
        onDelete={removeMessage}
        className="flex-grow"
      />

      {/* Background gradients */}
      {backgroundGradients}

      {/* Chat Input Component */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoadingMessages} />
    </div>
  );
}

// Typing dots component
const TypingDots = React.memo(function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-white/60">ZapDev is thinking</span>
      <div className="ml-2 flex gap-1">
        <div
          className="h-1 w-1 animate-bounce rounded-full bg-white/40"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="h-1 w-1 animate-bounce rounded-full bg-white/40"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="h-1 w-1 animate-bounce rounded-full bg-white/40"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
});
