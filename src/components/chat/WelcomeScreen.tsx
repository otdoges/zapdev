import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import { ChatInput } from './ChatInput';



interface WelcomeScreenProps {
  onStartNewChat: () => void;
  input: string;
  setInput: (input: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleSubmit: (e: React.FormEvent) => void;
  isTyping: boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  input,
  setInput,
  textareaRef,
  handleSubmit,
  isTyping,
  isSearchOpen,
  setIsSearchOpen
}) => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8">
      <div className="text-center max-w-3xl mx-auto">
        {/* Optimized header with subtle animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-4xl font-bold mb-3 text-gradient-static">
            Welcome to ZapDev
          </h1>
          
          <p className="text-xl text-muted-foreground/80 mb-6">
            Your AI-powered development companion. Build full-stack applications and solve complex coding challenges.
          </p>
        </motion.div>

        {/* Simple call-to-action */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-blue-200 text-sm">Describe what you want to build</span>
          </div>
        </div>
      </div>
      
      {/* Message Input Bar */}
      <div className="w-full max-w-2xl">
        <ChatInput
          input={input}
          setInput={setInput}
          textareaRef={textareaRef}
          handleSubmit={handleSubmit}
          isTyping={isTyping}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
        />
      </div>
    </div>
  );
};