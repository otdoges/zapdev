"use client"

import { useEffect, useRef, useCallback, useTransition, useMemo } from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Paperclip, Command, SendIcon, XIcon, LoaderIcon, Sparkles, ImageIcon, Figma, MonitorIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import * as React from "react"
import { useChat, type Message } from "ai/react"
import { groqModelConfigs } from "@/lib/groq-provider"
import BuildingProgress from "./building-progress"
import CodeGenerationDisplay from "./code-generation-display"

// Throttle function for performance optimization
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  return function(this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

interface UseAutoResizeTextareaProps {
  minHeight: number
  maxHeight?: number
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return

      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }

      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY))

      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight],
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = `${minHeight}px`
    }
  }, [minHeight])

  useEffect(() => {
    // Debounce the resize event for better performance
    const handleResize = () => {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(() => adjustHeight());
      } else {
        setTimeout(adjustHeight, 66); // ~15fps
      }
    };
    
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

interface CommandSuggestion {
  icon: React.ReactNode
  label: string
  description: string
  prefix: string
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string
  showRing?: boolean
}

// Memoize the Textarea component for better performance
const Textarea = React.memo(React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className,
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {showRing && isFocused && (
          <motion.span
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-violet-500 rounded-full"
            style={{
              animation: "none",
            }}
            id="textarea-ripple"
          />
        )}
      </div>
    )
  }
))
Textarea.displayName = "Textarea"

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
    icon: <ImageIcon className="w-4 h-4" />,
    label: "Clone UI",
    description: "Generate a UI from a screenshot",
    prefix: "/clone",
  },
  {
    icon: <Figma className="w-4 h-4" />,
    label: "Import Figma",
    description: "Import a design from Figma",
    prefix: "/figma",
  },
  {
    icon: <MonitorIcon className="w-4 h-4" />,
    label: "Create Page",
    description: "Generate a new web page",
    prefix: "/page",
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    label: "Improve",
    description: "Improve existing UI design",
    prefix: "/improve",
  },
];

// Function to extract code from AI messages
const extractCodeFromMessage = (content: string): string => {
  // Look for HTML code blocks
  const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/);
  if (htmlMatch) return htmlMatch[1];
  
  // Look for any code blocks
  const codeMatch = content.match(/```\w*\n([\s\S]*?)\n```/);
  if (codeMatch) return codeMatch[1];
  
  // Look for HTML-like content
  const htmlPattern = /<(?:html|div|section|article|main|header|footer|nav|aside)[^>]*>/i;
  if (htmlPattern.test(content)) {
    return content;
  }
  
  return "";
};

