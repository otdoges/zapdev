"use client"

import { useEffect, useRef, useCallback, useTransition, useMemo } from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Paperclip, Command, SendIcon, XIcon, LoaderIcon, Sparkles, ImageIcon, Figma, MonitorIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import * as React from "react"
import { useChat, type Message } from "ai/react"
import { modelIds } from "@/lib/openrouter"

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
  className?: string;
  useMultipleModels?: boolean;
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
  // Remove tool call patterns
  const toolCallPatterns = [
    /\[Tool Call[^\]]*\][^[]*/g,
    /\[Function Call[^\]]*\][^[]*/g,
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
  className,
  useMultipleModels = false 
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
  const fallbackModel = 'openrouter/auto';
  const [selectedModel, setSelectedModel] = useState(modelIds[0] ?? fallbackModel)
  const [useThinking, setUseThinking] = useState(false)
  
  // Track the actual Convex chat ID separate from the URL chatId
  const [convexChatId, setConvexChatId] = useState<string | null>(null);

  // Use Vercel AI SDK's useChat hook
  const { messages, isLoading: isTyping, append, setMessages, data } = useChat({
    api: "/api/chat",
    id: chatId,
    body: {
      modelId: selectedModel,
      chatId: convexChatId && !convexChatId.includes('-') ? convexChatId : null, // Only send valid Convex IDs
      useMultipleModels,
    },
    initialMessages: [],
    onResponse: async (response) => {
      // Get the Convex chat ID from response headers
      const newChatId = response.headers.get('X-Chat-ID');
      if (newChatId && newChatId !== convexChatId) {
        setConvexChatId(newChatId);
      }
    },
    onFinish: async (message) => {
      // Extract and send code when AI finishes responding
      if (message.role === 'assistant' && onCodeGenerated) {
        const extractedCode = extractCodeFromMessage(message.content);
        if (extractedCode) {
          onCodeGenerated(extractedCode);
        }
      }

      // Save the assistant message to Convex (for streaming responses)
      // Only save if we have a valid Convex ID (not a UUID)
      if (message.role === 'assistant' && convexChatId && !convexChatId.includes('-')) {
        try {
          await fetch('/api/chat/save-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: convexChatId,
              content: message.content,
              role: 'assistant'
            })
          });
        } catch (error) {
          console.error('Failed to save assistant message:', error);
        }
      } else {
        console.log('Skipping message save - no valid Convex chat ID available');
      }
    },
  });

  // Filter messages to remove tool calls
  const filteredMessages = useMemo(() => {
    return messages.map(msg => ({
      ...msg,
      content: msg.role === 'assistant' ? filterMessage(msg.content) : msg.content
    }));
  }, [messages]);

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
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
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

              <div className="p-4 border-t border-white/[0.05] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    onClick={handleAttachFile}
                    whileTap={{ scale: 0.94 }}
                    className="p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group"
                  >
                    <Paperclip className="w-4 h-4" />
                    <motion.span
                      className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      layoutId="button-highlight"
                    />
                  </motion.button>
                  <motion.button
                    type="button"
                    data-command-button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCommandPalette((prev) => !prev)
                    }}
                    whileTap={{ scale: 0.94 }}
                    className={cn(
                      "p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group",
                      showCommandPalette && "bg-white/10 text-white/90",
                    )}
                  >
                    <Command className="w-4 h-4" />
                    <motion.span
                      className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      layoutId="button-highlight"
                    />
                  </motion.button>
                </div>

                <motion.button
                  type="button"
                  onClick={handleSendMessage}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isTyping || !value.trim()}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    "flex items-center gap-2",
                    value.trim() ? "bg-white text-[#0A0A0B] shadow-lg shadow-white/10" : "bg-white/[0.05] text-white/40",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {isTyping ? (
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SendIcon className="w-4 h-4" />
                  )}
                  Send
                </motion.button>
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

