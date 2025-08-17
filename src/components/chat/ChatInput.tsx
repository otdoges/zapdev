import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Globe, ArrowUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const handleCloneWebsiteClick = () => {
    setInput(prev => prev + (prev ? '\n\n' : '') + 'Clone this website URL: ');
    textareaRef.current?.focus();
    toast.success('Clone prompt added to chat!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 1 }}
      className="max-w-3xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Premium input container with enhanced design */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-blue-600/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-500"></div>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 to-blue-600/40 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
          <div className="relative glass-elevated rounded-2xl p-6 shadow-2xl border-white/10 hover:border-white/20 transition-all duration-300">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What would you like to build today? Describe your app, website, or coding challenge..."
              className="min-h-[140px] max-h-[300px] resize-none border-none bg-transparent text-lg placeholder:text-muted-foreground/60 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none transition-all duration-300 leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSubmit(e);
                }
              }}
            />
            
            {/* Premium action buttons with enhanced design */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div className="flex items-center space-x-3">
                {/* Enhanced quick action buttons */}
                <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <DialogTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="glass-hover rounded-xl px-4 py-2.5 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300 backdrop-blur-xl"
                        type="button"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Search Web
                      </Button>
                    </motion.div>
                  </DialogTrigger>
                  <DialogContent className="glass-elevated border-white/20">
                    <DialogHeader>
                      <DialogTitle className="text-gradient-static">Web Search</DialogTitle>
                    </DialogHeader>
                    {/* Search content here */}
                  </DialogContent>
                </Dialog>

                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="glass-hover rounded-xl px-4 py-2.5 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300 backdrop-blur-xl"
                    type="button"
                    onClick={handleCloneWebsiteClick}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Clone Website
                  </Button>
                </motion.div>
              </div>

              {/* Premium send button */}
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="button-gradient px-10 py-3.5 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTyping ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-4 h-4 mr-3" />
                      Start Building
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Input hints */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-sm text-muted-foreground/60">
            Press <kbd className="px-2 py-1 text-xs rounded bg-white/10 border border-white/20">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs rounded bg-white/10 border border-white/20">Enter</kbd> to send
          </p>
        </motion.div>
      </form>
    </motion.div>
  );
});