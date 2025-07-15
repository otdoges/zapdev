'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from 'ai/react';
import {
  Send,
  Paperclip,
  Image,
  Code2,
  Sparkles,
  User,
  Bot,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Loader2,
  ChevronDown,
  Zap,
  Monitor,
  FileCode,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { groqModelConfigs } from '@/lib/groq-provider';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  hasCode?: boolean;
  reasoning?: string;
}

interface ChatInterfaceEnhancedProps {
  onCodeGenerated?: (code: string) => void;
  onProjectCreated?: (project: any) => void;
  className?: string;
  chatId?: string;
}

const suggestions = [
  {
    icon: <Globe className="h-4 w-4" />,
    text: 'Create a modern landing page',
    category: 'Web Development',
  },
  {
    icon: <Monitor className="h-4 w-4" />,
    text: 'Build a dashboard with charts',
    category: 'UI/UX',
  },
  {
    icon: <FileCode className="h-4 w-4" />,
    text: 'Generate a React component',
    category: 'Components',
  },
  {
    icon: <Zap className="h-4 w-4" />,
    text: 'Create an API endpoint',
    category: 'Backend',
  },
];

export function ChatInterfaceEnhanced({
  onCodeGenerated,
  onProjectCreated,
  className,
  chatId,
}: ChatInterfaceEnhancedProps) {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedModel, setSelectedModel] = useState('moonshotai/kimi-k2-instruct');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append, reload } = useChat({
    api: '/api/chat',
    id: chatId,
    body: {
      modelId: selectedModel,
      chatId: chatId,
    },
    onResponse: (response) => {
      setShowSuggestions(false);
    },
    onFinish: (message) => {
      // Extract code if present
      const codeBlocks = message.content.match(/```[\s\S]*?```/g);
      if (codeBlocks && onCodeGenerated) {
        const code = codeBlocks[0].replace(/```[\w]*\n?/g, '').replace(/```$/g, '');
        onCodeGenerated(code);
      }

      // Check for project creation
      if (message.content.toLowerCase().includes('project') && onProjectCreated) {
        onProjectCreated({
          name: 'Generated Project',
          code: codeBlocks?.[0] || '',
          timestamp: new Date(),
        });
      }
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const extractCodeFromMessage = (content: string) => {
    const codeBlockRegex = /```(?:[\w+]+)?\n([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];
    return matches.map((match) => match[1]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatMessage = (content: string) => {
    // Split content by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```[\w]*\n?/g, '').replace(/```$/g, '');
        const language = part.match(/```(\w+)/)?.[1] || 'text';

        return (
          <div key={index} className="my-4">
            <div className="flex items-center justify-between rounded-t-lg bg-muted px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">{language}</span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code)}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-b-lg bg-black p-4 text-sm text-green-400">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      return (
        <div key={index} className="whitespace-pre-wrap">
          {part}
        </div>
      );
    });
  };

  return (
    <TooltipProvider>
      <div className={cn('flex h-full flex-col', className)}>
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/zapdev-logo.svg" alt="ZapDev" />
              <AvatarFallback>
                <Zap className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-semibold">ZapDev AI</h2>
              <p className="text-xs text-muted-foreground">
                Powered by {groqModelConfigs.find((m) => m.id === selectedModel)?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {messages.length} messages
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {/* Welcome message */}
            {messages.length === 0 && showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-2">
                  <h3 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                    What would you like to build?
                  </h3>
                  <p className="text-muted-foreground">
                    Describe your project and I'll help you create it with live preview
                  </p>
                </div>

                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className="cursor-pointer transition-all hover:scale-105 hover:shadow-md"
                        onClick={() => handleSuggestionClick(suggestion.text)}
                      >
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-center gap-2">
                            {suggestion.icon}
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.category}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{suggestion.text}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Message list */}
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex gap-4',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="mt-1 h-8 w-8">
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      'max-w-[80%] space-y-2',
                      message.role === 'user' ? 'order-first' : ''
                    )}
                  >
                    <Card
                      className={cn(
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {message.role === 'assistant' ? (
                            <div className="space-y-3">{formatMessage(message.content)}</div>
                          ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          )}

                          {/* Message actions */}
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 pt-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <ThumbsUp className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Good response</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <ThumbsDown className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Poor response</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => reload()}>
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Regenerate</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(message.content)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy message</TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{message.timestamp?.toLocaleTimeString()}</span>
                      {extractCodeFromMessage(message.content).length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Code2 className="mr-1 h-3 w-3" />
                          Contains code
                        </Badge>
                      )}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="mt-1 h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Describe what you want to build..."
                className="max-h-[200px] min-h-[60px] resize-none pr-12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />

              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" type="button">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach file</TooltipContent>
                </Tooltip>

                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="rounded border bg-transparent px-2 py-1 text-xs"
                >
                  {groqModelConfigs.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>AI-powered development</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
}
