import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Check, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp,
  Edit3,
  Loader2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiagramApprovalControlsProps {
  isApproved?: boolean;
  userFeedback?: string;
  version: number;
  onApprove: () => Promise<void>;
  onRequestChanges: (feedback: string) => Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

export const DiagramApprovalControls: React.FC<DiagramApprovalControlsProps> = ({
  isApproved,
  userFeedback,
  version,
  onApprove,
  onRequestChanges,
  isSubmitting = false,
  className = '',
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(userFeedback || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApprove = async () => {
    try {
      await onApprove();
    } catch (error) {
      console.error('Failed to approve diagram:', error);
    }
  };

  const handleRequestChanges = async () => {
    // Enhanced input validation
    const trimmed = feedback.trim();
    
    // Return early if feedback is empty
    if (!trimmed) {
      return; // Don't submit empty feedback
    }
    
    // Enforce maximum length (1000 chars) and show user-facing error
    if (trimmed.length > 1000) {
      // Note: You might want to show this via a toast or error state instead of alert
      alert('Feedback is too long. Please keep it under 1000 characters.');
      return;
    }
    
    // Optional: Normalize whitespace before submitting
    const normalizedFeedback = trimmed.replace(/\s+/g, ' ');
    
    try {
      await onRequestChanges(normalizedFeedback);
      setFeedback('');
      setShowFeedback(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Note: You might want to show user feedback here via toast or error state
    }
  };

  const getStatusBadge = () => {
    if (isApproved === true) {
      return (
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
          <Check className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    }
    
    if (isApproved === false || userFeedback) {
      return (
        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 px-3 py-1">
          <Edit3 className="w-3 h-3 mr-1" />
          Changes Requested
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1">
        <MessageSquare className="w-3 h-3 mr-1" />
        Pending Review
      </Badge>
    );
  };

  const canApprove = !isApproved && !isSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full ${className}`}
    >
      <Card className="bg-[#1A1A1A]/50 backdrop-blur-xl border border-gray-800/30">
        <CardContent className="p-4">
          {/* Header with status and version */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <Badge variant="outline" className="text-xs text-muted-foreground">
                v{version}
              </Badge>
            </div>
            
            {(isApproved !== undefined || userFeedback) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          {/* Action buttons - only show if not approved */}
          {canApprove && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-600/30 transition-colors"
                size="sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ThumbsUp className="w-4 h-4 mr-2" />
                )}
                Approve Plan
              </Button>
              
              <Button
                onClick={() => setShowFeedback(true)}
                disabled={isSubmitting}
                variant="outline"
                size="sm"
                className="border-orange-600/30 text-orange-300 hover:bg-orange-600/10"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Request Changes
              </Button>
            </motion.div>
          )}

          {/* Feedback section */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4"
              >
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    What changes would you like to see?
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Please be specific about what you'd like changed in the diagram..."
                    className="min-h-[80px] bg-[#0F0F0F]/50 border-gray-700/50 focus:border-orange-500/50 transition-colors"
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {feedback.length}/1000 characters
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setShowFeedback(false);
                          setFeedback(userFeedback || '');
                        }}
                        variant="ghost"
                        size="sm"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRequestChanges}
                        disabled={!feedback.trim() || isSubmitting}
                        size="sm"
                        className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-600/30"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <MessageSquare className="w-4 h-4 mr-2" />
                        )}
                        Submit Feedback
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Previous feedback display */}
          <AnimatePresence>
            {userFeedback && isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-800/50 pt-4"
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Previous Feedback
                  </h4>
                  <div className="bg-[#0F0F0F]/50 rounded-lg p-3 border border-gray-800/30">
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                      {userFeedback}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Approved state message */}
          {isApproved && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-green-300 text-sm"
            >
              <Check className="w-4 h-4" />
              <span>This plan has been approved and is ready for implementation.</span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DiagramApprovalControls;