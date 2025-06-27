'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Paperclip, Command, SendIcon, XIcon, LoaderIcon } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { useChatStore } from '@/lib/stores/chat-store';

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
    const handleResize = () => {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(() => adjustHeight());
      } else {
        setTimeout(adjustHeight, 66);
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

const commandSuggestions: CommandSuggestion[] = [
  {
    icon: <Command className="h-4 w-4" />,
    label: 'Build Website',
    description: 'Create a full website',
    prefix: '/build',
  },
  {
    icon: <Paperclip className="h-4 w-4" />,
    label: 'Generate Component',
    description: 'Create a React component',
    prefix: '/component',
  },
];

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

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
        </div>
      );
    }
  )
);
Textarea.displayName = 'Textarea';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  className?: string;
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
  } = useChatStore();

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce input value for performance
  const [debouncedValue] = useDebounce(inputValue, 300);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const handleInput = () => adjustHeight();
      textarea.addEventListener('input', handleInput);
      return () => textarea.removeEventListener('input', handleInput);
    }
  }, [adjustHeight]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !target.closest('[data-command-button]')
      ) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [setShowCommandPalette]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }

    if (showCommandPalette) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion(
          activeSuggestion < commandSuggestions.length - 1 ? activeSuggestion + 1 : activeSuggestion
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion(activeSuggestion > 0 ? activeSuggestion - 1 : activeSuggestion);
      } else if (e.key === 'Enter' && activeSuggestion >= 0) {
        e.preventDefault();
        selectCommandSuggestion(activeSuggestion);
      } else if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setActiveSuggestion(-1);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping || disabled) return;

    const message = inputValue.trim();
    clearInput();
    adjustHeight(true);

    onSendMessage(message);
  };

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments = Array.from(files).map((file) => file.name);
      newAttachments.forEach((attachment) => addAttachment(attachment));
    }
  };

  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index];
    setInputValue(selectedCommand.prefix + ' ');
    setShowCommandPalette(false);
    setActiveSuggestion(-1);
    textareaRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    adjustHeight();

    // Show command palette if user types /
    if (value.startsWith('/') && !showCommandPalette) {
      setShowCommandPalette(true);
      setActiveSuggestion(0);
    } else if (!value.startsWith('/') && showCommandPalette) {
      setShowCommandPalette(false);
      setActiveSuggestion(-1);
    }
  };

  return (
    <div className={cn('mx-auto w-full p-4', className)}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
        multiple
      />

      <div className="relative mx-auto w-full max-w-2xl">
        <motion.div
          className="relative z-10 w-full space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          layout={false}
        >
          <motion.div
            className="relative rounded-2xl border border-white/[0.05] bg-white/[0.02] shadow-2xl backdrop-blur-2xl"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            layout={false}
          >
            <AnimatePresence>
              {showCommandPalette && (
                <motion.div
                  ref={commandPaletteRef}
                  className="absolute bottom-full left-4 right-4 z-50 mb-2 overflow-hidden rounded-lg border border-white/10 bg-black/90 shadow-lg backdrop-blur-xl"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="bg-black/95 py-1">
                    {commandSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.prefix}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition-colors',
                          activeSuggestion === index
                            ? 'bg-white/10 text-white'
                            : 'text-white/70 hover:bg-white/5'
                        )}
                        onClick={() => selectCommandSuggestion(index)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(0.03 * index, 0.1) }}
                      >
                        <div className="flex h-5 w-5 items-center justify-center text-white/60">
                          {suggestion.icon}
                        </div>
                        <div className="font-medium">{suggestion.label}</div>
                        <div className="ml-1 text-xs text-white/40">{suggestion.prefix}</div>
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
                  'w-full px-4 py-3',
                  'resize-none',
                  'bg-transparent',
                  'border-none',
                  'text-sm text-white/90',
                  'focus:outline-none',
                  'placeholder:text-white/20',
                  'min-h-[60px]'
                )}
                style={{
                  overflow: 'hidden',
                }}
                showRing={false}
                disabled={disabled}
              />
            </div>

            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-2 px-4 pb-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {attachments.map((file, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs text-white/70"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <span>{file}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-white/40 transition-colors hover:text-white/70"
                      >
                        <XIcon className="h-3 w-3" />
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
                  className="p-1 text-white/40 transition-colors hover:text-white/70"
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isTyping && <LoaderIcon className="h-4 w-4 animate-spin text-white/40" />}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping || disabled}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                    inputValue.trim() && !isTyping && !disabled
                      ? 'bg-gradient-to-r from-[#6C52A0] to-[#A0527C] text-white hover:scale-105'
                      : 'cursor-not-allowed bg-white/[0.05] text-white/30'
                  )}
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
