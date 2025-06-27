'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, RotateCcw, Trash2, Edit3, Clock } from 'lucide-react';
import { Message } from '@/lib/stores/chat-store';
import { groqModelConfigs } from '@/lib/groq-provider';
import { formatDistanceToNow } from 'date-fns';

interface MessageItemProps {
  message: Message;
  selectedModel: string;
  showReasoning: boolean;
  index: number;
  onRetry?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
}

export default function MessageItem({
  message,
  selectedModel,
  showReasoning,
  index,
  onRetry,
  onDelete,
  onEdit,
}: MessageItemProps) {
  const handleRetry = () => {
    if (onRetry && message.status === 'failed') {
      onRetry(message.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(message.id);
    }
  };

  const getStatusColor = () => {
    switch (message.status) {
      case 'sending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      case 'sent':
        return 'text-green-400';
      default:
        return 'text-white/60';
    }
  };

  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return null;
    try {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } catch {
      return null;
    }
  };

  return (
    <motion.div
      className={cn(
        'flex flex-col gap-2 p-4',
        message.role === 'user' ? 'items-end' : 'items-start'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(0.1 * index, 0.5),
        duration: 0.3,
      }}
      layout={false}
    >
      <div className="flex w-full max-w-[80%] items-start gap-2">
        <div
          className={cn(
            'group relative flex-1 rounded-2xl px-4 py-3',
            message.role === 'user'
              ? 'bg-gradient-to-br from-[#6C52A0]/80 to-[#A0527C]/80 text-white'
              : 'border border-white/[0.05] bg-white/[0.03] text-white/90'
          )}
        >
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>

          {/* Message metadata */}
          <div className="mt-2 flex items-center justify-between text-xs opacity-60">
            <div className="flex items-center gap-2">
              {message.createdAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(message.createdAt)}
                </div>
              )}
              {message.status && (
                <div className={cn('text-xs', getStatusColor())}>
                  {message.status === 'sending' && '⋯'}
                  {message.status === 'failed' && '✗'}
                  {message.status === 'sent' && '✓'}
                </div>
              )}
              {message.retryCount && message.retryCount > 0 && (
                <div className="text-xs text-orange-400">Retry {message.retryCount}</div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {message.status === 'failed' && onRetry && (
                <button
                  onClick={handleRetry}
                  className="rounded p-1 transition-colors hover:bg-white/10"
                  title="Retry message"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="rounded p-1 transition-colors hover:bg-white/10"
                  title="Edit message"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="rounded p-1 transition-colors hover:bg-red-500/20"
                  title="Delete message"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Show reasoning for assistant messages when available */}
      {message.role === 'assistant' && message.reasoning && showReasoning && (
        <motion.div
          className="w-full max-w-[80%]"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <details className="group">
            <summary className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-white/60 transition-colors hover:text-white/80">
              <Sparkles className="h-3 w-3" />
              <span>View Reasoning Process</span>
              <span className="rounded bg-white/[0.05] px-2 py-0.5 text-xs">
                {groqModelConfigs.find((m) => m.id === selectedModel)?.name || 'Reasoning Model'}
              </span>
            </summary>
            <div className="mt-2 rounded-xl border border-white/[0.03] bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-white/40">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                AI Reasoning Steps
              </div>
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/70">
                {message.reasoning}
              </div>
            </div>
          </details>
        </motion.div>
      )}
    </motion.div>
  );
}
