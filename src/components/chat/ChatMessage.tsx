import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SafeText } from '@/components/ui/SafeText';
import { Copy, Check } from 'lucide-react';
import DiagramMessageComponent from '../DiagramMessageComponent';

// Types for the message component
interface ConvexMessage {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: number;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
    diagramData?: unknown;
  };
}

interface User {
  avatarUrl?: string;
  email?: string;
  fullName?: string;
}

interface ChatMessageProps {
  message: ConvexMessage;
  user: User | null;
  isUser: boolean;
  isFirstInGroup: boolean;
  formatTimestamp: (timestamp: number) => string;
  copyToClipboard: (text: string, messageId: string) => Promise<void>;
  copiedMessage: string | null;
  onApproveDiagram?: (messageId: string) => Promise<void>;
  onRequestDiagramChanges?: (messageId: string, feedback: string) => Promise<void>;
  isSubmittingDiagram?: boolean;
}

// Performance optimized message component with React.memo
export const ChatMessage = memo<ChatMessageProps>(({ 
  message, 
  user, 
  isUser, 
  isFirstInGroup, 
  formatTimestamp, 
  copyToClipboard, 
  copiedMessage, 
  onApproveDiagram, 
  onRequestDiagramChanges, 
  isSubmittingDiagram 
}) => {
  const hasDiagram = message.metadata?.diagramData;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.01 }}
        className="group"
      >
        <Card className={`
          transition-all duration-300 shadow-lg hover:shadow-xl border-0
          ${isUser 
            ? 'chat-bubble-user ml-auto max-w-[80%] bg-gradient-to-br from-blue-600/10 to-blue-700/5 border border-blue-400/20' 
            : 'chat-bubble-assistant max-w-[85%] bg-gradient-to-br from-gray-800/40 to-gray-900/20 border border-gray-600/20'
          }
          ${isFirstInGroup ? 'rounded-2xl' : (isUser ? 'rounded-2xl rounded-tr-lg' : 'rounded-2xl rounded-tl-lg')}
          backdrop-blur-xl
        `}>
          <CardContent className="p-6 relative">
            <div className="space-y-4">
              <SafeText 
                className={`text-base leading-relaxed font-medium ${
                  isUser ? 'text-foreground' : 'text-foreground/95'
                }`}
              >
                {message.content}
              </SafeText>
              
              {message.metadata?.model && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant="outline" className="glass text-xs border-white/20 bg-white/5 backdrop-blur-sm rounded-lg px-2 py-1">
                    {message.metadata.model}
                  </Badge>
                  {message.metadata.tokens && (
                    <span className="bg-gray-800/50 px-2 py-1 rounded-md">{message.metadata.tokens} tokens</span>
                  )}
                  {message.metadata.cost && (
                    <span className="bg-green-800/30 text-green-300 px-2 py-1 rounded-md">${message.metadata.cost.toFixed(4)}</span>
                  )}
                  {hasDiagram && (
                    <Badge variant="outline" className="glass text-xs text-blue-300 border-blue-400/30 bg-blue-500/10 backdrop-blur-sm rounded-lg px-2 py-1">
                      Contains Diagram
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className={`absolute top-3 ${isUser ? 'left-3' : 'right-3'} opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2`}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(message.content, message._id)}
                  className="h-8 w-8 p-0 glass-hover rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 backdrop-blur-sm"
                >
                  {copiedMessage === message._id ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
            </div>

            <div className={`text-xs text-muted-foreground/70 mt-3 ${
              isUser ? 'text-right' : 'text-left'
            }`}>
              {formatTimestamp(message.createdAt)}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Diagram Component */}
      {hasDiagram && onApproveDiagram && onRequestDiagramChanges && (
        <DiagramMessageComponent
          diagramData={message.metadata.diagramData}
          messageId={message._id}
          onApprove={onApproveDiagram}
          onRequestChanges={onRequestDiagramChanges}
          isSubmitting={isSubmittingDiagram}
        />
      )}
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';