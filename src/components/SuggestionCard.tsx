import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Play, 
  Palette,
  Shield,
  Info,
  Code2,
  Sparkles,
  Plus,
  Monitor,
  Search,
  ArrowUp
} from 'lucide-react';
import { AISuggestion } from '@/lib/suggestion-types';
import { toast } from 'sonner';

interface SuggestionCardProps {
  suggestion: AISuggestion;
  onImplement: (suggestion: AISuggestion) => Promise<void>;
  onPreview?: (suggestion: AISuggestion) => void;
  isImplementing?: boolean;
  className?: string;
}

const CATEGORY_ICONS = {
  'ui-improvement': Sparkles,
  'performance': Zap,
  'accessibility': Shield,
  'security': Shield,
  'feature-addition': Plus,
  'code-quality': Code2,
  'responsiveness': Monitor,
  'seo': Search,
  'modernization': ArrowUp,
} as const;

const PRIORITY_COLORS = {
  low: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/20 text-red-400 border-red-500/20',
} as const;

const DIFFICULTY_COLORS = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
  hard: 'bg-red-500/20 text-red-400 border-red-500/20',
} as const;

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onImplement,
  onPreview,
  isImplementing = false,
  className = '',
}) => {
  const [showPreview, setShowPreview] = useState(false);
  
  const CategoryIcon = CATEGORY_ICONS[suggestion.category] || Info;
  
  const handleImplement = async () => {
    try {
      await onImplement(suggestion);
      toast.success(`Successfully implemented: ${suggestion.title}`);
    } catch (error) {
      toast.error(`Failed to implement suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(suggestion);
    } else {
      setShowPreview(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={className}
    >
      <Card className="relative overflow-hidden border border-gray-800/50 bg-[#1A1A1A]/90 backdrop-blur-xl hover:border-purple-500/30 transition-all duration-300 group">
        {/* Color warning indicator */}
        {suggestion.metadata?.touchesColors && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
              <Palette className="w-3 h-3 mr-1" />
              Colors
            </Badge>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                <CategoryIcon className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-gray-100 truncate">
                {suggestion.title}
              </h3>
            </div>
            <Badge className={`text-xs ${PRIORITY_COLORS[suggestion.priority]} shrink-0`}>
              {suggestion.priority}
            </Badge>
          </div>
          
          <p className="text-xs text-gray-400 line-clamp-2 mt-2">
            {suggestion.description}
          </p>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={`text-xs ${DIFFICULTY_COLORS[suggestion.difficulty]}`}>
              {suggestion.difficulty}
            </Badge>
            <Badge variant="outline" className="text-xs text-gray-400 border-gray-700">
              <Clock className="w-3 h-3 mr-1" />
              {suggestion.estimatedTime}
            </Badge>
            {suggestion.metadata?.requiresUserApproval && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Approval Required
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {suggestion.preview?.codeSnippet && (
              <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 text-gray-300"
                    onClick={handlePreview}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CategoryIcon className="w-5 h-5 text-purple-400" />
                      {suggestion.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                      {suggestion.description}
                    </p>
                    {suggestion.preview?.codeSnippet && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Code Preview:</h4>
                        <ScrollArea className="h-64 w-full">
                          <pre className="text-xs bg-gray-900 p-3 rounded-lg overflow-x-auto">
                            <code>{suggestion.preview.codeSnippet}</code>
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPreview(false)}
                      >
                        Close
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowPreview(false);
                          handleImplement();
                        }}
                        disabled={isImplementing}
                        className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Implement
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Button
              size="sm"
              onClick={handleImplement}
              disabled={isImplementing}
              className="h-8 px-3 text-xs bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white flex-1"
            >
              {isImplementing ? (
                <>
                  <div className="w-3 h-3 mr-1 animate-spin rounded-full border border-white/30 border-t-white" />
                  Applying...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Apply
                </>
              )}
            </Button>
          </div>

          {/* Implementation details */}
          {suggestion.implementation.action && (
            <div className="mt-3 p-2 bg-gray-800/30 rounded text-xs text-gray-400">
              <strong>Action:</strong> {suggestion.implementation.action}
            </div>
          )}

          {/* Warnings */}
          {suggestion.metadata?.touchesColors && (
            <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-400 flex items-start gap-2">
              <Palette className="w-3 h-3 mt-0.5 shrink-0" />
              <span>This suggestion will modify colors. Review carefully before applying.</span>
            </div>
          )}
        </CardContent>

        {/* Subtle animation overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Card>
    </motion.div>
  );
};

export default SuggestionCard;