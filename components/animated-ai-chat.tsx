"use client"

import { useEffect, useRef, useCallback, useTransition } from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Paperclip, Command, SendIcon, XIcon, LoaderIcon, Sparkles, ImageIcon, Figma, MonitorIcon, Share2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import * as React from "react"
import { Message } from "@/lib/openrouter"

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
    const handleResize = () => adjustHeight()
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

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
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
            style={{ animation: "none" }}
            id="textarea-ripple"
          />
        )}
      </div>
    )
  },
)
Textarea.displayName = "Textarea"

interface AnimatedAIChatProps {
  chatId?: string;
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  file: File;
}

export function AnimatedAIChat({ chatId = "default" }: AnimatedAIChatProps) {
  const [value, setValue] = useState("")
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [recentCommand, setRecentCommand] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [inputFocused, setInputFocused] = useState(false)
  const commandPaletteRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [showShareTooltip, setShowShareTooltip] = useState(false)

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
  ]

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
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

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
      if (value.trim() || attachments.length > 0) {
        handleSendMessage()
      }
    }
  }

  const handleSendMessage = async () => {
    if (value.trim() || attachments.length > 0) {
      const userMessage = value.trim();
      setValue("");
      adjustHeight(true);
      
      // Create message content with file information if there are attachments
      let messageContent = userMessage;
      
      // If we have attachments, add them to the message
      if (attachments.length > 0) {
        const fileList = attachments.map(attachment => 
          `[File: ${attachment.name}]`
        ).join('\n');
        
        messageContent = messageContent ? `${messageContent}\n\n${fileList}` : fileList;
      }
      
      // Add user message to chat
      const newUserMessage: Message = {
        role: "user",
        content: messageContent
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setIsTyping(true);
      
      try {
        const formData = new FormData();
        formData.append('messages', JSON.stringify([...messages, newUserMessage]));
        formData.append('chatId', chatId);
        
        // Append each file to the form data
        attachments.forEach((attachment, index) => {
          formData.append(`file${index}`, attachment.file);
        });
        
        // Clear attachments after sending
        setAttachments([]);
        
        // Call the API endpoint with FormData to support file uploads
        const response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error('Failed to get response from AI');
        
        const data = await response.json();
        
        // Add AI response to messages
        if (data.response) {
          const aiMessage: Message = {
            role: "assistant",
            content: data.response
          };
          
          setMessages(prev => [...prev, aiMessage]);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        // Add error message to chat
        const errorMessage: Message = {
          role: "assistant",
          content: "Sorry, I encountered an error while processing your request."
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }
  }

  const handleAttachFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Process each selected file
    Array.from(files).forEach(file => {
      // Create URL for preview
      const url = URL.createObjectURL(file);
      
      // Add file to attachments
      setAttachments(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 11),
          name: file.name,
          type: file.type,
          url: url,
          file: file
        }
      ]);
    });
    
    // Clear the input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const updated = prev.filter(attachment => attachment.id !== id);
      
      // Revoke object URLs to avoid memory leaks
      const removed = prev.find(attachment => attachment.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      
      return updated;
    });
  }
  
  const handleShareChat = () => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${chatId}`);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  }

  return (
    <div className="flex flex-col w-full h-full max-w-4xl mx-auto">
      {/* Button for sharing the chat */}
      <div className="flex justify-end p-4">
        <div className="relative">
          <button 
            onClick={handleShareChat}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share chat</span>
          </button>
          
          {showShareTooltip && (
            <motion.div
              className="absolute right-0 top-full mt-2 bg-green-500 text-white px-3 py-1 rounded-md text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              Link copied!
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Message display area */}
      <div className="flex-1 flex flex-col space-y-4 p-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "p-4 rounded-lg max-w-[80%] text-sm",
              message.role === "user"
                ? "bg-purple-500/10 ml-auto border border-purple-500/20 text-white"
                : "bg-white/10 border border-white/10"
            )}
          >
            <div className="font-medium mb-1">{message.role === "user" ? "You" : "AI"}</div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
        
        {isTyping && <TypingDots />}
      </div>
      
      {/* File attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-md mx-4 mb-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center bg-white/10 rounded px-2 py-1 text-xs">
              <span className="truncate max-w-[100px]">{attachment.name}</span>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="ml-1 text-white/60 hover:text-white"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Input area */}
      <div className="p-4 bg-white/5 backdrop-blur-lg rounded-lg m-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        
        <div className="relative flex items-end">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              adjustHeight()
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="bg-white/10 border-white/10 text-white placeholder:text-white/50 pr-24"
            containerClassName="flex-1"
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          
          <div className="absolute bottom-3 right-3 flex items-center space-x-2">
            <button
              onClick={handleAttachFile}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
              )}
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => {
                if (!isPending) {
                  startTransition(() => {
                    handleSendMessage();
                  });
                }
              }}
              disabled={isPending || (!value.trim() && attachments.length === 0)}
              className={cn(
                "p-1.5 rounded-md transition-colors text-white/80 hover:text-white",
                isPending || (!value.trim() && attachments.length === 0)
                  ? "bg-white/10 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
              )}
              aria-label="Send message"
            >
              {isPending ? (
                <LoaderIcon className="w-4 h-4 animate-spin" />
              ) : (
                <SendIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Command palette */}
      {showCommandPalette && (
        <div
          ref={commandPaletteRef}
          className="absolute bottom-24 left-4 right-4 max-w-md mx-auto bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-medium text-white/70">Commands</h3>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {commandSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 p-3 transition-colors",
                  activeSuggestion === index
                    ? "bg-white/[0.07]"
                    : "hover:bg-white/[0.03] cursor-pointer"
                )}
                onClick={() => {
                  setValue(suggestion.prefix + " ")
                  setShowCommandPalette(false)
                }}
                onMouseEnter={() => setActiveSuggestion(index)}
              >
                <div className="mt-0.5 p-1 bg-white/10 rounded-md text-white/90">{suggestion.icon}</div>
                <div>
                  <h4 className="font-medium text-white/90">{suggestion.label}</h4>
                  <p className="text-sm text-white/50">{suggestion.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center space-x-1 p-3 max-w-[80px] rounded-lg bg-white/10 border border-white/10">
      <motion.div
        className="w-2 h-2 rounded-full bg-white"
        initial={{ scale: 0.8, opacity: 0.4 }}
        animate={{ scale: [0.8, 1, 0.8], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="w-2 h-2 rounded-full bg-white"
        initial={{ scale: 0.8, opacity: 0.4 }}
        animate={{ scale: [0.8, 1, 0.8], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, delay: 0.33, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="w-2 h-2 rounded-full bg-white"
        initial={{ scale: 0.8, opacity: 0.4 }}
        animate={{ scale: [0.8, 1, 0.8], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, delay: 0.66, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
