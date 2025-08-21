import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeArtifact } from '@/components/ui/code-artifact';
import { executeCode } from '@/lib/sandbox';

import {
  Copy,
  Check,
  Play,
  Code2,
  Sparkles,
  FileText,
  Image,
  Terminal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import DiagramMessageComponent from '../DiagramMessageComponent';

// Types for the enhanced message component
interface ConvexMessage {
  _id: string;
  content: string | unknown;
  role: 'user' | 'assistant';
  createdAt: number;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
    diagramData?: unknown;
  };
}

interface EnhancedChatMessageProps {
  message: ConvexMessage;
  isUser: boolean;
  isFirstInGroup: boolean;
  formatTimestamp: (timestamp: number) => string;
  copyToClipboard: (text: string, messageId: string) => Promise<void>;
  copiedMessage: string | null;
  onApproveDiagram?: (messageId: string) => Promise<void>;
  onRequestDiagramChanges?: (messageId: string, feedback: string) => Promise<void>;
  isSubmittingDiagram?: boolean;
}

// Enhanced message component with modern AI tool styling
export const EnhancedChatMessage = memo<EnhancedChatMessageProps>(({
  message,
  isUser,
  isFirstInGroup,
  formatTimestamp,
  copyToClipboard,
  copiedMessage,
  onApproveDiagram,
  onRequestDiagramChanges,
  isSubmittingDiagram
}) => {
  const [showCodeArtifacts, setShowCodeArtifacts] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract code blocks from message content
  const extractCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks: Array<{ language: string; code: string; id: string }> = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'plaintext';
      const code = match[2];
      codeBlocks.push({
        language,
        code: code.trim(),
        id: `code-${Math.random().toString(36).substr(2, 9)}`
      });
    }

    return codeBlocks;
  };

  // Remove code blocks from text content for display
  const cleanContent = (content: string) => {
    return content.replace(/```(\w+)?\n[\s\S]*?```/g, '').trim();
  };

  const codeBlocks = extractCodeBlocks(typeof message.content === 'string' ? message.content : '');
  const textContent = cleanContent(typeof message.content === 'string' ? message.content : '');

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.01 }}
        className="group"
      >
        <Card className={`
          transition-all duration-300 shadow-soft hover:shadow-medium border-0
          backdrop-blur-xl
          ${isUser
            ? 'chat-bubble-user ml-auto max-w-[90%]'
            : 'chat-bubble-assistant max-w-[95%]'
          }
          ${isFirstInGroup ? 'rounded-2xl' : (isUser ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tl-md')}
        `}>
          <CardContent className="p-6 relative">
            <div className="space-y-4">
              {/* Message Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isUser ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">U</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-300">
                    {isUser ? 'You' : 'ZapDev AI'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  {codeBlocks.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCodeArtifacts(!showCodeArtifacts)}
                      className="h-8 w-8 p-0 glass-hover rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5"
                    >
                      <Code2 className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 w-8 p-0 glass-hover rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(typeof message.content === 'string' ? message.content : String(message.content), message._id)}
                    className="h-8 w-8 p-0 glass-hover rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5"
                  >
                    {copiedMessage === message._id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Message Content */}
              {textContent && (
                <div
                  className={`text-base leading-relaxed font-medium prose prose-invert max-w-none ${
                    isUser ? 'text-foreground' : 'text-foreground/95'
                  }`}
                >
                  {textContent}
                </div>
              )}

              {/* Code Artifacts */}
              <AnimatePresence>
                {showCodeArtifacts && codeBlocks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    {codeBlocks.map((block, index) => (
                      <CodeArtifact
                        key={block.id}
                        code={block.code}
                        language={block.language}
                        title={`${block.language.charAt(0).toUpperCase() + block.language.slice(1)} Code Block ${index + 1}`}
                        onExecute={executeCode}
                        autoRun={false}
                        showLineNumbers={true}
                        className="mt-3"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Metadata */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="pt-3 border-t border-white/10"
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {message.metadata?.model && (
                        <Badge variant="outline" className="glass text-xs border-white/20 bg-white/5 backdrop-blur-sm rounded-lg px-2 py-1">
                          {String(message.metadata.model)}
                        </Badge>
                      )}

                      {message.metadata?.tokens && (
                        <Badge variant="outline" className="glass text-xs border-white/20 bg-white/5 backdrop-blur-sm rounded-lg px-2 py-1">
                          {String(message.metadata.tokens)} tokens
                        </Badge>
                      )}

                      {message.metadata?.cost && (
                        <Badge variant="outline" className="glass text-xs border-green-400/30 text-green-300 bg-green-500/10 backdrop-blur-sm rounded-lg px-2 py-1">
                          ${String(message.metadata.cost.toFixed(4))}
                        </Badge>
                      )}

                      {message.metadata?.diagramData && (
                        <Badge variant="outline" className="glass text-xs text-blue-300 border border-blue-400/30 bg-blue-500/10 backdrop-blur-sm rounded-lg px-2 py-1">
                          Contains Diagram
                        </Badge>
                      )}

                      {codeBlocks.length > 0 && (
                        <Badge variant="outline" className="glass text-xs border-purple-400/30 text-purple-300 bg-purple-500/10 backdrop-blur-sm rounded-lg px-2 py-1">
                          {codeBlocks.length} Code Block{codeBlocks.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Timestamp */}
            <div className={`text-xs text-muted-foreground/70 mt-3 ${
              isUser ? 'text-right' : 'text-left'
            }`}>
              {String(formatTimestamp(message.createdAt))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Diagram Component */}
      {onApproveDiagram && onRequestDiagramChanges && message.metadata?.diagramData && (
        <DiagramMessageComponent
          diagramData={message.metadata.diagramData as any}
          messageId={message._id}
          onApprove={onApproveDiagram}
          onRequestChanges={onRequestDiagramChanges}
          isSubmitting={isSubmittingDiagram}
        />
      )}
    </div>
  );
});

EnhancedChatMessage.displayName = 'EnhancedChatMessage';