// Function to filter out tool calls and clean up AI responses
const filterMessage = (content: string): string => {
  // Remove tool call patterns and technical explanations
  const toolCallPatterns = [
    /\[Tool Call[^\]]*\][^[]*/g,
    /\[Function Call[^\]]*\][^[]*/g,
    /\<function_calls\>[\s\S]*?\<\/antml:function_calls\>/g,
    /\<invoke[^>]*\>[\s\S]*?\<\/antml:invoke\>/g,
    /I'll help you[\s\S]*?Let me start by/g,
    /I need to[\s\S]*?first\./g,
    /Let me examine[\s\S]*?understand/g,
    /\[API Call[^\]]*\][^[]*/g,
    /```json\s*{[^}]*"tool"[^}]*}[^`]*```/g,
  ];
  
  let filteredContent = content;
  toolCallPatterns.forEach(pattern => {
    filteredContent = filteredContent.replace(pattern, '');
  });
  
  // Clean up extra whitespace
  filteredContent = filteredContent.replace(/\n{3,}/g, '\n\n').trim();
  
  return filteredContent;
};

export function AnimatedAIChat({ 
  chatId = "default", 
  onFirstMessageSent, 
  onCodeGenerated, 
  onAITeamBuild,
  className,
  useMultipleModels = false,
  showThinking = false,
  currentResponse = "",
  isThinking = false
}: AnimatedAIChatProps) {
  const [value, setValue] = useState("")
  const [attachments, setAttachments] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [recentCommand, setRecentCommand] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  })
  const [inputFocused, setInputFocused] = useState(false)
  const commandPaletteRef = useRef<HTMLDivElement>(null)
  const [isSplitScreen, setIsSplitScreen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  // Use Groq reasoning models by default
  const groqModelIds = groqModelConfigs.map(config => config.id);
  const fallbackModel = 'deepseek-r1-distill-qwen-32b';
  const [selectedModel, setSelectedModel] = useState(groqModelIds[0] ?? fallbackModel)
  const [useReasoning, setUseReasoning] = useState(true)
  const [reasoningFormat, setReasoningFormat] = useState<'parsed' | 'hidden' | 'raw'>('parsed')
  
  // Visual progress states
  const [showBuildingProgress, setShowBuildingProgress] = useState(false)
  const [showCodeGeneration, setShowCodeGeneration] = useState(false)
  const [currentBuildStep, setCurrentBuildStep] = useState('analyze')
  const [isBuilding, setIsBuilding] = useState(false)
  
  // Track the actual Supabase chat ID
  const [supabaseChatId, setSupabaseChatId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Use Vercel AI SDK's useChat hook with Groq reasoning
  const { messages, isLoading: isTyping, append, setMessages, data } = useChat({
    api: "/api/chat",
    id: chatId,
    body: {
      modelId: selectedModel,
      chatId: supabaseChatId,
      useMultipleModels,
      useReasoning,
      reasoningFormat,
    },
    initialMessages,
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
        console.log('Build triggered - will extract code when response completes');
      }
      
      if (aiTeamTriggered && onAITeamBuild) {
        console.log('AI Team triggered - will initialize WebContainer');
      }
    },
    onFinish: async (message, options) => {
      // Extract and send code when AI finishes responding
      if (message.role === 'assistant' && onCodeGenerated) {
        const extractedCode = extractCodeFromMessage(message.content);
        if (extractedCode) {
          console.log('Code extracted, sending to WebContainer:', extractedCode.substring(0, 100) + '...');
          onCodeGenerated(extractedCode);
        }
      }

      // Check if this is an AI team build response
      if (message.role === 'assistant' && onAITeamBuild) {
        // Check if the message contains code or project instructions
        const hasCode = message.content.includes('```') || 
                       /\b(component|app|website|project)\b/i.test(message.content);
        
        if (hasCode) {
          console.log('AI Team project detected, triggering WebContainer');
          const projectData = {
            instructions: message.content,
            code: extractCodeFromMessage(message.content),
            timestamp: Date.now()
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
              createdAt: msg.created_at
            }));
            setInitialMessages(formattedMessages);
            setMessages(formattedMessages);
          }
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [chatId, setMessages]);

  // Filter messages to remove tool calls
  const filteredMessages = useMemo(() => {
    return messages.map(msg => ({
      ...msg,
      content: msg.role === 'assistant' ? filterMessage(msg.content) : msg.content
    }));
  }, [messages]);

  // State for reasoning display
  const [showReasoning, setShowReasoning] = useState(true);
  const [reasoningData, setReasoningData] = useState<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !target.closest('[data-command-button]')
      ) {
        setShowCommandPalette(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const handleInput = () => adjustHeight()
      textarea.addEventListener("input", handleInput)
      return () => textarea.removeEventListener("input", handleInput)
    }
  }, [adjustHeight])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }

    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveSuggestion((prev) => (prev < commandSuggestions.length - 1 ? prev + 1 : prev))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === "Enter" && activeSuggestion >= 0) {
        e.preventDefault()
        selectCommandSuggestion(activeSuggestion)
      } else if (e.key === "Escape") {
        setShowCommandPalette(false)
        setActiveSuggestion(-1)
      }
    }
  }

  const handleSendMessage = async () => {
    if (!value.trim() || isTyping) return

    const userMessage = value
    setValue("")
    adjustHeight(true)
    
    if (onFirstMessageSent) {
      onFirstMessageSent()
    }

    // Check if this is a code generation request
    const isCodeRequest = /\b(build|create|make|generate|code|app|website|component|function)\b/i.test(userMessage)
    const isFeatureRequest = /\b(add|implement|include|feature|button|form|page)\b/i.test(userMessage)
    
    if (isCodeRequest || isFeatureRequest) {
      setIsBuilding(true)
      setShowBuildingProgress(true)
      setCurrentBuildStep('analyze')
      
      // Show code generation after a delay
      setTimeout(() => {
        setShowBuildingProgress(false)
        setShowCodeGeneration(true)
      }, 8000) // Show building progress for 8 seconds
    }

    await append({ role: "user", content: userMessage })
  }

  const handleAttachFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newAttachments = Array.from(files).map((file) => file.name)
      setAttachments((prev) => [...prev, ...newAttachments])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index]
    setValue(selectedCommand.prefix + " ")
    setShowCommandPalette(false)
    setActiveSuggestion(-1)
    textareaRef.current?.focus()
    setRecentCommand(selectedCommand.label)
    setTimeout(() => setRecentCommand(null), 2000)
  }

  // Memoize the background gradient elements to prevent unnecessary re-renders
  const backgroundGradients = useMemo(() => (
    <div className="pointer-events-none">
      <div className="absolute top-24 -left-20 w-[500px] h-[500px] bg-[#6C52A0]/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-24 -right-20 w-[500px] h-[500px] bg-[#A0527C]/10 rounded-full blur-[150px]" />
    </div>
  ), [])

  return (
    <div className={cn("flex flex-col h-full w-full overflow-hidden", className)}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
      />

      {/* Visual Progress Components */}
      {showBuildingProgress && (
        <div className="p-6">
          <BuildingProgress 
            isVisible={showBuildingProgress}
            currentStep={currentBuildStep}
            onComplete={() => {
              setShowBuildingProgress(false)
              setShowCodeGeneration(true)
            }}
          />
        </div>
      )}
      
      {showCodeGeneration && (
        <div className="p-6">
          <CodeGenerationDisplay 
            isVisible={showCodeGeneration}
            onComplete={() => {
              setShowCodeGeneration(false)
              setIsBuilding(false)
            }}
          />
        </div>
      )}

      {/* Message list - flexible height container that grows to fill available space */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400">
            <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-r from-[#6C52A0]/20 to-[#A0527C]/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white/40" />
            </div>
            <h2 className="text-2xl font-medium mb-2 text-white/80">
              ZapDev Studio
            </h2>
            <p className="max-w-sm text-white/60 text-sm leading-relaxed">
              Ask me to build a website, design a UI, or explain tech concepts. I'll help translate your
              ideas into code and design.
            </p>
          </div>
        ) : (
          <motion.div 
            className="space-y-8 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filteredMessages.map((message, index) => (
              <motion.div
                key={index}
                className={cn(
                  "flex flex-col gap-2",
                  message.role === "user" ? "items-end" : "items-start"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: Math.min(0.1 * index, 0.5),
                  duration: 0.3 
                }}
                layout={false}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-gradient-to-br from-[#6C52A0]/80 to-[#A0527C]/80 text-white"
                      : "bg-white/[0.03] border border-white/[0.05] text-white/90"
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
                
                {/* Show reasoning for assistant messages when available */}
                {message.role === "assistant" && message.reasoning && (
                  <motion.div
                    className="max-w-[80%] w-full"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                  >
                    <details className="group">
                      <summary className="cursor-pointer flex items-center gap-2 text-xs text-white/60 hover:text-white/80 transition-colors mb-2">
                        <Sparkles className="w-3 h-3" />
                        <span>View Reasoning Process</span>
                        <span className="text-xs bg-white/[0.05] px-2 py-0.5 rounded">
                          {groqModelConfigs.find(m => m.id === selectedModel)?.name || 'Reasoning Model'}
                        </span>
                      </summary>
                      <div className="bg-white/[0.02] border border-white/[0.03] rounded-xl p-4 mt-2">
                        <div className="text-xs text-white/40 mb-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          AI Reasoning Steps
                        </div>
                        <div className="text-sm text-white/70 whitespace-pre-wrap font-mono leading-relaxed">
                          {message.reasoning}
                        </div>
                      </div>
                    </details>
                  </motion.div>
                )}
              </motion.div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/[0.03] border border-white/[0.05] text-white/90 rounded-2xl px-4 py-3">
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Background gradients */}
      {backgroundGradients}
      
      {/* Input area - fixed at the bottom */}
      <div className="w-full mx-auto p-4">
        <div className="w-full mx-auto relative max-w-2xl">
          <motion.div
            className="relative z-10 space-y-6 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            layout={false}
          >
            <motion.div
              className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              layout={false}
            >
              <AnimatePresence>
                {showCommandPalette && (
                  <motion.div
                    ref={commandPaletteRef}
                    className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="py-1 bg-black/95">
                      {commandSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.prefix}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                            activeSuggestion === index ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5",
                          )}
                          onClick={() => selectCommandSuggestion(index)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(0.03 * index, 0.1) }}
                        >
                          <div className="w-5 h-5 flex items-center justify-center text-white/60">{suggestion.icon}</div>
                          <div className="font-medium">{suggestion.label}</div>
                          <div className="text-white/40 text-xs ml-1">{suggestion.prefix}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-4">
                <Textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value)
                    adjustHeight()
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Ask zap a question..."
                  containerClassName="w-full"
                  className={cn(
                    "w-full px-4 py-3",
                    "resize-none",
                    "bg-transparent",
                    "border-none",
                    "text-white/90 text-sm",
                    "focus:outline-none",
                    "placeholder:text-white/20",
                    "min-h-[60px]",
                  )}
                  style={{
                    overflow: "hidden",
                  }}
                  showRing={false}
                />
              </div>

              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div
                    className="px-4 pb-3 flex gap-2 flex-wrap"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {attachments.map((file, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-2 text-xs bg-white/[0.03] py-1.5 px-3 rounded-lg text-white/70"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <span>{file}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAttachFile}
                    className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
                    data-command-button
                    disabled={isTyping}
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowCommandPalette(!showCommandPalette)}
                    className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
                    data-command-button
                    disabled={isTyping}
                  >
                    <Command className="w-4 h-4" />
                  </button>
                  
                  {/* Reasoning Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUseReasoning(!useReasoning)}
                      className={cn(
                        "flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors",
                        useReasoning 
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                          : "text-white/40 hover:text-white/70"
                      )}
                      disabled={isTyping}
                    >
                      <Sparkles className="w-3 h-3" />
                      {useReasoning ? "Reasoning ON" : "Reasoning OFF"}
                    </button>
                    
                    {useReasoning && (
                      <select
                        value={reasoningFormat}
                        onChange={(e) => setReasoningFormat(e.target.value as 'parsed' | 'hidden' | 'raw')}
                        className="text-xs bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1 text-white/70"
                        disabled={isTyping}
                      >
                        <option value="parsed">Parsed</option>
                        <option value="hidden">Hidden</option>
                        <option value="raw">Raw</option>
                      </select>
                    )}
                  </div>
                  
                  {/* Model Selection */}
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="text-xs bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1 text-white/70"
                    disabled={isTyping}
                  >
                    {groqModelConfigs.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.name} {config.isReasoning ? "🧠" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {isPending && (
                    <LoaderIcon className="w-4 h-4 animate-spin text-white/40" />
                  )}
                  <button
                    onClick={handleSendMessage}
                    disabled={!value.trim() || isTyping}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                      value.trim() && !isTyping
                        ? "bg-gradient-to-r from-[#6C52A0] to-[#A0527C] text-white hover:scale-105"
                        : "bg-white/[0.05] text-white/30 cursor-not-allowed"
                    )}
                  >
                    <SendIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Typing dots component
const TypingDots = React.memo(function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-white/60">ZapDev is thinking</span>
      <div className="flex gap-1 ml-2">
        <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
})

