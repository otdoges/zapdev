import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Globe, ArrowUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import WebsiteCloneDialog from '@/components/WebsiteCloneDialog';
import type { WebsiteAnalysis } from '@/lib/firecrawl';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleSubmit: (e: React.FormEvent) => void;
  isTyping: boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

export const ChatInput: React.FC<ChatInputProps> = memo(({
  input,
  setInput,
  textareaRef,
  handleSubmit,
  isTyping,
  isSearchOpen,
  setIsSearchOpen
}) => {
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);

  const handleCloneWebsiteClick = () => {
    setIsCloneDialogOpen(true);
  };

  const handleCloneRequest = (analysis: WebsiteAnalysis, clonePrompt: string) => {
    setInput(prev => prev + (prev ? '\n\n' : '') + clonePrompt);
    textareaRef.current?.focus();
    toast.success('Website analysis added to chat! Ready to start cloning.');
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Simplified input container */}
        <div className="relative">
          <div className="glass-elevated rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What would you like to build today?"
              className="min-h-[100px] max-h-[300px] resize-none border-none bg-transparent placeholder:text-muted-foreground/60 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSubmit(e);
                }
              }}
            />
            
            {/* Simplified action bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-lg px-3 py-2 text-sm border border-white/10 hover:bg-white/5"
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-lg px-3 py-2 text-sm border border-white/10 hover:bg-white/5"
                  type="button"
                  onClick={handleCloneWebsiteClick}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Clone
                </Button>
              </div>

              <Button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-primary hover:bg-primary/90 px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {isTyping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Website Clone Dialog */}
      <WebsiteCloneDialog
        isOpen={isCloneDialogOpen}
        onOpenChange={setIsCloneDialogOpen}
        onCloneRequest={handleCloneRequest}
      />

      {/* Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="glass-elevated border-white/20">
          <DialogHeader>
            <DialogTitle>Web Search</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Search functionality will be available soon.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});