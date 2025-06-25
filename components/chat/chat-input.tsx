"use client"

import React, { useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Paperclip, Command, SendIcon, XIcon, LoaderIcon } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { useChatStore } from '@/lib/stores/chat-store'

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
    const handleResize = () => {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(() => adjustHeight());
      } else {
        setTimeout(adjustHeight, 66);
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

const commandSuggestions: CommandSuggestion[] = [
  {
    icon: <Command className="w-4 h-4" />,
    label: "Build Website",
    description: "Create a full website",
    prefix: "/build",
  },
  {
    icon: <Paperclip className="w-4 h-4" />,
    label: "Generate Component",
    description: "Create a React component",
    prefix: "/component",
  },
]

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string
  showRing?: boolean
}

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
      </div>
    )
  }
))
Textarea.displayName = "Textarea"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  className?: string
}

export default function ChatInput({ onSendMessage, disabled, className }: ChatInputProps) {
  const {
    inputValue,
    attachments,
    showCommandPalette,
    activeSuggestion,
    inputFocused,
    isTyping,
    setInputValue,
    setAttachments,
    addAttachment,
    removeAttachment,
    setShowCommandPalette,
    setActiveSuggestion,
    setInputFocused,
    clearInput,
  } = useChatStore()

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  })
  
  const commandPaletteRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debounce input value for performance
  const [debouncedValue] = useDebounce(inputValue, 300)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const handleInput = () => adjustHeight()
      textarea.addEventListener("input", handleInput)
      return () => textarea.removeEventListener("input", handleInput)
    }
  }, [adjustHeight])

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
  }, [setShowCommandPalette])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }

    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveSuggestion(activeSuggestion < commandSuggestions.length - 1 ? activeSuggestion + 1 : activeSuggestion)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveSuggestion(activeSuggestion > 0 ? activeSuggestion - 1 : activeSuggestion)
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
    if (!inputValue.trim() || isTyping || disabled) return

    const message = inputValue.trim()
    clearInput()
    adjustHeight(true)
    
    onSendMessage(message)
  }

  const handleAttachFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newAttachments = Array.from(files).map((file) => file.name)
      newAttachments.forEach(attachment => addAttachment(attachment))
    }
  }

  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index]
    setInputValue(selectedCommand.prefix + " ")
    setShowCommandPalette(false)
    setActiveSuggestion(-1)
    textareaRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputValue(value)
    adjustHeight()

    // Show command palette if user types /
    if (value.startsWith('/') && !showCommandPalette) {
      setShowCommandPalette(true)
      setActiveSuggestion(0)
    } else if (!value.startsWith('/') && showCommandPalette) {
      setShowCommandPalette(false)
      setActiveSuggestion(-1)
    }
  }

  return (
    <div className={cn("w-full mx-auto p-4", className)}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
        multiple
      />
      
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
                value={inputValue}
                onChange={handleInputChange}
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
                disabled={disabled}
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
                        className="text-white/40 hover:text-white/70 transition-colors"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAttachFile}
                  className="text-white/40 hover:text-white/70 transition-colors p-1"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isTyping && (
                  <LoaderIcon className="w-4 h-4 animate-spin text-white/40" />
                )}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping || disabled}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                    inputValue.trim() && !isTyping && !disabled
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
  )
} 