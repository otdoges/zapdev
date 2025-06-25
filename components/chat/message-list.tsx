"use client"

import React, { useMemo, useRef, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { Message } from '@/lib/stores/chat-store'
import { groqModelConfigs } from '@/lib/groq-provider'
import MessageItem from './message-item'
import TypingIndicator from './typing-indicator'

interface MessageListProps {
  messages: Message[]
  isTyping: boolean
  selectedModel: string
  showReasoning: boolean
  onRetry?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onEdit?: (messageId: string) => void
  className?: string
}

const ITEM_HEIGHT = 120 // Estimated height per message
const MAX_HEIGHT = 600 // Maximum height before virtualization kicks in

export default function MessageList({ 
  messages, 
  isTyping, 
  selectedModel, 
  showReasoning,
  onRetry,
  onDelete,
  onEdit,
  className 
}: MessageListProps) {
  const listRef = useRef<List>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end')
    }
  }, [messages.length])

  // Determine if we should use virtual scrolling
  const shouldVirtualize = messages.length > 50 || (messages.length * ITEM_HEIGHT > MAX_HEIGHT)

  const EmptyState = () => (
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
  )

  // Render item for virtual list
  const renderItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index]
    if (!message) return null

    return (
      <div style={style}>
        <MessageItem
          message={message}
          selectedModel={selectedModel}
          showReasoning={showReasoning}
          index={index}
        />
      </div>
    )
  }

  // Create list of all items including typing indicator
  const allItems = useMemo(() => {
    const items = [...messages]
    if (isTyping) {
      items.push({
        id: 'typing-indicator',
        role: 'assistant' as const,
        content: '',
        status: 'sending' as const,
      })
    }
    return items
  }, [messages, isTyping])

  const renderVirtualizedItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = allItems[index]
    if (!item) return null

    if (item.id === 'typing-indicator') {
      return (
        <div style={style}>
          <motion.div
            className="flex justify-start p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white/[0.03] border border-white/[0.05] text-white/90 rounded-2xl px-4 py-3">
              <TypingIndicator />
            </div>
          </motion.div>
        </div>
      )
    }

    return (
      <div style={style}>
        <MessageItem
          message={item}
          selectedModel={selectedModel}
          showReasoning={showReasoning}
          index={index}
        />
      </div>
    )
  }

  if (messages.length === 0 && !isTyping) {
    return (
      <div className={cn("flex-grow overflow-y-auto p-6", className)}>
        <EmptyState />
      </div>
    )
  }

  if (shouldVirtualize) {
    // Use virtual scrolling for large message lists
    return (
      <div 
        ref={containerRef}
        className={cn("flex-grow overflow-hidden", className)}
      >
        <List
          ref={listRef}
          height={containerRef.current?.clientHeight || MAX_HEIGHT}
          width="100%"
          itemCount={allItems.length}
          itemSize={ITEM_HEIGHT}
          className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {renderVirtualizedItem}
        </List>
      </div>
    )
  }

  // Regular rendering for smaller lists
  return (
    <div className={cn("flex-grow overflow-y-auto p-6 space-y-6", className)}>
      <motion.div 
        className="space-y-8 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {messages.map((message, index) => (
          <MessageItem
            key={message.id || index}
            message={message}
            selectedModel={selectedModel}
            showReasoning={showReasoning}
            index={index}
            onRetry={onRetry}
            onDelete={onDelete}
            onEdit={onEdit}
          />
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
              <TypingIndicator />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
} 