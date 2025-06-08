"use client"

import { useEffect, useRef, useCallback, useTransition, useMemo } from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Paperclip, Command, SendIcon, XIcon, LoaderIcon, Sparkles, ImageIcon, Figma, MonitorIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import * as React from "react"
import { useChat, type Message } from "ai/react"
import { modelIds } from "@/lib/openrouter"
import { InteractiveDisplay } from "./interactive-display"

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

export function AnimatedAIChat({ chatId = "default", onFirstMessageSent }: AnimatedAIChatProps) {
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
  const fallbackModel = 'openrouter/auto'; // or whatever default is safe
  const [selectedModel, setSelectedModel] = useState(modelIds[0] ?? fallbackModel)
  const [useThinking, setUseThinking] = useState(false)
  
  // Use Vercel AI SDK's useChat hook
  const { messages, isLoading: isTyping, append, setMessages, data } = useChat({
    api: "/api/chat",
    id: chatId,
    initialMessages: [],
    onFinish: (message) => {
      setCurrentStage(null);
    },
  });

  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommandPalette(true)

      const matchingSuggestionIndex = commandSuggestions.findIndex((cmd) => cmd.prefix.startsWith(value))

      if (matchingSuggestionIndex >= 0) {
        setActiveSuggestion(matchingSuggestionIndex)
      } else {
        setActiveSuggestion(-1)
      }
    } else {
      setShowCommandPalette(false)
    }
  }, [value])

  useEffect(() => {
    // Throttle mouse move event to improve performance
    const handleMouseMove = throttle((e: MouseEvent) => {
      if (inputFocused) { // Only update when input is focused
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    }, 50); // Update at most every 50ms

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [inputFocused])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const commandButton = document.querySelector("[data-command-button]")

      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
        setShowCommandPalette(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (data && data.length > 0) {
      const lastDataPoint = data[data.length - 1];
      try {
        const parsedData = JSON.parse(lastDataPoint as string);
        if (parsedData.type === 'stage') {
          setCurrentStage(parsedData.content);
        } else if (parsedData.type === 'code') {
          setGeneratedCode(parsedData.content);
        } else if (parsedData.type === 'refinedCode') {
          setGeneratedCode(parsedData.content);
        }
      } catch (error) {
        // Not a JSON object, likely the final stream
      }
    }
  }, [data]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveSuggestion((prev) => (prev < commandSuggestions.length - 1 ? prev + 1 : 0))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : commandSuggestions.length - 1))
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault()
        if (activeSuggestion >= 0) {
          const selectedCommand = commandSuggestions[activeSuggestion]
          setValue(selectedCommand.prefix + " ")
          setShowCommandPalette(false)

          setRecentCommand(selectedCommand.label)
          setTimeout(() => setRecentCommand(null), 3500)
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        setShowCommandPalette(false)
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) {
        handleSendMessage()
      }
    }
  }

  const handleSendMessage = async () => {
    if (value.trim()) {
      setGeneratedCode("");
      setCurrentStage("Starting...");
      append({ role: "user", content: value });
      setValue("");
      adjustHeight(true);
      
      if (messages.length === 0 && onFirstMessageSent) {
        onFirstMessageSent();
      }

      // Enable split screen mode when message is sent
      setIsSplitScreen(true);
    }
  }

  const handleAttachFile = () => {
    // Trigger the hidden file input click event
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // Add each selected file to attachments
      Array.from(files).forEach(file => {
        setAttachments(prev => [...prev, file.name])
      })
    }
    // Reset the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index]
    setValue(selectedCommand.prefix + " ")
    setShowCommandPalette(false)

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
    <div className="flex flex-col h-full w-full overflow-hidden">
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
        {messages.length === 0 ? (
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
            {messages.map((message, index) => (
              <motion.div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: Math.min(0.1 * index, 0.5), // Cap the delay for better performance with many messages
                  duration: 0.3 
                }}
                layout={false} // Disable layout animations for better performance
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-gradient-to-br from-[#6C52A0]/80 to-[#A0527C]/80 text-white"
                      : "bg-white/[0.03] border border-white/[0.05]"
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {index === messages.length - 1 && (isTyping || generatedCode) && (
                    <motion.div
                      className="mt-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentStage && <div className="text-xs text-white/50 mb-2">{currentStage}</div>}
                      <InteractiveDisplay code={message.role === 'assistant' ? message.content : generatedCode} />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Background gradients - optimized by using opacity instead of animation */}
      {backgroundGradients}
      
      {/* Input area - fixed at the bottom */}
      <div className="w-full mx-auto p-4">
        <div className={cn(
          "w-full mx-auto relative transition-all duration-500 ease-in-out",
          isSplitScreen ? "max-w-5xl flex flex-row gap-6" : "max-w-2xl"
        )}>
          <motion.div
            className={cn(
              "relative z-10 space-y-6 w-full",
              isSplitScreen ? "flex-1" : ""
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            layout={false} // Disable layout animations
          >
            <motion.div
              className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              layout={false} // Disable layout animations
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
                          transition={{ delay: Math.min(0.03 * index, 0.1) }} // Cap the delay
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
                  )}
                >
                  {isTyping ? (
                    <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                  ) : (
                    <SendIcon className="w-4 h-4" />
                  )}
                  <span>Send</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Only show command suggestion buttons when there are no messages */}
            {messages.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {commandSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.prefix}
                    onClick={() => selectCommandSuggestion(index)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg text-sm text-white/60 hover:text-white/90 transition-all relative group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(0.1 * index, 0.3) }} // Cap the delay
                  >
                    {suggestion.icon}
                    <span>{suggestion.label}</span>
                    <motion.div
                      className="absolute inset-0 border border-white/[0.05] rounded-lg"
                      initial={false}
                      animate={{
                        opacity: [0, 1],
                        scale: [0.98, 1],
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Show typing indicator only when needed */}
      <AnimatePresence>
        {isTyping && currentStage && (
          <motion.div
            className="fixed bottom-8 left-1/2 mx-auto transform -translate-x-1/2 backdrop-blur-2xl bg-white/[0.02] rounded-full px-4 py-2 shadow-lg border border-white/[0.05]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-7 rounded-full bg-white/[0.05] flex items-center justify-center text-center">
                <span className="text-xs font-medium text-white/90 mb-0.5">zap</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>{currentStage}</span>
                <TypingDots />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conditionally render mouse tracking effects only when input is focused */}
      {inputFocused && (
        <motion.div
          className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
          style={{
            x: mousePosition.x - 400,
            y: mousePosition.y - 400,
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 150,
            mass: 0.5,
          }}
        />
      )}
    </div>
  )
}

// Memoize the TypingDots component to prevent unnecessary re-renders
const TypingDots = React.memo(function TypingDots() {
  return (
    <div className="flex items-center ml-1">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 0.9, 0.3],
            scale: [0.85, 1.1, 0.85],
          }}
          transition={{
            duration: 1.2,
            repeat: Number.POSITIVE_INFINITY,
            delay: dot * 0.15,
            ease: "easeInOut",
          }}
          style={{
            boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)",
          }}
        />
      ))}
    </div>
  )
})
const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`

if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.innerHTML = rippleKeyframes
  document.head.appendChild(style)
}

